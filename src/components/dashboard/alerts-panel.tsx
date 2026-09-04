import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HeaderAlert } from "@/components/layout/header";

export function AlertsPanel({ alerts }: { alerts: HeaderAlert[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Smart alerts</CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {alerts.map((alert) => (
              <li key={alert.id}>
                <Link
                  href={alert.href}
                  className="flex items-start gap-2.5 rounded-md p-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
                  <span>
                    <span className="block font-medium text-foreground">{alert.title}</span>
                    <span className="text-xs text-muted-foreground">{alert.description}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
