"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, StickyNote } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toggleChecklistStep, updateChecklistStepNote } from "@/lib/actions/checklists";
import { cn, relativeTime } from "@/lib/utils";
import type { ChecklistRunDetail } from "@/lib/queries/checklists";

export function ChecklistRunDetailView({ run, currentUserId }: { run: ChecklistRunDetail; currentUserId: string }) {
  const router = useRouter();
  const [pendingStepId, setPendingStepId] = React.useState<string | null>(null);
  const [noteOpenStepId, setNoteOpenStepId] = React.useState<string | null>(null);

  async function handleToggle(stepId: string, completed: boolean) {
    setPendingStepId(stepId);
    await toggleChecklistStep(run.id, stepId, completed, currentUserId);
    router.refresh();
    setPendingStepId(null);
  }

  async function handleSaveNote(stepId: string, note: string) {
    setPendingStepId(stepId);
    await updateChecklistStepNote(run.id, stepId, note);
    router.refresh();
    setPendingStepId(null);
    setNoteOpenStepId(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {run.groups.map((group) => (
        <Card key={group.groupLabel}>
          <CardHeader>
            <CardTitle className="text-base">{group.groupLabel}</CardTitle>
            {group.crossDepartmental.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {group.crossDepartmental.map((cd, i) => (
                  <span key={i}>
                    <span className="font-medium text-foreground">{cd.department}:</span> {cd.description}
                  </span>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {group.steps.map((step) => (
              <div key={step.id} className="flex items-start gap-3">
                <Checkbox
                  checked={step.completed}
                  disabled={pendingStepId === step.id}
                  onCheckedChange={(v) => handleToggle(step.id, !!v)}
                  className="mt-0.5"
                  id={step.id}
                />
                <div className="flex-1">
                  <label
                    htmlFor={step.id}
                    className={cn(
                      "cursor-pointer text-sm text-foreground",
                      step.completed && "text-muted-foreground line-through"
                    )}
                  >
                    {step.label}
                  </label>
                  {step.kind === "QUALITY_CHECK" && !step.completed && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                      <AlertTriangle className="size-3" /> If unchecked → notify {step.notificationRecipient}: {step.notificationAction}
                    </p>
                  )}
                  {step.completed && step.completedByName && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {step.completedByName} · {step.completedAt ? relativeTime(step.completedAt) : ""}
                    </p>
                  )}
                  {step.kind === "QUALITY_CHECK" && (
                    <Badge variant="outline" className="mt-1">
                      Quality &amp; Control
                    </Badge>
                  )}
                  {step.note && noteOpenStepId !== step.id && (
                    <button
                      type="button"
                      onClick={() => setNoteOpenStepId(step.id)}
                      className="mt-1 flex items-start gap-1 text-left text-xs text-muted-foreground hover:text-foreground"
                    >
                      <StickyNote className="mt-0.5 size-3 shrink-0" /> {step.note}
                    </button>
                  )}
                  {noteOpenStepId === step.id ? (
                    <StepNoteEditor
                      initialNote={step.note ?? ""}
                      onSave={(note) => handleSaveNote(step.id, note)}
                      onCancel={() => setNoteOpenStepId(null)}
                      pending={pendingStepId === step.id}
                    />
                  ) : (
                    !step.note && (
                      <button
                        type="button"
                        onClick={() => setNoteOpenStepId(step.id)}
                        className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <StickyNote className="size-3" /> Add note
                      </button>
                    )
                  )}
                </div>
                {pendingStepId === step.id && <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StepNoteEditor({
  initialNote,
  onSave,
  onCancel,
  pending,
}: {
  initialNote: string;
  onSave: (note: string) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [note, setNote] = React.useState(initialNote);

  return (
    <div className="mt-1.5 flex flex-col gap-1.5">
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="What's pending, or details you'll fill in later..."
        rows={2}
        className="text-sm"
        autoFocus
      />
      <div className="flex gap-1.5">
        <Button type="button" size="sm" disabled={pending} onClick={() => onSave(note)}>
          {pending && <Loader2 className="size-3.5 animate-spin" />} Save note
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
