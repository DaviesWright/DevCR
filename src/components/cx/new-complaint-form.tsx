"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createComplaint } from "@/lib/actions/cx";

type CustomerUnitOption = { customerId: string; unitId: string; label: string };
type CategoryOption = { id: string; name: string; defaultPriority: string };
type Option = { id: string; name: string };

export function NewComplaintForm({
  customerUnits,
  categories,
  assignableUsers,
}: {
  customerUnits: CustomerUnitOption[];
  categories: CategoryOption[];
  assignableUsers: Option[];
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [customerUnitKey, setCustomerUnitKey] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [priority, setPriority] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [assignedToId, setAssignedToId] = React.useState("");

  React.useEffect(() => {
    const category = categories.find((c) => c.id === categoryId);
    if (category) setPriority(category.defaultPriority);
  }, [categoryId, categories]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!customerUnitKey) return setError("Select a customer.");
    if (!categoryId) return setError("Select a category.");
    if (!subject.trim() || !description.trim()) return setError("Subject and description are required.");

    const [customerId, unitId] = customerUnitKey.split(":");
    setPending(true);
    try {
      const { complaintId } = await createComplaint({
        customerId,
        unitId: unitId || undefined,
        categoryId,
        subject,
        description,
        priority: priority || undefined,
        assignedToId: assignedToId || undefined,
      });
      router.push(`/cx/complaints/${complaintId}`);
    } catch {
      setError("Something went wrong logging this complaint. Please try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Complaint details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Customer & unit *</Label>
            <Select value={customerUnitKey} onValueChange={setCustomerUnitKey}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customerUnits.map((cu) => (
                  <SelectItem key={`${cu.customerId}:${cu.unitId}`} value={`${cu.customerId}:${cu.unitId}`}>
                    {cu.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Category *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Set by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input id="subject" className="mt-1.5" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              className="mt-1.5"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Assign to</Label>
            <Select value={assignedToId} onValueChange={setAssignedToId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Unassigned" />
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
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/cx")} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-3.5 animate-spin" />} Log complaint
        </Button>
      </div>
    </form>
  );
}
