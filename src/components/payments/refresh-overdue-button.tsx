"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { refreshOverdueSchedules } from "@/lib/actions/payments";

export function RefreshOverdueButton({ currentUserId }: { currentUserId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await refreshOverdueSchedules(currentUserId);
          router.refresh();
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
      Refresh overdue status
    </Button>
  );
}
