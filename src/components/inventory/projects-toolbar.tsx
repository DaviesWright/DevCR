"use client";

import * as React from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportUnitsSheet } from "@/components/inventory/import-units-sheet";

export function ProjectsToolbar({ actorId }: { actorId: string }) {
  const [importOpen, setImportOpen] = React.useState(false);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={() => setImportOpen(true)}>
        <Upload className="size-4" /> Import CSV
      </Button>
      <Button variant="outline" asChild>
        <a href="/api/units/export">
          <Download className="size-4" /> Export CSV
        </a>
      </Button>
      <ImportUnitsSheet open={importOpen} onOpenChange={setImportOpen} actorId={actorId} />
    </div>
  );
}
