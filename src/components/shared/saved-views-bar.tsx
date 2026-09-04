"use client";

// Generic saved-view control reused across list pages (Leads, Customers, ...). The parent owns
// its own filter/sort/layout state and just hands this bar a snapshot of it to save, plus a
// callback to restore a saved snapshot — this component never interprets the state shape itself.
import * as React from "react";
import { Bookmark, Plus, Save, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { createSavedView, updateSavedView, deleteSavedView } from "@/lib/actions/saved-views";

const NONE = "__default__";

export type SavedView = { id: string; name: string; state: Record<string, unknown> };

export function SavedViewsBar<TState extends Record<string, unknown>>({
  entityType,
  currentUserId,
  views,
  currentState,
  onApply,
  revalidatePath,
}: {
  entityType: "LEAD" | "CUSTOMER" | "OPPORTUNITY";
  currentUserId: string;
  views: SavedView[];
  currentState: TState;
  onApply: (state: TState) => void;
  revalidatePath: string;
}) {
  const [selectedId, setSelectedId] = React.useState(NONE);
  const [saveOpen, setSaveOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const selected = views.find((v) => v.id === selectedId);

  function apply(id: string) {
    setSelectedId(id);
    const view = views.find((v) => v.id === id);
    if (view) onApply(view.state as TState);
  }

  async function saveOverExisting() {
    if (!selected) return;
    setPending(true);
    await updateSavedView(selected.id, currentState, revalidatePath);
    setPending(false);
  }

  async function remove() {
    if (!selected) return;
    setPending(true);
    await deleteSavedView(selected.id, revalidatePath);
    setSelectedId(NONE);
    setPending(false);
  }

  return (
    <div className="flex items-center gap-2">
      <Bookmark className="size-4 text-muted-foreground" />
      <Select value={selectedId} onValueChange={apply}>
        <SelectTrigger className="h-9 w-48">
          <SelectValue placeholder="Views" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Default view</SelectItem>
          {views.map((v) => (
            <SelectItem key={v.id} value={v.id}>
              {v.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected && (
        <>
          <Button variant="ghost" size="sm" disabled={pending} onClick={saveOverExisting} title="Save current filters/sort into this view">
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={pending} onClick={remove}>
            <Trash2 className="size-3.5" />
          </Button>
        </>
      )}
      <Button variant="outline" size="sm" onClick={() => setSaveOpen(true)}>
        <Plus className="size-3.5" /> Save as new view
      </Button>

      <SaveViewSheet
        open={saveOpen}
        onOpenChange={setSaveOpen}
        entityType={entityType}
        currentUserId={currentUserId}
        currentState={currentState}
        revalidatePath={revalidatePath}
        onCreated={(id) => setSelectedId(id)}
      />
    </div>
  );
}

function SaveViewSheet({
  open,
  onOpenChange,
  entityType,
  currentUserId,
  currentState,
  revalidatePath,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  entityType: "LEAD" | "CUSTOMER" | "OPPORTUNITY";
  currentUserId: string;
  currentState: Record<string, unknown>;
  revalidatePath: string;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setPending(true);
    const { viewId } = await createSavedView({ name, entityType, state: currentState, createdById: currentUserId, revalidate: revalidatePath });
    onCreated(viewId);
    setName("");
    setPending(false);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Save current view</SheetTitle>
          <SheetDescription>Saves the filters, sort, and layout you have set right now — reload it any time from the Views dropdown.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <div>
            <Label htmlFor="viewName">Name *</Label>
            <Input id="viewName" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>
          <Button type="submit" disabled={pending || !name.trim()}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} Save view
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
