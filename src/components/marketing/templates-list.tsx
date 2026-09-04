"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, FileText, Pencil, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { createMessageTemplate, updateMessageTemplate, duplicateMessageTemplate, deleteMessageTemplate } from "@/lib/actions/marketing";
import type { getMessageTemplates } from "@/lib/queries/marketing";

type Template = Awaited<ReturnType<typeof getMessageTemplates>>[number];

const CHANNELS = ["EMAIL", "SMS", "WHATSAPP"];
const CHANNEL_VARIANT: Record<string, "info" | "success" | "highlight"> = {
  EMAIL: "info",
  SMS: "success",
  WHATSAPP: "highlight",
};

export function TemplatesList({ templates }: { templates: Template[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Template | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function duplicate(id: string) {
    setBusyId(id);
    await duplicateMessageTemplate(id);
    router.refresh();
    setBusyId(null);
  }

  async function remove(id: string) {
    if (!confirm("Delete this template? Campaigns that already reference it keep working, but it won't be selectable for new ones.")) return;
    setBusyId(id);
    await deleteMessageTemplate(id);
    router.refresh();
    setBusyId(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-3.5" /> New template
        </Button>
      </div>

      {templates.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No message templates yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-muted-foreground" />
                    <p className="font-heading text-base font-semibold text-foreground">{t.name}</p>
                  </div>
                  <Badge variant={CHANNEL_VARIANT[t.channel]}>{t.channel}</Badge>
                </div>
                {t.subject && <p className="text-sm text-foreground">{t.subject}</p>}
                <p className="line-clamp-2 text-sm text-muted-foreground">{t.bodyText || t.bodyHtml}</p>
                <div className="mt-1 flex justify-end gap-1.5">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(t)}>
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" disabled={busyId === t.id} onClick={() => duplicate(t.id)}>
                    {busyId === t.id ? <Loader2 className="size-3.5 animate-spin" /> : <Copy className="size-3.5" />} Duplicate
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={busyId === t.id} onClick={() => remove(t.id)}>
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TemplateFormSheet open={open} onOpenChange={setOpen} />
      <TemplateFormSheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)} template={editing ?? undefined} />
    </div>
  );
}

function TemplateFormSheet({
  open,
  onOpenChange,
  template,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: Template;
}) {
  const router = useRouter();
  const isEdit = !!template;
  const [name, setName] = React.useState(template?.name ?? "");
  const [channel, setChannel] = React.useState<string>(template?.channel ?? "EMAIL");
  const [subject, setSubject] = React.useState(template?.subject ?? "");
  const [body, setBody] = React.useState(template?.bodyText ?? template?.bodyHtml ?? "");
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    setName(template?.name ?? "");
    setChannel(template?.channel ?? "EMAIL");
    setSubject(template?.subject ?? "");
    setBody(template?.bodyText ?? template?.bodyHtml ?? "");
  }, [template]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !body.trim()) return;
    setPending(true);
    const payload = { name, channel, subject: channel === "EMAIL" ? subject : undefined, bodyText: body };
    if (isEdit && template) {
      await updateMessageTemplate(template.id, payload);
    } else {
      await createMessageTemplate(payload);
    }
    router.refresh();
    setPending(false);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit message template" : "New message template"}</SheetTitle>
          <SheetDescription>Reusable content for campaigns and journey steps — editing here updates every campaign that references it.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <div>
            <Label htmlFor="templateName">Name *</Label>
            <Input id="templateName" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>Channel</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {channel === "EMAIL" && (
            <div>
              <Label htmlFor="templateSubject">Subject</Label>
              <Input id="templateSubject" className="mt-1.5" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
          )}
          <div>
            <Label htmlFor="templateBody">Body *</Label>
            <Textarea id="templateBody" className="mt-1.5" rows={6} value={body} onChange={(e) => setBody(e.target.value)} required />
          </div>
          <Button type="submit" disabled={pending || !name.trim() || !body.trim()}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} {isEdit ? "Save changes" : "Create template"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
