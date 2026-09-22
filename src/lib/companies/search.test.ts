import { db } from "@/lib/database/db";
import {
  searchCompanies,
  fetchCompanyProfile,
  replaceCompanyRecords,
  CompanyProviderError,
} from "@/lib/companies/search";

jest.mock("@/lib/database/db");

function record(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "cuid-1",
    companyNumber: "01234567",
    name: "Acme Ltd",
    status: "active",
    category: null,
    incorporationDate: null,
    addressLine1: null,
    addressLine2: null,
    locality: "London",
    region: null,
    postalCode: "E1 6AN",
    country: null,
    sicCodes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("searchCompanies", () => {
  it("returns nothing for a blank query without touching the database", async () => {
    const result = await searchCompanies("   ");
    expect(result).toEqual({ companies: [], totalResults: 0 });
    expect(db.companyRecord.findMany).not.toHaveBeenCalled();
  });

  it("ranks startsWith matches ahead of contains-only matches, case-insensitively", async () => {
    const starts = [record({ id: "1", name: "Acme Ltd" })];
    const contains = [record({ id: "2", name: "Big Acme Group" })];

    (db.companyRecord.findMany as jest.Mock)
      .mockResolvedValueOnce(starts) // startsWith query
      .mockResolvedValueOnce(contains); // remainder (contains, not startsWith)
    (db.companyRecord.count as jest.Mock).mockResolvedValue(2);

    const result = await searchCompanies("acme");

    expect(result.totalResults).toBe(2);
    expect(result.companies.map((c) => c.name)).toEqual(["Acme Ltd", "Big Acme Group"]);
    expect(db.companyRecord.findMany).toHaveBeenNthCalledWith(1, {
      where: { name: { startsWith: "acme", mode: "insensitive" } },
      orderBy: { name: "asc" },
      take: 20,
    });
  });

  it("skips the remainder query once startsWith alone fills the result limit", async () => {
    const full = Array.from({ length: 20 }, (_, i) => record({ id: String(i), name: `Acme ${i}` }));
    (db.companyRecord.findMany as jest.Mock).mockResolvedValueOnce(full);
    (db.companyRecord.count as jest.Mock).mockResolvedValue(20);

    const result = await searchCompanies("acme");

    expect(result.companies).toHaveLength(20);
    expect(db.companyRecord.findMany).toHaveBeenCalledTimes(1);
  });

  it("omits a synthetic (no real company number) placeholder from the mapped result", async () => {
    (db.companyRecord.findMany as jest.Mock)
      .mockResolvedValueOnce([record({ companyNumber: "no-number:acme ltd#ab12cd" })])
      .mockResolvedValueOnce([]);
    (db.companyRecord.count as jest.Mock).mockResolvedValue(1);

    const result = await searchCompanies("acme");

    expect(result.companies[0].companyNumber).toBeUndefined();
  });

  it("paginates past the first page with a plain name-ordered scan", async () => {
    (db.companyRecord.findMany as jest.Mock).mockResolvedValueOnce([record()]);
    (db.companyRecord.count as jest.Mock).mockResolvedValue(25);

    const result = await searchCompanies("acme", 20);

    expect(result.totalResults).toBe(25);
    expect(db.companyRecord.findMany).toHaveBeenCalledWith({
      where: { name: { contains: "acme", mode: "insensitive" } },
      orderBy: { name: "asc" },
      skip: 20,
      take: 20,
    });
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
      { name: "Acme Ltd", companyNumber: "01234567", status: "active", address: "1 High St" },
      { name: "No Number Co" },
    ]);

    expect(result).toEqual({ inserted: 2 });
    expect(tx.companyRecord.deleteMany).toHaveBeenCalledWith({});
    expect(tx.companyRecord.createMany).toHaveBeenCalledTimes(1);
    const data = tx.companyRecord.createMany.mock.calls[0][0].data;
    expect(data[0]).toEqual({
      companyNumber: "01234567",
      name: "Acme Ltd",
      status: "active",
      addressLine1: "1 High St",
    });
    // No company number in the source row -> a synthetic placeholder is generated
    // so the required-unique companyNumber column is still satisfied.
    expect(data[1].companyNumber).toMatch(/^no-number:no number co#/);
  });
});
