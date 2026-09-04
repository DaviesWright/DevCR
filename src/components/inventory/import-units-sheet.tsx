"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { parseCsvToRecords } from "@/lib/csv";
import { importUnitsCsv, type UnitCsvRow } from "@/lib/actions/inventory";

export function ImportUnitsSheet({ open, onOpenChange, actorId }: { open: boolean; onOpenChange: (open: boolean) => void; actorId: string }) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [rows, setRows] = React.useState<UnitCsvRow[]>([]);
  const [fileName, setFileName] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [result, setResult] = React.useState<{ createdCount: number; updatedCount: number; errors: { row: number; reason: string }[] } | null>(null);

  function reset() {
    setRows([]);
    setFileName("");
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    const text = await file.text();
    setRows(parseCsvToRecords(text) as UnitCsvRow[]);
  }

  async function submit() {
    if (rows.length === 0) return;
    setPending(true);
    const res = await importUnitsCsv(rows, actorId);
    setResult(res);
    setPending(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Import projects &amp; units from CSV</SheetTitle>
          <SheetDescription>
            Create new developments/units or amend an existing unit&apos;s price, block, floor, type, or status —
            no code changes needed. Re-upload anytime to update pricing.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-4">
          <a href="/api/units/export?template=1" className="flex w-fit items-center gap-1.5 text-sm text-primary hover:underline">
            <Download className="size-3.5" /> Download CSV template
          </a>
          <div>
            <Label htmlFor="unitsCsvFile">CSV file</Label>
            <input
              ref={fileInputRef}
              id="unitsCsvFile"
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              className="mt-1.5 block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Required columns: developmentName, projectCode, unitNumber, propertyType, price. Optional: region,
              location, blockName, floor, bedrooms, bathrooms, builtAreaSqm, currency, status.
            </p>
          </div>

          {rows.length > 0 && !result && (
            <div className="rounded-md border border-border p-3 text-sm">
              <p className="font-medium text-foreground">{fileName}</p>
              <p className="text-muted-foreground">{rows.length} row{rows.length === 1 ? "" : "s"} ready to import.</p>
            </div>
          )}

          {result && (
            <div className="flex flex-col gap-2">
              <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                Created {result.createdCount}, updated {result.updatedCount} of {rows.length} row{rows.length === 1 ? "" : "s"}.
              </div>
              {result.errors.length > 0 && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <p className="mb-1 font-medium">{result.errors.length} row{result.errors.length === 1 ? "" : "s"} skipped:</p>
                  <ul className="list-inside list-disc space-y-0.5">
                    {result.errors.map((e) => (
                      <li key={e.row}>Row {e.row}: {e.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <Button onClick={submit} disabled={rows.length === 0 || pending || !!result}>
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />} Import {rows.length > 0 ? `${rows.length} row${rows.length === 1 ? "" : "s"}` : ""}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
