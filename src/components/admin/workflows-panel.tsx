"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Zap, Trash2, Webhook as WebhookIcon, Power } from "lucide-react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { relativeTime } from "@/lib/utils";
import { createWorkflow, toggleWorkflowActive, deleteWorkflow, createWebhook, toggleWebhookActive, deleteWebhook } from "@/lib/actions/workflow-admin";
import type { getWorkflows, getRecentWorkflowRuns, getWebhooks } from "@/lib/queries/workflows";
import type { getMessageTemplates } from "@/lib/queries/marketing";

type Workflow = Awaited<ReturnType<typeof getWorkflows>>[number];
type Run = Awaited<ReturnType<typeof getRecentWorkflowRuns>>[number];
type Webhook = Awaited<ReturnType<typeof getWebhooks>>[number];
type EmailTemplate = Awaited<ReturnType<typeof getMessageTemplates>>[number];

const TRIGGER_EVENTS = [
  ["LEAD_CREATED", "Lead created"],
  ["LEAD_STATUS_CHANGED", "Lead status changed"],
  ["LEAD_ASSIGNED", "Lead assigned to consultant"],
  ["OPPORTUNITY_CREATED", "Opportunity created"],
  ["OPPORTUNITY_STAGE_CHANGED", "Opportunity stage changed"],
  ["RESERVATION_CREATED", "Reservation created"],
  ["MILESTONE_DEPOSIT_CONFIRMED", "Milestone: deposit confirmed"],
  ["MILESTONE_SPA_SIGNED_CLIENT", "Milestone: SPA signed by client"],
  ["MILESTONE_SPA_SIGNED_DEVTRACO", "Milestone: SPA signed by Devtraco"],
  ["MILESTONE_UNIT_ALLOCATED", "Milestone: unit allocated"],
  ["SALE_CREATED", "Sale created (Closed Won)"],
  ["PAYMENT_RECORDED", "Payment recorded"],
  ["PAYMENT_OVERDUE", "Payment overdue"],
  ["HANDOVER_SCHEDULED", "Handover scheduled"],
  ["HANDOVER_COMPLETED", "Handover completed"],
  ["COMPLAINT_CREATED", "Complaint created"],
  ["COMPLAINT_RESOLVED", "Complaint resolved"],
] as const;

const ACTION_TYPES = [
  ["CREATE_TASK", "Create a task"],
  ["LOG_INTERACTION", "Log a note"],
  ["CALL_WEBHOOK", "Call a webhook"],
  ["SEND_EMAIL", "Send an email"],
] as const;

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  SUCCESS: "success",
  PARTIAL: "warning",
  FAILED: "destructive",
};

