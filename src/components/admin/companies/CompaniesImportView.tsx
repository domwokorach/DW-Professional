"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Building2, CheckCircle2, Cloud, Loader2, UploadCloud } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const MAX_FILE_MB = 15;

// The one allow-listed import source — see src/lib/companies/s3-source.ts,
// which validates this exact string against the server's COMPANIES_S3_URI.
// There is deliberately no input for an operator to type a different one.
const COMPANIES_SOURCE_URI = "s3://dw-portfoilo/BasicCompanyDataAsOneFile-2026.csv";

interface ImportReport {
  imported: number;
  totalRows: number;
  skippedEmpty: number;
  duplicates: number;
  truncated: boolean;
  totalRecords: number;
}

interface SourceCheck {
  ok: boolean;
  category?: string;
  message: string;
}

interface S3ImportRun {
  id: string;
  status: "running" | "succeeded" | "failed";
  rowCount: number;
  rejectedRows: number;
  byteOffset: string;
  totalBytes: string | null;
  errorDetails: Array<{ reason: string; at?: string }>;
  startedAt: string;
  completedAt: string | null;
}

function formatBytes(value: string | null) {
  if (!value) return null;
  const bytes = Number(value);
  if (!Number.isFinite(bytes)) return null;
  const gb = bytes / 1024 ** 3;
  return gb >= 1 ? `${gb.toFixed(2)} GB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function S3ImportPanel() {
  const [sourceKey, setSourceKey] = useState<string | null>(null);
  const [run, setRun] = useState<S3ImportRun | null>(null);
  const [sourceCheck, setSourceCheck] = useState<SourceCheck | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "triggering" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);

  async function loadStatus() {
    try {
      const res = await fetch("/api/admin/companies/import/s3");
      const data = (await res.json().catch(() => null)) as {
        sourceKey?: string;
        run?: S3ImportRun;
        sourceCheck?: SourceCheck;
        error?: { message?: string };
      } | null;
      if (!res.ok) {
        setStatus("error");
        setMessage(data?.error?.message ?? "Unable to load import status.");
        return;
      }
      setSourceKey(data?.sourceKey ?? null);
      setRun(data?.run ?? null);
      setSourceCheck(data?.sourceCheck ?? null);
      setStatus("idle");
    } catch {
      setStatus("error");
      setMessage("Network error while loading import status.");
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function triggerImport() {
    setStatus("triggering");
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("sourceUri", COMPANIES_SOURCE_URI);

      const res = await fetch("/api/admin/companies/import/s3", { method: "POST", body: formData });
      const data = (await res.json().catch(() => null)) as {
        message?: string;
        run?: S3ImportRun;
        error?: { message?: string };
      } | null;

      if (!res.ok) {
        setStatus("error");
        setMessage(data?.error?.message ?? "Unable to validate the import source.");
        return;
      }

      setMessage(data?.message ?? null);
      if (data?.run) setRun(data.run);
      setStatus("idle");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  const totalBytesLabel = formatBytes(run?.totalBytes ?? null);
  const byteOffsetLabel = formatBytes(run?.byteOffset ?? null);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" aria-hidden="true" />
          Import from configured source
        </CardTitle>
        <CardDescription>
          Streams the full Companies House bulk dataset from the private AWS S3 bucket configured on the server —
          never a URL an operator can edit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-line bg-ink/40 p-4 text-xs text-muted">
          <p className="font-medium text-paper">Source</p>
          <p className="mt-1 break-all font-mono text-[11px]">{sourceKey ?? COMPANIES_SOURCE_URI}</p>
          <p className="mt-2">
            The transfer runs out-of-band (<code className="text-accent">npm run import:companies:s3</code>),
            never inside a page request or deploy — this panel only validates the source and reports progress.
            It&rsquo;s resumable and idempotent, so re-running it after a failure continues from where it left off
            without creating duplicates, and the previous dataset stays live until a run fully succeeds.
          </p>
        </div>

        {sourceCheck ? (
          <div
            className={cn(
              "flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm",
              sourceCheck.ok
                ? "border border-status-active-bg/60 bg-status-active-bg/10 text-status-active-fg"
                : "border border-status-negative-bg/60 bg-status-negative-bg/10 text-status-negative-fg"
            )}
            role="status"
          >
            {sourceCheck.ok ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>{sourceCheck.message}</span>
          </div>
        ) : null}

        {message ? (
          <div
            className={cn(
              "flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm",
              status === "error"
                ? "border border-status-negative-bg/60 bg-status-negative-bg/10 text-status-negative-fg"
                : "border border-line bg-ink/40 text-muted"
            )}
            role="status"
          >
            {status === "error" ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : null}
            <span>{message}</span>
          </div>
        ) : null}

        {run ? (
          <div className="space-y-1.5 rounded-lg border border-line bg-ink/40 px-3 py-2.5 text-sm">
            <div className="flex items-center gap-2 font-medium text-paper">
              {run.status === "succeeded" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-status-active-fg" aria-hidden="true" />
              ) : run.status === "failed" ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-status-negative-fg" aria-hidden="true" />
              ) : (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
              )}
              Last run: {run.status}
            </div>
            <p className="text-muted">
              {run.rowCount.toLocaleString()} rows imported, {run.rejectedRows.toLocaleString()} rejected.
              {totalBytesLabel ? ` ${byteOffsetLabel ?? "0"} of ${totalBytesLabel} transferred.` : ""}
            </p>
            <p className="text-muted">
              Started {new Date(run.startedAt).toLocaleString()}
              {run.completedAt ? `, completed ${new Date(run.completedAt).toLocaleString()}` : ""}.
            </p>
            {run.errorDetails?.length ? (
              <p className="text-status-negative-fg">
                Last error: {run.errorDetails[run.errorDetails.length - 1]?.reason}
              </p>
            ) : null}
          </div>
        ) : status === "idle" ? (
          <p className="text-sm text-muted">No import has been run from this source yet.</p>
        ) : null}

        <Button type="button" onClick={triggerImport} disabled={status === "triggering" || status === "loading"}>
          {status === "triggering" ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Validating…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Cloud className="h-4 w-4" aria-hidden="true" />
              Validate and queue import
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
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
      const data = (await res.json().catch(() => null)) as (ImportReport & { error?: { message?: string } }) | null;

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data?.error?.message ?? "Failed to import the CSV file.");
        return;
      }

      setReport(data);
      setTotalRecords(data?.totalRecords ?? totalRecords);
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

      <S3ImportPanel />
    </div>
  );
}
