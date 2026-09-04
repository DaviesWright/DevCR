import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { relativeTime } from "@/lib/utils";
import type { RecentActivityItem } from "@/lib/queries/dashboard";

export function RecentActivity({ items }: { items: RecentActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No activity logged yet.</p>
        ) : (
          <ol className="relative flex flex-col gap-4 border-l border-border pl-4">
            {items.map((item) => (
              <li key={item.id} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-[21px] top-1 size-2 rounded-full bg-highlight ring-4 ring-card"
                />
                <p className="text-sm capitalize text-foreground">{item.description}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.actor} · {relativeTime(item.occurredAt)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
