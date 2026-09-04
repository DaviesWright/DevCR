"use client";

import Link from "next/link";
import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, Menu, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { Sidebar } from "@/components/layout/sidebar";
import { setActingUser } from "@/lib/actions/auth";
import { globalSearch, type SearchResults } from "@/lib/queries/search";

export type HeaderAlert = {
  id: string;
  title: string;
  description: string;
  href: string;
};

type CurrentUser = { id: string; name: string; roleName: string | null; isManager: boolean };
type AssignableUser = { id: string; name: string };

export function Header({
  alerts,
  currentUser,
  assignableUsers,
}: {
  alerts: HeaderAlert[];
  currentUser: CurrentUser;
  assignableUsers: AssignableUser[];
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const userName = currentUser.name;
  const searchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      globalSearch(q)
        .then((r) => setSearchResults(r))
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchGroups = searchResults
    ? [
        { label: "Leads", items: searchResults.leads },
        { label: "Customers", items: searchResults.customers },
        { label: "Units", items: searchResults.units },
      ].filter((g) => g.items.length > 0)
    : [];
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleSwitchUser(userId: string) {
    if (userId === currentUser.id) return;
    startTransition(async () => {
      await setActingUser(userId);
      router.refresh();
    });
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-card px-4">
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>

      <Link href="/" className="flex shrink-0 items-center gap-2">
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground"
        >
          D
        </span>
        <span className="font-heading text-lg font-semibold tracking-tight">DevCRM</span>
      </Link>

      <div ref={searchBoxRef} className="relative ml-2 hidden max-w-md flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search leads, customers, units..."
          aria-label="Global search"
          className="pl-9"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
        />
        {searchOpen && searchQuery.trim().length >= 2 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-md border border-border bg-card shadow-md">
            {searching && searchGroups.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">Searching…</p>
            ) : searchGroups.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">No matches for &ldquo;{searchQuery}&rdquo;.</p>
            ) : (
              searchGroups.map((group) => (
                <div key={group.label} className="border-b border-border py-1.5 last:border-0">
                  <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{group.label}</p>
                  {group.items.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="block px-3 py-1.5 text-sm hover:bg-muted"
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <span className="font-medium">{item.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{item.sublabel}</span>
                    </Link>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={`Notifications, ${alerts.length} unread`}
            >
              <Bell className="size-4" />
              {alerts.length > 0 && (
                <span aria-hidden="true" className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-destructive" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Alerts</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {alerts.length === 0 && (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
            )}
            {alerts.map((alert) => (
              <DropdownMenuItem key={alert.id} asChild className="flex-col items-start gap-0.5">
                <Link href={alert.href}>
                  <span className="text-sm font-medium">{alert.title}</span>
                  <span className="text-xs text-muted-foreground">{alert.description}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeSwitcher />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="ml-1 gap-2 px-2" aria-label="Account menu" disabled={pending}>
              <Avatar>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium lg:inline">{userName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {userName}
              {currentUser.roleName && (
                <span className="block text-xs font-normal text-muted-foreground">{currentUser.roleName}</span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Switch user (demo — no password)
            </DropdownMenuLabel>
            {assignableUsers.map((u) => (
              <DropdownMenuItem key={u.id} onClick={() => handleSwitchUser(u.id)} className="justify-between">
                {u.name}
                {u.id === currentUser.id && <Check className="size-3.5" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
