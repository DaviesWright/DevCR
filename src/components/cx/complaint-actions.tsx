"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  MessageSquarePlus,
  ArrowUpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import {
  assignComplaint,
  addComplaintUpdate,
  escalateComplaint,
  resolveComplaint,
  closeComplaint,
  reopenComplaint,
  resolveEscalation,
  pauseComplaint,
  resumeComplaint,
} from "@/lib/actions/cx";

type Person = { id: string; name: string };

function useActionRunner() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function run(fn: () => Promise<void>, onDone?: () => void) {
    setPending(true);
    try {
      await fn();
      router.refresh();
      onDone?.();
    } finally {
      setPending(false);
    }
  }

  return { pending, run };
}

export function ComplaintActionBar({
  complaintId,
  status,
  isPaused,
  currentUser,
  assignableUsers,
}: {
  complaintId: string;
  status: string;
  isPaused: boolean;
  currentUser: Person;
  assignableUsers: Person[];
}) {
  const [openDialog, setOpenDialog] = React.useState<
    "assign" | "update" | "escalate" | "resolve" | "reopen" | "pause" | null
  >(null);
  const { pending, run } = useActionRunner();

  const isTerminal = status === "RESOLVED" || status === "CLOSED";

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {!isTerminal && (
          <Button variant="outline" size="sm" onClick={() => setOpenDialog("assign")}>
            <UserPlus className="size-3.5" /> Assign
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => setOpenDialog("update")}>
          <MessageSquarePlus className="size-3.5" /> Add Update
        </Button>
        {!isTerminal && (
          <Button variant="outline" size="sm" onClick={() => setOpenDialog("escalate")}>
            <ArrowUpCircle className="size-3.5" /> Escalate
          </Button>
        )}
        {!isTerminal && (
          <Button variant="outline" size="sm" onClick={() => setOpenDialog("resolve")}>
            <CheckCircle2 className="size-3.5" /> Resolve
          </Button>
        )}
        {!isTerminal && !isPaused && (
          <Button variant="outline" size="sm" onClick={() => setOpenDialog("pause")}>
            <PauseCircle className="size-3.5" /> Pause SLA
          </Button>
        )}
        {!isTerminal && isPaused && (
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => run(() => resumeComplaint(complaintId))}
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <PlayCircle className="size-3.5" />} Resume SLA
          </Button>
        )}
        {status === "RESOLVED" && (
          <Button
            variant="highlight"
            size="sm"
            disabled={pending}
            onClick={() => run(() => closeComplaint(complaintId))}
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5" />} Close
          </Button>
        )}
        {isTerminal && (
          <Button variant="outline" size="sm" onClick={() => setOpenDialog("reopen")}>
            <RotateCcw className="size-3.5" /> Reopen
          </Button>
        )}
      </div>

      <AssignComplaintSheet
        open={openDialog === "assign"}
        onOpenChange={(o) => setOpenDialog(o ? "assign" : null)}
        assignableUsers={assignableUsers}
        run={run}
        onAssign={(userId) => assignComplaint(complaintId, userId)}
      />
      <UpdateSheet
        open={openDialog === "update"}
        onOpenChange={(o) => setOpenDialog(o ? "update" : null)}
        complaintId={complaintId}
        currentUser={currentUser}
        run={run}
      />
      <EscalateSheet
        open={openDialog === "escalate"}
        onOpenChange={(o) => setOpenDialog(o ? "escalate" : null)}
        complaintId={complaintId}
        currentUser={currentUser}
        assignableUsers={assignableUsers}
        run={run}
      />
      <ResolveSheet
        open={openDialog === "resolve"}
        onOpenChange={(o) => setOpenDialog(o ? "resolve" : null)}
        complaintId={complaintId}
        currentUser={currentUser}
        run={run}
      />
      <ReopenSheet
        open={openDialog === "reopen"}
        onOpenChange={(o) => setOpenDialog(o ? "reopen" : null)}
        complaintId={complaintId}
        currentUser={currentUser}
        run={run}
      />
      <PauseSheet
        open={openDialog === "pause"}
        onOpenChange={(o) => setOpenDialog(o ? "pause" : null)}
        complaintId={complaintId}
        run={run}
      />
    </>
  );
}

