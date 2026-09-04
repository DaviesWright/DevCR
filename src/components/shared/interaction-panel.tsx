"use client";

// One interaction UI for Leads, Opportunities, and Customers — same six channel buttons, same
// log form, same timeline rendering everywhere. Each caller supplies onSubmit; where the entity
// stores interactions differs under the hood (LeadActivity, generic Interaction, or the
// Marketing-aware sendDirectMessage/logCustomerInteraction), the experience of logging one stays
// identical.
import * as React from "react";
import { Mail, Phone, MessageSquareText, MessageCircle, CalendarPlus, StickyNote, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { relativeTime, orEmpty } from "@/lib/utils";

export type InteractionType = "EMAIL" | "CALL" | "SMS" | "WHATSAPP" | "MEETING" | "NOTE" | "SITE_VISIT";

export type InteractionTimelineItem = {
  id: string;
  type: string;
  subject: string | null;
  notes: string | null;
  occurredAt: Date;
  by: string;
};

const CHANNEL_CONFIG: Record<string, { label: string; icon: typeof Mail; verb: string }> = {
  EMAIL: { label: "Email", icon: Mail, verb: "Log Email" },
  CALL: { label: "Call", icon: Phone, verb: "Log Call" },
  SMS: { label: "SMS", icon: MessageSquareText, verb: "Log SMS" },
  WHATSAPP: { label: "WhatsApp", icon: MessageCircle, verb: "Log WhatsApp" },
  MEETING: { label: "Meeting", icon: CalendarPlus, verb: "Schedule Meeting" },
  NOTE: { label: "Note", icon: StickyNote, verb: "Add Note" },
  SITE_VISIT: { label: "Site Visit", icon: CalendarPlus, verb: "Log Site Visit" },
};

const ACTION_BAR_CHANNELS: InteractionType[] = ["EMAIL", "CALL", "SMS", "WHATSAPP", "MEETING", "NOTE"];
const MESSAGE_CHANNELS = new Set(["EMAIL", "SMS", "WHATSAPP"]);

export function InteractionActionBar({
  onSubmit,
  loggedBy,
  supportsSend = false,
}: {
  onSubmit: (type: InteractionType, input: { subject?: string; notes?: string; occurredAt?: string }) => Promise<void>;
  loggedBy: string;
  /** Only Customer actually sends a simulated Email/SMS/WhatsApp message (via MarketingMessage);
   * on Lead/Opportunity those channels are logged like a call or meeting, not sent. Controls
   * whether the sheet's copy says "Send" (message required) or "Log" (notes optional). */
  supportsSend?: boolean;
}) {
  const [open, setOpen] = React.useState<InteractionType | null>(null);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {ACTION_BAR_CHANNELS.map((type) => {
          const config = CHANNEL_CONFIG[type];
          const Icon = config.icon;
          return (
            <Button key={type} variant="outline" size="sm" onClick={() => setOpen(type)}>
              <Icon className="size-3.5" /> {config.verb}
            </Button>
          );
        })}
      </div>
      <LogInteractionSheet type={open} onOpenChange={(o) => setOpen(o ? open : null)} onSubmit={onSubmit} loggedBy={loggedBy} supportsSend={supportsSend} />
    </>
  );
}

function LogInteractionSheet({
  type,
  onOpenChange,
  onSubmit,
  loggedBy,
  supportsSend,
}: {
  type: InteractionType | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (type: InteractionType, input: { subject?: string; notes?: string; occurredAt?: string }) => Promise<void>;
  loggedBy: string;
  supportsSend: boolean;
}) {
  const [subject, setSubject] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [occurredAt, setOccurredAt] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSubject("");
    setNotes("");
    setOccurredAt("");
    setError(null);
  }, [type]);

  if (!type) return null;
  const config = CHANNEL_CONFIG[type];
  const isMessage = supportsSend && MESSAGE_CHANNELS.has(type);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (isMessage && !notes.trim()) return;
    setPending(true);
    setError(null);
    try {
      await onSubmit(type as InteractionType, { subject: subject || undefined, notes: notes || undefined, occurredAt: occurredAt || undefined });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log this interaction.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Sheet open={!!type} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isMessage ? `Send via ${config.label}` : config.verb}</SheetTitle>
          <SheetDescription>
            {isMessage
              ? "Simulated — no email/SMS/WhatsApp provider is configured; this writes a real record."
              : `Logged by ${loggedBy}.`}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}
          {type === "MEETING" || type === "SITE_VISIT" ? (
            <div>
              <Label htmlFor="interactionWhen">When</Label>
              <Input id="interactionWhen" type="datetime-local" className="mt-1.5" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
            </div>
          ) : null}
          <div>
            <Label htmlFor="interactionSubject">Subject{isMessage ? "" : " / title"}</Label>
            <Input
              id="interactionSubject"
              className="mt-1.5"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={type === "CALL" ? "Phone call" : type === "MEETING" ? "Meeting" : undefined}
            />
          </div>
          <div>
            <Label htmlFor="interactionNotes">{isMessage ? "Message *" : "Notes"}</Label>
            <Textarea id="interactionNotes" className="mt-1.5" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} required={isMessage} />
          </div>
          <Button type="submit" disabled={pending || (isMessage && !notes.trim())}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} {isMessage ? "Send" : "Save"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function InteractionTimeline({ items }: { items: InteractionTimelineItem[] }) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No interactions logged yet.</p>;
  }
  return (
    <div className="flex flex-col divide-y divide-border">
      {items.map((item) => {
        const config = CHANNEL_CONFIG[item.type] ?? { label: item.type, icon: StickyNote };
        const Icon = config.icon;
        return (
          <div key={item.id} className="flex items-start gap-3 py-2.5">
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-foreground">{item.subject || config.label}</p>
                <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(item.occurredAt)}</span>
              </div>
              {item.notes && <p className="text-sm text-muted-foreground">{orEmpty(item.notes)}</p>}
              <p className="mt-0.5 text-xs text-muted-foreground">Logged by {item.by}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
