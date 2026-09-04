"use client";

import * as React from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportLeadsSheet } from "@/components/leads/import-leads-sheet";

export function LeadsCsvActions({ actorId }: { actorId: string }) {
  const [importOpen, setImportOpen] = React.useState(false);

  return (
    <>
      <Button variant="outline" asChild>
        <a href="/api/leads/export">
          <Download className="size-4" /> Export CSV
        </a>
      </Button>
      <Button variant="outline" onClick={() => setImportOpen(true)}>
        <Upload className="size-4" /> Import CSV
      </Button>
      <ImportLeadsSheet open={importOpen} onOpenChange={setImportOpen} actorId={actorId} />
    </>
  );
}
