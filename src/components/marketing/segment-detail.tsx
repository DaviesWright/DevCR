"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { refreshMarketingSegment, removeCustomerFromSegment, addCustomerToSegment } from "@/lib/actions/marketing";
import { relativeTime, orEmpty } from "@/lib/utils";
import { CHANNEL_LABEL } from "@/components/marketing/segments-list";
import type { getMarketingSegmentDetail, getCustomersForListPicker } from "@/lib/queries/marketing";

type SegmentDetail = NonNullable<Awaited<ReturnType<typeof getMarketingSegmentDetail>>>;
type CustomerOption = Awaited<ReturnType<typeof getCustomersForListPicker>>[number];

export function SegmentDetailView({ segment, customerOptions }: { segment: SegmentDetail; customerOptions: CustomerOption[] }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [addCustomerId, setAddCustomerId] = React.useState("");
  const [adding, setAdding] = React.useState(false);

  async function refresh() {
    setPending(true);
    await refreshMarketingSegment(segment.id);
    router.refresh();
    setPending(false);
  }

  async function remove(customerId: string) {
    await removeCustomerFromSegment(segment.id, customerId);
    router.refresh();
  }

  async function addCustomer() {
    if (!addCustomerId) return;
    setAdding(true);
    await addCustomerToSegment(segment.id, addCustomerId);
    setAddCustomerId("");
    setAdding(false);
    router.refresh();
  }

  const criteriaEntries = Object.entries(segment.criteria).filter(([, v]) => v !== undefined && v !== "");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {segment.isDynamic
              ? segment.lastComputedAt
                ? `Last refreshed ${relativeTime(segment.lastComputedAt)}`
                : "Not yet computed"
              : "Manual list — add customers below"}
            {segment.createdBy ? ` · Created by ${segment.createdBy}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {!segment.isDynamic && <Badge variant="outline">Manual list</Badge>}
            {segment.channel && <Badge variant="secondary">{CHANNEL_LABEL[segment.channel] ?? segment.channel}</Badge>}
            {criteriaEntries.map(([key, value]) => (
              <Badge key={key} variant="outline">
                {key.replace(/([A-Z])/g, " $1").toLowerCase()}: {String(value)}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={addCustomerId} onValueChange={setAddCustomerId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Add a customer..." />
            </SelectTrigger>
            <SelectContent>
              {customerOptions.length === 0 ? (
                <SelectItem value="__none__" disabled>
                  No more customers to add
                </SelectItem>
              ) : (
                customerOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={addCustomer} disabled={!addCustomerId || adding}>
            {adding ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />} Add
          </Button>
          {segment.isDynamic && (
            <Button variant="outline" size="sm" onClick={refresh} disabled={pending}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />} Refresh
            </Button>
          )}
        </div>
      </div>

      {(segment.campaigns.length > 0 || segment.journeys.length > 0) && (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {segment.campaigns.length > 0 && <span>Used by {segment.campaigns.length} campaign(s)</span>}
          {segment.journeys.length > 0 && <span>Used by {segment.journeys.length} journey(s)</span>}
        </div>
      )}

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Segment</TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {segment.members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No members yet.
                </TableCell>
              </TableRow>
            ) : (
              segment.members.map((m) => {
                const optedOut =
                  segment.channel === "EMAIL"
                    ? m.customer.optOutEmail
                    : segment.channel === "SMS"
                      ? m.customer.optOutSms
                      : segment.channel === "WHATSAPP"
                        ? m.customer.optOutWhatsapp
                        : false;
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">{m.customer.name}</p>
                      <p className="text-xs text-muted-foreground">{orEmpty(m.customer.email)}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{orEmpty(m.customer.phone)}</TableCell>
                    <TableCell className="text-sm">{orEmpty(m.customer.segment)}</TableCell>
                    <TableCell className="text-sm tabular-nums">{m.customer.engagementScore}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex flex-wrap items-center gap-1">
                        {relativeTime(m.addedAt)}
                        {m.manuallyAdded && <Badge variant="outline">manual</Badge>}
                        {optedOut && <Badge variant="warning">opted out</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => remove(m.customer.id)} title="Remove from list">
                        <UserMinus className="size-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
