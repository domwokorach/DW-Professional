"use client";

import { useRef, useState } from "react";
import { AlertCircle, Building2, CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const MAX_FILE_MB = 15;

interface ImportReport {
  imported: number;
  totalRows: number;
  skippedEmpty: number;
  duplicates: number;
  truncated: boolean;
  totalRecords: number;
}

export default function CompaniesImportView({ initialTotalRecords }: { initialTotalRecords: number }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [totalRecords, setTotalRecords] = useState(initialTotalRecords);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(next: File | null) {
    setFile(next);
    setErrorMessage(null);
    if (status !== "uploading") setStatus("idle");
  }

  async function handleImport() {
    if (!file || status === "uploading") return;

    setStatus("uploading");
    setErrorMessage(null);
    setReport(null);

    try {
      const formData = new FormData();
      formData.set("file", file);

      const res = await fetch("/api/admin/companies/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data?.error?.message ?? "Failed to import the CSV file.");
        return;
      }

      setReport(data);
      setTotalRecords(data.totalRecords ?? totalRecords);
      setStatus("success");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
      <h1 className="text-2xl font-semibold text-paper">Companies</h1>
      <p className="mt-1 text-sm text-muted">
        Replace the company dataset used by the &ldquo;Company (optional)&rdquo; search field across the site.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" aria-hidden="true" />
            Company directory
          </CardTitle>
          <CardDescription>
            {totalRecords.toLocaleString()} {totalRecords === 1 ? "company" : "companies"} currently indexed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border border-line bg-ink/40 p-4 text-xs text-muted">
            <p className="font-medium text-paper">Expected CSV format</p>
            <p className="mt-1">
              A header row, then one company per row. Required column: <code className="text-accent">company_name</code>.
              Optional columns: <code className="text-accent">company_number</code>,{" "}
              <code className="text-accent">company_status</code>, <code className="text-accent">address</code>.
              Header names are matched case-insensitively (e.g. <code className="text-accent">Company Name</code> and{" "}
              <code className="text-accent">CompanyName</code> both work).
            </p>
            <p className="mt-2">
              Importing <strong className="text-paper">replaces the entire dataset</strong> — rows with no
              company_name are skipped, and duplicates (matched by company number, or by name when no number is
              given) are dropped, keeping the first occurrence.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="company-csv-file" className="block text-sm font-medium text-paper">
              CSV file
            </label>
            <input
              ref={inputRef}
              id="company-csv-file"
              type="file"
              accept=".csv,text/csv,application/vnd.ms-excel"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              className={cn(
                "block w-full text-sm text-muted file:mr-4 file:rounded-md file:border-0 file:bg-paper/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-paper hover:file:bg-paper/20",
                "cursor-pointer rounded-lg border border-line bg-transparent p-2"
              )}
            />
            <p className="text-xs text-muted">Max file size: {MAX_FILE_MB} MB. CSV files only.</p>
          </div>

          {status === "error" && errorMessage ? (
            <div className="flex items-start gap-2 rounded-lg border border-status-negative-bg/60 bg-status-negative-bg/10 px-3 py-2.5 text-sm text-status-negative-fg" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          {status === "success" && report ? (
            <div className="space-y-1.5 rounded-lg border border-status-active-bg/60 bg-status-active-bg/10 px-3 py-2.5 text-sm text-status-active-fg" role="status">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                Import complete
              </div>
              <p className="text-paper">
                Imported {report.imported.toLocaleString()} of {report.totalRows.toLocaleString()} rows.
              </p>
              <p className="text-muted">
                Skipped {report.skippedEmpty.toLocaleString()} empty row{report.skippedEmpty === 1 ? "" : "s"}, dropped{" "}
                {report.duplicates.toLocaleString()} duplicate{report.duplicates === 1 ? "" : "s"}.
                {report.truncated ? " The file exceeded the row limit — extra rows were not imported." : ""}
              </p>
            </div>
          ) : null}

          <Button type="button" onClick={handleImport} disabled={!file || status === "uploading"}>
            {status === "uploading" ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Importing…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UploadCloud className="h-4 w-4" aria-hidden="true" />
                Import and replace
              </span>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
