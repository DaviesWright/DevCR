"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { createMarketingPersona } from "@/lib/actions/marketing";
import type { getMarketingPersonas } from "@/lib/queries/marketing";

type Persona = Awaited<ReturnType<typeof getMarketingPersonas>>[number];

export function PersonasList({ personas }: { personas: Persona[] }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-3.5" /> New persona
        </Button>
      </div>

      {personas.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No personas yet. Personas seeded from Sales' "suspected persona" captures during the Real Opportunities
          stage will show up here too.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {personas.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-highlight" />
                  <p className="font-heading text-base font-semibold text-foreground">{p.name}</p>
                </div>
                {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                {p.suggestedChannels && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Suggested channels:</span> {p.suggestedChannels}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {p.campaignCount} campaign{p.campaignCount === 1 ? "" : "s"} · {p.signalCount} Sales signal
                  {p.signalCount === 1 ? "" : "s"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NewPersonaSheet open={open} onOpenChange={setOpen} />
    </div>
  );
}

function NewPersonaSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [suggestedChannels, setSuggestedChannels] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setPending(true);
    await createMarketingPersona({ name, description, suggestedChannels });
    router.refresh();
    setName("");
    setDescription("");
    setSuggestedChannels("");
    setPending(false);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>New persona</SheetTitle>
          <SheetDescription>A non-committal marketing tag, e.g. "Diaspora — Nostalgic Retiree".</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <div>
            <Label htmlFor="personaName">Name *</Label>
            <Input id="personaName" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="personaDescription">Description</Label>
            <Textarea id="personaDescription" className="mt-1.5" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="personaChannels">Suggested channels</Label>
            <Input
              id="personaChannels"
              className="mt-1.5"
              value={suggestedChannels}
              onChange={(e) => setSuggestedChannels(e.target.value)}
              placeholder="e.g. WhatsApp, email newsletter"
            />
          </div>
          <Button type="submit" disabled={pending || !name.trim()}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} Create persona
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
