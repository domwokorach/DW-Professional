import { parseCompanyCsv, CsvValidationError } from "@/lib/companies/csv-import";

describe("parseCompanyCsv", () => {
  it("parses a valid CSV using the standard headers", () => {
    const csv = [
      "company_name,company_number,company_status,address",
      "Acme Ltd,01234567,active,\"1 High Street, London\"",
      "Beta Corp,07654321,dissolved,10 Park Road",
    ].join("\n");

    const result = parseCompanyCsv(csv);

    expect(result.imported).toBe(2);
    expect(result.totalRows).toBe(2);
    expect(result.skippedEmpty).toBe(0);
    expect(result.duplicates).toBe(0);
    expect(result.truncated).toBe(false);
    expect(result.records).toEqual([
      { name: "Acme Ltd", companyNumber: "01234567", status: "active", address: "1 High Street, London" },
      { name: "Beta Corp", companyNumber: "07654321", status: "dissolved", address: "10 Park Road" },
    ]);
  });

  it("recognizes Companies House bulk-export header names too", () => {
    const csv = [
      "CompanyName,CompanyNumber,CompanyStatus,RegAddress.AddressLine1",
      "Gamma PLC,SC000111,Active,221B Baker Street",
    ].join("\n");

    const result = parseCompanyCsv(csv);

    expect(result.records).toEqual([
      { name: "Gamma PLC", companyNumber: "SC000111", status: "Active", address: "221B Baker Street" },
    ]);
  });

  it("throws for a completely empty file", () => {
    expect(() => parseCompanyCsv("")).toThrow(CsvValidationError);
  });

  it("throws when the file has only blank lines", () => {
    expect(() => parseCompanyCsv("\n\n   \n")).toThrow(CsvValidationError);
  });

  it("throws when the required company_name column is missing", () => {
    const csv = ["company_number,company_status", "01234567,active"].join("\n");
    expect(() => parseCompanyCsv(csv)).toThrow(/company_name/);
  });

  it("skips rows with an empty company name", () => {
    const csv = [
      "company_name,company_number",
      "Acme Ltd,01234567",
      ",00000000",
      "   ,00000001",
      "Beta Corp,07654321",
    ].join("\n");

    const result = parseCompanyCsv(csv);

    expect(result.imported).toBe(2);
    expect(result.skippedEmpty).toBe(2);
    expect(result.records.map((r) => r.name)).toEqual(["Acme Ltd", "Beta Corp"]);
  });

  it("drops duplicate rows by company number, keeping the first occurrence", () => {
    const csv = [
      "company_name,company_number,company_status",
      "Acme Ltd,01234567,active",
      "Acme Limited,01234567,dissolved",
      "acme ltd,01234567,active",
    ].join("\n");

    const result = parseCompanyCsv(csv);

    expect(result.imported).toBe(1);
    expect(result.duplicates).toBe(2);
    expect(result.records[0]).toEqual({ name: "Acme Ltd", companyNumber: "01234567", status: "active", address: undefined });
  });

  it("drops duplicate rows by normalized name when no company number is given", () => {
    const csv = [
      "company_name,company_status",
      "Acme Ltd,active",
      "  acme   ltd  ,active",
      "ACME LTD,dissolved",
    ].join("\n");

    const result = parseCompanyCsv(csv);

    expect(result.imported).toBe(1);
    expect(result.duplicates).toBe(2);
  });

  it("treats rows without a company number as distinct from rows with one, even for the same name", () => {
    const csv = [
      "company_name,company_number",
      "Acme Ltd,01234567",
      "Acme Ltd,",
    ].join("\n");

    const result = parseCompanyCsv(csv);

    expect(result.imported).toBe(2);
    expect(result.duplicates).toBe(0);
  });

  it("handles quoted fields containing commas and escaped quotes", () => {
    const csv = [
      "company_name,address",
      '"Smith, Jones & Co","1 ""Quoted"" Lane, London"',
    ].join("\n");

    const result = parseCompanyCsv(csv);

    expect(result.records).toEqual([{ name: "Smith, Jones & Co", companyNumber: undefined, status: undefined, address: '1 "Quoted" Lane, London' }]);
  });

  it("ignores fully blank lines between rows", () => {
    const csv = ["company_name", "Acme Ltd", "", "   ", "Beta Corp"].join("\n");

    const result = parseCompanyCsv(csv);

    expect(result.records.map((r) => r.name)).toEqual(["Acme Ltd", "Beta Corp"]);
  });

  it("strips a leading UTF-8 BOM from the header row", () => {
    const csv = "﻿company_name\nAcme Ltd";

    const result = parseCompanyCsv(csv);

    expect(result.records).toEqual([{ name: "Acme Ltd", companyNumber: undefined, status: undefined, address: undefined }]);
  });

  it("matches headers case-insensitively and ignoring separators", () => {
    const csv = ["Company Name,Company Number", "Acme Ltd,01234567"].join("\n");
    const result = parseCompanyCsv(csv);
    expect(result.records[0].companyNumber).toBe("01234567");
  });
});
