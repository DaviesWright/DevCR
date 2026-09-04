"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { NAV_ITEMS, QUICK_ACTIONS } from "@/components/layout/nav-config";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-6 border-r border-border bg-card px-3 py-5 md:flex">
      <div>
        <h2 className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Quick actions
        </h2>
        <div className="mt-2 flex flex-col gap-1">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Plus className="size-3.5 text-highlight" aria-hidden="true" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      <Separator />

      <nav aria-label="Modules" className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.comingSoon) {
            return (
              <div
                key={item.label}
                aria-disabled="true"
                title="Coming soon"
                className="flex cursor-not-allowed items-center justify-between rounded-md px-2 py-2 text-sm text-muted-foreground/60"
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </span>
                <span className="text-[10px] uppercase tracking-wide">Soon</span>
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
              {isActive && <span aria-hidden="true" className="ml-auto h-4 w-0.5 rounded-full bg-highlight" />}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
