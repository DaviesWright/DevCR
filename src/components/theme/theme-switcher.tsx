"use client";

import { Check, Moon, Palette, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { THEMES, useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

const SWATCHES: Record<string, [string, string]> = {
  "devtraco-plus": ["#141110", "#d4af37"],
  woodlands: ["#2f5233", "#d4af37"],
  generic: ["#5b2a41", "#d9a45e"],
};

export function ThemeSwitcher() {
  const { theme, mode, setTheme, toggleMode } = useTheme();

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Change brand theme">
            <Palette className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Brand theme</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {THEMES.map((t) => (
            <DropdownMenuItem key={t.id} onSelect={() => setTheme(t.id)} className="justify-between">
              <span className="flex items-center gap-2">
                <span className="flex overflow-hidden rounded-full ring-1 ring-border" aria-hidden="true">
                  <span className="size-3.5" style={{ backgroundColor: SWATCHES[t.id][0] }} />
                  <span className="size-3.5" style={{ backgroundColor: SWATCHES[t.id][1] }} />
                </span>
                <span className="flex flex-col">
                  <span className="text-sm">{t.label}</span>
                  <span className="text-xs text-muted-foreground">{t.description}</span>
                </span>
              </span>
              {theme === t.id && <Check className="size-4 shrink-0" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon"
        aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        onClick={toggleMode}
      >
        <Sun className={cn("size-4 transition-all", mode === "dark" && "hidden")} />
        <Moon className={cn("size-4 transition-all", mode === "light" && "hidden")} />
      </Button>
    </div>
  );
}
