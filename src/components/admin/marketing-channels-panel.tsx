"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  createMarketingChannelGroup,
  createMarketingChannel,
  toggleMarketingChannelActive,
  createMarketingMedium,
  toggleMarketingMediumActive,
} from "@/lib/actions/marketing-attribution";
import type { getMarketingChannelGroups, getMarketingMediums } from "@/lib/queries/reference";

type ChannelGroup = Awaited<ReturnType<typeof getMarketingChannelGroups>>[number];
type Medium = Awaited<ReturnType<typeof getMarketingMediums>>[number];

export function MarketingChannelsPanel({
  groups,
  mediums,
}: {
  groups: ChannelGroup[];
  mediums: Medium[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [newChannelGroupId, setNewChannelGroupId] = React.useState(groups[0]?.id ?? "");
  const [newChannelName, setNewChannelName] = React.useState("");
  const [newGroupName, setNewGroupName] = React.useState("");
  const [newMediumName, setNewMediumName] = React.useState("");
  const [addingChannel, setAddingChannel] = React.useState(false);
  const [addingGroup, setAddingGroup] = React.useState(false);
  const [addingMedium, setAddingMedium] = React.useState(false);

  async function handleToggleChannel(channelId: string, isActive: boolean) {
    setPendingId(channelId);
    try {
      await toggleMarketingChannelActive(channelId, isActive);
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  async function handleAddChannel() {
    if (!newChannelName.trim() || !newChannelGroupId) return;
    setAddingChannel(true);
    try {
      await createMarketingChannel(newChannelGroupId, newChannelName);
      setNewChannelName("");
      router.refresh();
    } finally {
      setAddingChannel(false);
    }
  }

  async function handleAddGroup() {
    if (!newGroupName.trim()) return;
    setAddingGroup(true);
    try {
      await createMarketingChannelGroup(newGroupName);
      setNewGroupName("");
      router.refresh();
    } finally {
      setAddingGroup(false);
    }
  }

  async function handleToggleMedium(mediumId: string, isActive: boolean) {
    setPendingId(mediumId);
    try {
      await toggleMarketingMediumActive(mediumId, isActive);
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  async function handleAddMedium() {
    if (!newMediumName.trim()) return;
    setAddingMedium(true);
    try {
      await createMarketingMedium(newMediumName);
      setNewMediumName("");
      router.refresh();
    } finally {
      setAddingMedium(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        {groups.map((group) => (
          <div key={group.id} className="rounded-md border border-border p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{group.name}</p>
            <div className="flex flex-wrap gap-1.5">
              {group.channels.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={pendingId === c.id}
                  onClick={() => handleToggleChannel(c.id, !c.isActive)}
                  title={c.isActive ? "Click to deactivate" : "Click to activate"}
                >
                  <Badge variant={c.isActive ? "secondary" : "outline"} className={cn("cursor-pointer", !c.isActive && "opacity-50")}>
                    {pendingId === c.id ? <Loader2 className="size-3 animate-spin" /> : <Power className="size-3" />}
                    {c.name}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Add channel</label>
            <div className="mt-1 flex gap-1.5">
              <Select value={newChannelGroupId} onValueChange={setNewChannelGroupId}>
                <SelectTrigger className="h-9 w-40 shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="h-9"
                placeholder="Channel name"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
              />
              <Button type="button" size="sm" disabled={addingChannel || !newChannelName.trim()} onClick={handleAddChannel}>
                {addingChannel ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Add group</label>
            <div className="mt-1 flex gap-1.5">
              <Input
                className="h-9"
                placeholder="New group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
              <Button type="button" size="sm" variant="outline" disabled={addingGroup || !newGroupName.trim()} onClick={handleAddGroup}>
                {addingGroup ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-border p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Mediums</p>
        <div className="flex flex-wrap gap-1.5">
          {mediums.map((m) => (
            <button
              key={m.id}
              type="button"
              disabled={pendingId === m.id}
              onClick={() => handleToggleMedium(m.id, !m.isActive)}
              title={m.isActive ? "Click to deactivate" : "Click to activate"}
            >
              <Badge variant={m.isActive ? "secondary" : "outline"} className={cn("cursor-pointer", !m.isActive && "opacity-50")}>
                {pendingId === m.id ? <Loader2 className="size-3 animate-spin" /> : <Power className="size-3" />}
                {m.name}
              </Badge>
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-1.5">
          <Input
            className="h-9 max-w-xs"
            placeholder="New medium name"
            value={newMediumName}
            onChange={(e) => setNewMediumName(e.target.value)}
          />
          <Button type="button" size="sm" variant="outline" disabled={addingMedium || !newMediumName.trim()} onClick={handleAddMedium}>
            {addingMedium ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
