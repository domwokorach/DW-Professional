import { companyDb as db } from "@/lib/database/company-db";
import {
  searchCompanies,
  fetchCompanyProfile,
  replaceCompanyRecords,
  CompanyProviderError,
  COMPANY_SEARCH_RESULT_LIMIT,
} from "@/lib/companies/search";

jest.mock("@/lib/database/company-db");

function record(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "cuid-1",
    companyNumber: "01234567",
    name: "Acme Ltd",
    nameNormalized: "acme ltd",
    status: "active",
    category: null,
    incorporationDate: null,
    addressLine1: null,
    addressLine2: null,
    locality: "London",
    region: null,
    postalCode: "E1 6AN",
    postcodeNormalized: "e16an",
    country: null,
    uri: null,
    importGeneration: BigInt(0),
    sicCodes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Every search runs a "does this look like an exact company number" tier
// first (see COMPANY_NUMBER_PATTERN in search.ts) — most short alphanumeric
// test queries match that pattern, so findMany is queued to return empty
// for it unless a test is specifically exercising the number tier.
function mockTiers(...results: unknown[][]) {
  const mock = db.companyRecord.findMany as jest.Mock;
  for (const r of results) mock.mockResolvedValueOnce(r);
  mock.mockResolvedValue([]);
}

describe("searchCompanies", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns nothing for a blank query without touching the database", async () => {
    const result = await searchCompanies("   ");
    expect(result).toEqual({ companies: [], totalResults: 0 });
    expect(db.companyRecord.findMany).not.toHaveBeenCalled();
  });

  it("prioritises an exact company-number match above everything else", async () => {
    const byNumber = record({ id: "1", companyNumber: "01234567", name: "Acme Ltd" });
    mockTiers([byNumber]);

    const result = await searchCompanies("01234567");

    expect(result.companies.map((c) => c.id)).toEqual(["1"]);
    expect(db.companyRecord.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { companyNumber: { equals: "01234567", mode: "insensitive" } },
      })
    );
  });

  it("ranks an exact name match ahead of a prefix match", async () => {
    const exact = record({ id: "1", name: "Acme", nameNormalized: "acme" });
    const prefix = record({ id: "2", name: "Acme Group", nameNormalized: "acme group" });
    // number tier (empty), exact-name tier, prefix tier
    mockTiers([], [exact], [prefix]);

    const result = await searchCompanies("Acme");

    expect(result.companies.map((c) => c.id)).toEqual(["1", "2"]);
  });

  it("matches a postcode with or without spaces, case-insensitively", async () => {
    const byPostcode = record({ id: "1", postalCode: "SW1A 2AA", postcodeNormalized: "sw1a2aa" });
    // number tier, exact-name, prefix, postcode tier
    mockTiers([], [], [], [byPostcode]);

    const result = await searchCompanies("sw1a 2aa");

    expect(result.companies.map((c) => c.id)).toEqual(["1"]);
    const calls = (db.companyRecord.findMany as jest.Mock).mock.calls;
    const postcodeCall = calls.find(([args]) => "postcodeNormalized" in (args.where ?? {}));
    expect(postcodeCall[0].where).toEqual({ postcodeNormalized: "sw1a2aa" });
  });

  it("flags datasetEmpty when a search finds nothing because the table is empty", async () => {
    mockTiers([], [], [], [], []); // every tier empty
    (db.companyRecord.count as jest.Mock).mockResolvedValue(0);

    const result = await searchCompanies("acme");

    expect(result).toEqual({ companies: [], totalResults: 0, datasetEmpty: true });
  });

  it("does not flag datasetEmpty for an ordinary no-match search", async () => {
    mockTiers([], [], [], [], []); // every tier empty
    (db.companyRecord.count as jest.Mock).mockResolvedValue(5000);

    const result = await searchCompanies("zzzznomatch");

    expect(result).toEqual({ companies: [], totalResults: 0 });
  });

  it("falls back to a fuzzy (substring) name match", async () => {
    const fuzzy = record({ id: "1", name: "Big Acme Group", nameNormalized: "big acme group" });
    // number, exact-name, prefix, postcode, fuzzy
    mockTiers([], [], [], [], [fuzzy]);

    const result = await searchCompanies("acme");

    expect(result.companies.map((c) => c.id)).toEqual(["1"]);
  });

  it("never returns more than COMPANY_SEARCH_RESULT_LIMIT results", async () => {
    const many = Array.from({ length: 15 }, (_, i) => record({ id: String(i), name: `Acme ${i}` }));
    mockTiers([], many);

    const result = await searchCompanies("acme");

    expect(result.companies).toHaveLength(COMPANY_SEARCH_RESULT_LIMIT);
  });

  it("omits a synthetic (no real company number) placeholder from the mapped result", async () => {
    mockTiers([], [record({ companyNumber: "no-number:acme ltd#ab12cd" })]);

    const result = await searchCompanies("acme");

    expect(result.companies[0].companyNumber).toBeUndefined();
  });

  it("preserves leading zeroes on a company number in the mapped result", async () => {
    mockTiers([record({ companyNumber: "00012345" })]);

    const result = await searchCompanies("00012345");

    expect(result.companies[0].companyNumber).toBe("00012345");
  });
});

describe("fetchCompanyProfile", () => {
  it("rejects an invalid company number without querying the database", async () => {
    await expect(fetchCompanyProfile("not valid!")).rejects.toThrow(CompanyProviderError);
    expect(db.companyRecord.findUnique).not.toHaveBeenCalled();
  });

  it("throws a 404 CompanyProviderError when no record matches", async () => {
    (db.companyRecord.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(fetchCompanyProfile("01234567")).rejects.toMatchObject({ status: 404 });
  });

  it("returns status and SIC codes for a known company", async () => {
    (db.companyRecord.findUnique as jest.Mock).mockResolvedValue(
      record({ status: "dissolved", sicCodes: ["62012"] })
    );
    const profile = await fetchCompanyProfile("01234567");
    expect(profile).toEqual({ status: "dissolved", sicCodes: ["62012"] });
  });
});

describe("replaceCompanyRecords", () => {
  it("deletes all existing records and inserts the new ones inside one transaction", async () => {
    type Tx = { companyRecord: { deleteMany: jest.Mock; createMany: jest.Mock } };
    const tx: Tx = {
      companyRecord: { deleteMany: jest.fn(), createMany: jest.fn() },
    };
    (db.$transaction as jest.Mock).mockImplementation(async (fn: (tx: Tx) => Promise<void>) => fn(tx));

    const result = await replaceCompanyRecords([
      { name: "Acme Ltd", companyNumber: "01234567", status: "active", address: "1 High St", postcode: "SW1A 2AA" },
      { name: "No Number Co" },
    ]);

    expect(result).toEqual({ inserted: 2 });
    expect(tx.companyRecord.deleteMany).toHaveBeenCalledWith({});
    expect(tx.companyRecord.createMany).toHaveBeenCalledTimes(1);
    const data = tx.companyRecord.createMany.mock.calls[0][0].data;
    expect(data[0]).toEqual(
      expect.objectContaining({
        companyNumber: "01234567",
        name: "Acme Ltd",
        nameNormalized: "acme ltd",
        status: "active",
        addressLine1: "1 High St",
        postalCode: "SW1A 2AA",
        postcodeNormalized: "sw1a2aa",
      })
    );
    // No company number in the source row -> a synthetic placeholder is generated
    // so the required-unique companyNumber column is still satisfied.
    expect(data[1].companyNumber).toMatch(/^no-number:no number co#/);
  });
});