export function WorkflowsPanel({
  workflows,
  runs,
  webhooks,
  emailTemplates,
  currentUserId,
}: {
  workflows: Workflow[];
  runs: Run[];
  webhooks: Webhook[];
  emailTemplates: EmailTemplate[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [workflowSheetOpen, setWorkflowSheetOpen] = React.useState(false);
  const [webhookSheetOpen, setWebhookSheetOpen] = React.useState(false);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function toggleWorkflow(id: string, active: boolean) {
    setPendingId(id);
    await toggleWorkflowActive(id, active);
    router.refresh();
    setPendingId(null);
  }
  async function removeWorkflow(id: string) {
    setPendingId(id);
    await deleteWorkflow(id);
    router.refresh();
    setPendingId(null);
  }
  async function toggleHook(id: string, active: boolean) {
    setPendingId(id);
    await toggleWebhookActive(id, active);
    router.refresh();
    setPendingId(null);
  }
  async function removeHook(id: string) {
    setPendingId(id);
    await deleteWebhook(id);
    router.refresh();
    setPendingId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Webhooks</p>
          <Button variant="outline" size="sm" onClick={() => setWebhookSheetOpen(true)}>
            <Plus className="size-3.5" /> New webhook
          </Button>
        </div>
        {webhooks.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No webhooks yet — add one to call an external API from a workflow step.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {webhooks.map((w) => (
              <Card key={w.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <div className="flex items-center gap-2">
                    <WebhookIcon className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{w.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {w.event} → {w.url} · {w.triggerCount} calls{w.failureCount > 0 ? `, ${w.failureCount} failed` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={w.isActive ? "success" : "secondary"}>{w.isActive ? "Active" : "Paused"}</Badge>
                    <Button variant="ghost" size="sm" disabled={pendingId === w.id} onClick={() => toggleHook(w.id, !w.isActive)}>
                      <Power className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={pendingId === w.id} onClick={() => removeHook(w.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Workflows</p>
          <Button variant="outline" size="sm" onClick={() => setWorkflowSheetOpen(true)}>
            <Plus className="size-3.5" /> New workflow
          </Button>
        </div>
        {workflows.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No workflows yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {workflows.map((w) => (
              <Card key={w.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <div className="flex items-center gap-2">
                    <Zap className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{w.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {TRIGGER_EVENTS.find(([v]) => v === w.triggerEvent)?.[1] ?? w.triggerEvent} · {w.steps.length} step{w.steps.length === 1 ? "" : "s"} · {w.runCount} run{w.runCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={w.isActive ? "success" : "secondary"}>{w.isActive ? "Active" : "Paused"}</Badge>
                    <Button variant="ghost" size="sm" disabled={pendingId === w.id} onClick={() => toggleWorkflow(w.id, !w.isActive)}>
                      <Power className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={pendingId === w.id} onClick={() => removeWorkflow(w.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {runs.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Recent runs</p>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm font-medium">{r.workflowName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.entityType}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{relativeTime(r.triggeredAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <NewWebhookSheet open={webhookSheetOpen} onOpenChange={setWebhookSheetOpen} />
      <NewWorkflowSheet
        open={workflowSheetOpen}
        onOpenChange={setWorkflowSheetOpen}
        webhooks={webhooks}
        emailTemplates={emailTemplates}
        currentUserId={currentUserId}
      />
    </div>
  );
}

function NewWebhookSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [event, setEvent] = React.useState("");
  const [secret, setSecret] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !url.trim() || !event.trim()) return;
    setPending(true);
    await createWebhook({ name, url, event, secret: secret || undefined });
    router.refresh();
    setName("");
    setUrl("");
    setEvent("");
    setSecret("");
    setPending(false);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>New webhook</SheetTitle>
          <SheetDescription>An external endpoint a workflow step can POST to (e.g. Slack, Zapier, a custom integration).</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <div>
            <Label htmlFor="webhookName">Name *</Label>
            <Input id="webhookName" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="webhookUrl">URL *</Label>
            <Input id="webhookUrl" type="url" className="mt-1.5" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" required />
          </div>
          <div>
            <Label htmlFor="webhookEvent">Event label</Label>
            <Input id="webhookEvent" className="mt-1.5" value={event} onChange={(e) => setEvent(e.target.value)} placeholder="e.g. lead.qualified" required />
          </div>
          <div>
            <Label htmlFor="webhookSecret">Secret (optional)</Label>
            <Input id="webhookSecret" className="mt-1.5" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Sent as X-Webhook-Secret header" />
          </div>
          <Button type="submit" disabled={pending || !name.trim() || !url.trim() || !event.trim()}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} Create webhook
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

type StepDraft = {
  actionType: string;
  title: string;
  description: string;
  subject: string;
  notes: string;
  webhookId: string;
  templateId: string;
  recipient: string;
};

function NewWorkflowSheet({
  open,
  onOpenChange,
  webhooks,
  emailTemplates,
  currentUserId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  webhooks: Webhook[];
  emailTemplates: EmailTemplate[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [triggerEvent, setTriggerEvent] = React.useState<string>("LEAD_CREATED");
  const [steps, setSteps] = React.useState<StepDraft[]>([]);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function addStep() {
    setSteps((prev) => [
      ...prev,
      {
        actionType: "CREATE_TASK",
        title: "",
        description: "",
        subject: "",
        notes: "",
        webhookId: webhooks[0]?.id ?? "",
        templateId: emailTemplates[0]?.id ?? "",
        recipient: "CUSTOMER",
      },
    ]);
  }
  function updateStep(i: number, patch: Partial<StepDraft>) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function removeStep(i: number) {
    setSteps((prev) => prev.filter((_, idx) => idx !== i));
  }

  function reset() {
    setName("");
    setDescription("");
    setTriggerEvent("LEAD_CREATED");
    setSteps([]);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || steps.length === 0) return;
    setPending(true);
    setError(null);
    try {
      await createWorkflow({
        name,
        description,
        triggerEvent,
        createdById: currentUserId,
        steps: steps.map((s) => ({
          actionType: s.actionType,
          actionConfig: (s.actionType === "CREATE_TASK"
            ? { title: s.title, description: s.description }
            : s.actionType === "LOG_INTERACTION"
              ? { subject: s.subject, notes: s.notes }
              : s.actionType === "SEND_EMAIL"
                ? { templateId: s.templateId, recipient: s.recipient }
                : { webhookId: s.webhookId }) as Record<string, string>,
        })),
      });
      router.refresh();
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create this workflow.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>New workflow</SheetTitle>
          <SheetDescription>Fires automatically the moment the trigger event happens — no schedule, real-time.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          <div>
            <Label htmlFor="workflowName">Name *</Label>
            <Input id="workflowName" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="workflowDescription">Description</Label>
            <Textarea id="workflowDescription" className="mt-1.5" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <Label>Trigger</Label>
            <Select value={triggerEvent} onValueChange={setTriggerEvent}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_EVENTS.map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border border-border p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Steps (run in order)</p>
              <Button type="button" variant="ghost" size="sm" onClick={addStep}>
                <Plus className="size-3.5" /> Add step
              </Button>
            </div>
            {steps.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">No steps yet — add at least one.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {steps.map((step, i) => (
                  <div key={i} className="rounded-md bg-muted p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Select value={step.actionType} onValueChange={(v) => updateStep(i, { actionType: v })}>
                        <SelectTrigger className="h-8 flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTION_TYPES.map(([v, l]) => (
                            <SelectItem key={v} value={v}>
                              {l}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeStep(i)}>
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                    {step.actionType === "CREATE_TASK" && (
                      <div className="flex flex-col gap-2">
                        <Input placeholder="Task title" value={step.title} onChange={(e) => updateStep(i, { title: e.target.value })} />
                        <Input placeholder="Description (optional)" value={step.description} onChange={(e) => updateStep(i, { description: e.target.value })} />
                      </div>
                    )}
                    {step.actionType === "LOG_INTERACTION" && (
                      <div className="flex flex-col gap-2">
                        <Input placeholder="Subject" value={step.subject} onChange={(e) => updateStep(i, { subject: e.target.value })} />
                        <Input placeholder="Note text" value={step.notes} onChange={(e) => updateStep(i, { notes: e.target.value })} />
                      </div>
                    )}
                    {step.actionType === "CALL_WEBHOOK" && (
                      <Select value={step.webhookId} onValueChange={(v) => updateStep(i, { webhookId: v })}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder={webhooks.length === 0 ? "No webhooks yet" : "Select a webhook"} />
                        </SelectTrigger>
                        <SelectContent>
                          {webhooks.map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                              {w.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {step.actionType === "SEND_EMAIL" && (
                      <div className="flex flex-col gap-2">
                        <Select value={step.templateId} onValueChange={(v) => updateStep(i, { templateId: v })}>
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder={emailTemplates.length === 0 ? "No email templates yet" : "Select a template"} />
                          </SelectTrigger>
                          <SelectContent>
                            {emailTemplates.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={step.recipient} onValueChange={(v) => updateStep(i, { recipient: v })}>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CUSTOMER">Send to the customer</SelectItem>
                            <SelectItem value="CONSULTANT">Send to the assigned consultant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" disabled={pending || !name.trim() || steps.length === 0}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} Create workflow
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
