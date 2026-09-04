"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail, RefreshCw, Unlink, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { relativeTime } from "@/lib/utils";
import { syncEmailAccountNow, disconnectEmailAccount } from "@/lib/actions/integrations";
import type { getEmailConnectionsForUser } from "@/lib/actions/integrations";

type Connection = Awaited<ReturnType<typeof getEmailConnectionsForUser>>[number];

export function EmailIntegrations({
  connections,
  googleConfigured,
  microsoftConfigured,
}: {
  connections: Connection[];
  googleConfigured: boolean;
  microsoftConfigured: boolean;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const google = connections.find((c) => c.provider === "GOOGLE");
  const microsoft = connections.find((c) => c.provider === "MICROSOFT");

  async function sync(id: string) {
    setPendingId(id);
    try {
      await syncEmailAccountNow(id);
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  async function disconnect(id: string) {
    setPendingId(id);
    try {
      await disconnectEmailAccount(id);
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <ProviderRow
        label="Gmail"
        connectHref="/api/integrations/google/connect"
        configured={googleConfigured}
        connection={google}
        pending={pendingId === google?.id}
        onSync={() => google && sync(google.id)}
        onDisconnect={() => google && disconnect(google.id)}
      />
      <ProviderRow
        label="Outlook"
        connectHref="/api/integrations/microsoft/connect"
        configured={microsoftConfigured}
        connection={microsoft}
        pending={pendingId === microsoft?.id}
        onSync={() => microsoft && sync(microsoft.id)}
        onDisconnect={() => microsoft && disconnect(microsoft.id)}
      />
    </div>
  );
}

function ProviderRow({
  label,
  connectHref,
  configured,
  connection,
  pending,
  onSync,
  onDisconnect,
}: {
  label: string;
  connectHref: string;
  configured: boolean;
  connection?: Connection;
  pending: boolean;
  onSync: () => void;
  onDisconnect: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <Mail className="size-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">{label}</p>
            {connection ? (
              <p className="text-xs text-muted-foreground">
                {connection.email} · {connection.lastSyncedAt ? `Synced ${relativeTime(connection.lastSyncedAt)}` : "Not yet synced"}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{configured ? "Not connected" : "Not configured — add API credentials to .env"}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {connection ? (
            <>
              <Badge variant={connection.status === "CONNECTED" ? "success" : "destructive"} dot>
                {connection.status === "CONNECTED" ? (
                  <>
                    <CheckCircle2 className="size-3" /> Connected
                  </>
                ) : (
                  <>
                    <AlertTriangle className="size-3" /> Error
                  </>
                )}
              </Badge>
              <Button variant="outline" size="sm" onClick={onSync} disabled={pending}>
                {pending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />} Sync now
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDisconnect} disabled={pending}>
                <Unlink className="size-3.5" /> Disconnect
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" disabled={!configured} asChild={configured}>
              {configured ? <a href={connectHref}>Connect {label}</a> : <span>Connect {label}</span>}
            </Button>
          )}
        </div>
        {connection?.lastSyncError && (
          <p className="w-full text-xs text-destructive">{connection.lastSyncError}</p>
        )}
      </CardContent>
    </Card>
  );
}