function PauseSheet({
  open,
  onOpenChange,
  complaintId,
  run,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complaintId: string;
  run: (fn: () => Promise<void>, onDone?: () => void) => Promise<void>;
}) {
  const [reason, setReason] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    setPending(true);
    await run(
      () => pauseComplaint(complaintId, reason),
      () => {
        setReason("");
        onOpenChange(false);
      }
    );
    setPending(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Pause SLA clock</SheetTitle>
          <SheetDescription>
            Stops the response/resolution clock — use only while waiting on the client or a third party.
            Due dates shift forward by the paused duration on resume.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <div>
            <Label htmlFor="pauseReason">Reason *</Label>
            <Textarea
              id="pauseReason"
              className="mt-1.5"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Waiting for client details"
              required
            />
          </div>
          <Button type="submit" disabled={pending || !reason.trim()}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} Pause
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function AssignComplaintSheet({
  open,
  onOpenChange,
  assignableUsers,
  run,
  onAssign,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignableUsers: Person[];
  run: (fn: () => Promise<void>, onDone?: () => void) => Promise<void>;
  onAssign: (userId: string) => Promise<void>;
}) {
  const [userId, setUserId] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setPending(true);
    await run(() => onAssign(userId), () => onOpenChange(false));
    setPending(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Assign</SheetTitle>
          <SheetDescription>Choose who owns this complaint from here on.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <div>
            <Label>Assign to</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select someone" />
              </SelectTrigger>
              <SelectContent>
                {assignableUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={pending || !userId}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} Assign
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function UpdateSheet({
  open,
  onOpenChange,
  complaintId,
  currentUser,
  run,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complaintId: string;
  currentUser: Person;
  run: (fn: () => Promise<void>, onDone?: () => void) => Promise<void>;
}) {
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setPending(true);
    await run(
      () => addComplaintUpdate(complaintId, { note, updatedById: currentUser.id }),
      () => {
        setNote("");
        onOpenChange(false);
      }
    );
    setPending(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add update</SheetTitle>
          <SheetDescription>Logged by {currentUser.name}.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <div>
            <Label htmlFor="updateNote">Note</Label>
            <Textarea id="updateNote" className="mt-1.5" value={note} onChange={(e) => setNote(e.target.value)} required />
          </div>
          <Button type="submit" disabled={pending || !note.trim()}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} Save update
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function EscalateSheet({
  open,
  onOpenChange,
  complaintId,
  currentUser,
  assignableUsers,
  run,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complaintId: string;
  currentUser: Person;
  assignableUsers: Person[];
  run: (fn: () => Promise<void>, onDone?: () => void) => Promise<void>;
}) {
  const [toUserId, setToUserId] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!toUserId || !reason.trim()) return;
    setPending(true);
    await run(
      () => escalateComplaint(complaintId, { reason, fromUserId: currentUser.id, toUserId }),
      () => {
        setToUserId("");
        setReason("");
        onOpenChange(false);
      }
    );
    setPending(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Escalate</SheetTitle>
          <SheetDescription>Notifies the resolution chain — use for SLA-risk or high-severity issues.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <div>
            <Label>Escalate to *</Label>
            <Select value={toUserId} onValueChange={setToUserId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select someone" />
              </SelectTrigger>
              <SelectContent>
                {assignableUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="escalateReason">Reason *</Label>
            <Textarea
              id="escalateReason"
              className="mt-1.5"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="destructive" disabled={pending || !toUserId || !reason.trim()}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} Escalate
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function ResolveSheet({
  open,
  onOpenChange,
  complaintId,
  currentUser,
  run,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complaintId: string;
  currentUser: Person;
  run: (fn: () => Promise<void>, onDone?: () => void) => Promise<void>;
}) {
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    await run(
      () => resolveComplaint(complaintId, { note: note || undefined, userId: currentUser.id }),
      () => {
        setNote("");
        onOpenChange(false);
      }
    );
    setPending(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Resolve complaint</SheetTitle>
          <SheetDescription>Marks the resolution SLA as met. The complaint stays open until closed.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <div>
            <Label htmlFor="resolveNote">Resolution note</Label>
            <Textarea id="resolveNote" className="mt-1.5" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} Resolve
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function ReopenSheet({
  open,
  onOpenChange,
  complaintId,
  currentUser,
  run,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complaintId: string;
  currentUser: Person;
  run: (fn: () => Promise<void>, onDone?: () => void) => Promise<void>;
}) {
  const [reason, setReason] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    setPending(true);
    await run(
      () => reopenComplaint(complaintId, { reason, userId: currentUser.id }),
      () => {
        setReason("");
        onOpenChange(false);
      }
    );
    setPending(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Reopen complaint</SheetTitle>
          <SheetDescription>Capture why the client came back — feeds the repeat-complaint report.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <div>
            <Label htmlFor="reopenReason">Reason *</Label>
            <Textarea id="reopenReason" className="mt-1.5" value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>
          <Button type="submit" variant="destructive" disabled={pending || !reason.trim()}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} Reopen
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function ResolveEscalationButton({ escalationId, complaintId }: { escalationId: string; complaintId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function handleClick() {
    setPending(true);
    await resolveEscalation(escalationId, complaintId);
    router.refresh();
    setPending(false);
  }

  return (
    <Button variant="ghost" size="sm" disabled={pending} onClick={handleClick}>
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />} Resolve
    </Button>
  );
}
