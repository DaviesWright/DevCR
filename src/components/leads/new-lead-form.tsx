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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createLead } from "@/lib/actions/leads";

type Option = { id: string; name: string };
type ChannelGroupOption = { id: string; name: string; channels: Option[] };

export function NewLeadForm({
  sources,
  campaigns,
  channelGroups,
  mediums,
  propertyTypes,
  assignableUsers,
  referralCustomers,
  currentUserId,
}: {
  sources: Option[];
  campaigns: Option[];
  channelGroups: ChannelGroupOption[];
  mediums: Option[];
  propertyTypes: Option[];
  assignableUsers: Option[];
  referralCustomers: Option[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [nationality, setNationality] = React.useState("");
  const [segment, setSegment] = React.useState("");
  const [sourceId, setSourceId] = React.useState("");
  const [campaignId, setCampaignId] = React.useState("");
  const [channelId, setChannelId] = React.useState("");
  const [mediumId, setMediumId] = React.useState("");
  const [touchpoint, setTouchpoint] = React.useState("");
  const [referredByCustomerId, setReferredByCustomerId] = React.useState("");
  const [assignedToId, setAssignedToId] = React.useState(currentUserId);
  const [propertyTypeId, setPropertyTypeId] = React.useState("");
  const [preferredLocation, setPreferredLocation] = React.useState("");
  const [budgetMin, setBudgetMin] = React.useState("");
  const [budgetMax, setBudgetMax] = React.useState("");
  const [budgetCurrency, setBudgetCurrency] = React.useState("USD");
  const [notes, setNotes] = React.useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) return setError("First and last name are required.");
    if (!phone.trim()) return setError("Phone is required.");
    if (!sourceId) return setError("Select a lead source.");

    setPending(true);
    try {
      const { leadId } = await createLead({
        firstName,
        lastName,
        phone,
        email: email || undefined,
        nationality: nationality || undefined,
        segment: segment || undefined,
        sourceId,
        campaignId: campaignId || undefined,
        channelId: channelId || undefined,
        mediumId: mediumId || undefined,
        touchpoint: touchpoint || undefined,
        referredByCustomerId: referredByCustomerId || undefined,
        assignedToId: assignedToId || undefined,
        propertyTypeId: propertyTypeId || undefined,
        preferredLocation: preferredLocation || undefined,
        budgetMin: budgetMin ? parseFloat(budgetMin) : undefined,
        budgetMax: budgetMax ? parseFloat(budgetMax) : undefined,
        currency: budgetCurrency,
        notes: notes || undefined,
        actorId: currentUserId,
      });
      router.push(`/leads/${leadId}`);
    } catch {
      setError("Something went wrong creating this lead. Please try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="firstName">First name *</Label>
            <Input id="firstName" className="mt-1.5" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="lastName">Last name *</Label>
            <Input id="lastName" className="mt-1.5" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              type="tel"
              className="mt-1.5"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0244 123 456"
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" className="mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="nationality">Nationality</Label>
            <Input id="nationality" className="mt-1.5" value={nationality} onChange={(e) => setNationality(e.target.value)} />
          </div>
          <div>
            <Label>Buyer segment</Label>
            <Select value={segment} onValueChange={setSegment}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Not sure yet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOCAL_RESIDENTIAL">Local Residential</SelectItem>
                <SelectItem value="DIASPORA">Diaspora</SelectItem>
                <SelectItem value="CORPORATE">Corporate</SelectItem>
                <SelectItem value="INVESTOR">Investor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lead details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Source *</Label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select a source" />
              </SelectTrigger>
              <SelectContent>
                {sources.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Campaign</Label>
            <Select value={campaignId} onValueChange={setCampaignId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Channel</Label>
            <Select value={channelId} onValueChange={setChannelId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Not sure yet" />
              </SelectTrigger>
              <SelectContent>
                {channelGroups.map((g) => (
                  <SelectGroup key={g.id}>
                    {g.channels.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {g.name} — {c.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Medium</Label>
            <Select value={mediumId} onValueChange={setMediumId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Not sure yet" />
              </SelectTrigger>
              <SelectContent>
                {mediums.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="touchpoint">Touchpoint</Label>
            <Input
              id="touchpoint"
              className="mt-1.5"
              value={touchpoint}
              onChange={(e) => setTouchpoint(e.target.value)}
              placeholder="e.g. Landing Page Form, WhatsApp Conversation"
            />
          </div>
          <div>
            <Label>Referred by</Label>
            <Select value={referredByCustomerId} onValueChange={setReferredByCustomerId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="No referral" />
              </SelectTrigger>
              <SelectContent>
                {referralCustomers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Assign to</Label>
            <Select value={assignedToId} onValueChange={setAssignedToId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
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
            <Label>Property interest</Label>
            <Select value={propertyTypeId} onValueChange={setPropertyTypeId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Not sure yet" />
              </SelectTrigger>
              <SelectContent>
                {propertyTypes.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="preferredLocation">Preferred location</Label>
            <Input
              id="preferredLocation"
              className="mt-1.5"
              value={preferredLocation}
              onChange={(e) => setPreferredLocation(e.target.value)}
              placeholder="e.g. Accra, Kumasi"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Budget currency</Label>
            <Select value={budgetCurrency} onValueChange={setBudgetCurrency}>
              <SelectTrigger className="mt-1.5 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="GHS">GHS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="budgetMin">Budget min ({budgetCurrency})</Label>
              <Input
                id="budgetMin"
                type="number"
                min="0"
                step="1000"
                className="mt-1.5"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="budgetMax">Budget max ({budgetCurrency})</Label>
              <Input
                id="budgetMax"
                type="number"
                min="0"
                step="1000"
                className="mt-1.5"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" className="mt-1.5" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/leads")} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-3.5 animate-spin" />} Create lead
        </Button>
      </div>
    </form>
  );
}
