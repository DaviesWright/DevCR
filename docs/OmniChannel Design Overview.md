1. Design Overview
1.1 Concept
This page visualizes the omnichannel interaction options available for each customer, inspired by the "Omnichannel Commerce Solutions" concept. The design centers the Customer with all available communication channels radiating outward, showing which channels are active, available, and preferred.

1.2 Design Principles
Principle	Description
Customer-Centric	Customer is the center of all interactions
Visual Clarity	Channels displayed in a clear, organized radial layout
Action-Oriented	Each channel is clickable and leads to action
Status Visibility	Show which channels are available, preferred, or opted-out
Consistent Branding	Uses Devtraco brand colors and design language
1.3 Visual Design Reference
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    OMNICHANNEL CUSTOMER INTERACTION                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                         ┌─────────────────────┐                            │
│                         │                     │                            │
│                    ┌────│    Social Media     │────┐                       │
│                    │    │    (LinkedIn, FB,   │    │                       │
│                    │    │     Instagram)      │    │                       │
│                    │    └─────────────────────┘    │                       │
│                    │                                │                       │
│          ┌─────────┴────────┐            ┌─────────┴────────┐              │
│          │                  │            │                  │              │
│          │    Website       │            │   Mobile App     │              │
│          │    (Web Portal)  │            │   (CX Portal)    │              │
│          │                  │            │                  │              │
│          └─────────┬────────┘            └─────────┬────────┘              │
│                    │                                │                       │
│                    │      ┌──────────────────┐      │                       │
│                    │      │                  │      │                       │
│                    └─────▶│    CUSTOMER      │◀─────┘                       │
│                           │                  │                              │
│                           └──────────────────┘                              │
│                                                                             │
│          ┌─────────────────┐                ┌─────────────────┐            │
│          │                 │                │                 │            │
│          │    Chatbots     │                │     Email       │            │
│          │   (AI Support)  │                │   (Marketing)   │            │
│          │                 │                │                 │            │
│          └─────────────────┘                └─────────────────┘            │
│                    │                                │                       │
│                    │    ┌─────────────────────┐    │                       │
│                    │    │                     │    │                       │
│                    └────│  Digital Marketplaces│────┘                       │
│                         │  (Property Listings)│                            │
│                         └─────────────────────┘                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  📱 WhatsApp    ✉️ Email    📞 Phone    💬 SMS    🔔 Push    🖥️ Web   ││
│  │   Available      Available   Available   Available   Available  Active  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  Quick Actions: [Send Email] [Send SMS] [Schedule Visit] [Log Call]        │
└─────────────────────────────────────────────────────────────────────────────┘
2. Prisma Schema Additions
2.1 Channel Preference Model
Add to prisma/schema.prisma:

prisma
model ChannelPreference {
  id              String   @id @default(cuid())
  customerId      String
  customer        Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  // Channel availability
  emailAvailable  Boolean  @default(false)
  emailOptedIn    Boolean  @default(false)
  emailVerified   Boolean  @default(false)
  
  phoneAvailable  Boolean  @default(false)
  phoneOptedIn    Boolean  @default(false)
  phoneVerified   Boolean  @default(false)
  
  smsAvailable    Boolean  @default(false)
  smsOptedIn      Boolean  @default(false)
  smsVerified     Boolean  @default(false)
  
  whatsappAvailable Boolean @default(false)
  whatsappOptedIn   Boolean @default(false)
  whatsappVerified  Boolean @default(false)
  
  webAvailable    Boolean  @default(true)
  webOptedIn      Boolean  @default(true)
  
  appAvailable    Boolean  @default(false)
  appOptedIn      Boolean  @default(false)
  
  socialAvailable Boolean  @default(false)
  socialOptedIn   Boolean  @default(false)
  
  chatbotAvailable Boolean @default(true)
  chatbotOptedIn   Boolean @default(true)
  
  marketplaceAvailable Boolean @default(false)
  marketplaceOptedIn   Boolean @default(false)
  
  inPersonAvailable Boolean @default(true)
  inPersonOptedIn   Boolean @default(true)
  
  // Customer preferences
  preferredChannel String?  // EMAIL, SMS, WHATSAPP, PHONE, IN_PERSON
  preferredTimeOfDay String?
  preferredContactFrequency String?
  doNotContact     Boolean  @default(false)
  
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([customerId])
}
2.2 Channel Interaction Model
prisma
model ChannelInteraction {
  id              String   @id @default(cuid())
  customerId      String
  customer        Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  channel         String   // EMAIL, SMS, WHATSAPP, PHONE, SOCIAL, CHAT, APP, WEB, MARKETPLACE, IN_PERSON
  type            String   // INBOUND, OUTBOUND
  direction       String   // TO_CUSTOMER, FROM_CUSTOMER
  
  initiatedAt     DateTime @default(now())
  respondedAt     DateTime?
  completedAt     DateTime?
  
  status          String   // PENDING, IN_PROGRESS, COMPLETED, FAILED
  outcome         String?  // SUCCESS, RESOLVED, ESCALATED, NO_RESPONSE
  
  channelMetadata Json?    // Channel-specific data (e.g., message_id, session_id)
  content         Json?    // Message content, call notes, etc.
  duration        Int?     // Duration in seconds (for calls/meetings)
  
  handledBy       String?  // User ID or system ID
  escalatedTo     String?  // User ID
  
  sentiment       String?  // POSITIVE, NEUTRAL, NEGATIVE
  sentimentScore  Float?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([customerId])
  @@index([channel])
  @@index([status])
  @@index([createdAt])
  @@index([initiatedAt])
}
2.3 Migration
bash
npx prisma migrate dev --name add_channel_preferences_and_interactions
npx prisma generate
3. API Routes
3.1 Channel Interactions API
File: app/api/customer/[id]/channels/route.ts

typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ChannelService } from '@/services/channel.service';

// GET /api/customer/[id]/channels
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const customerId = params.id;

    // Get customer with channel preferences
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        channelPreference: true,
        properties: {
          take: 1
        }
      }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get recent channel interactions
    const recentInteractions = await prisma.channelInteraction.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Get channel availability and status
    const channelStatus = await ChannelService.getChannelStatus(customer);

    // Get interaction statistics
    const stats = await ChannelService.getInteractionStats(customerId);

    return NextResponse.json({
      success: true,
      data: {
        customer,
        channels: channelStatus,
        recentInteractions,
        stats,
        lastActivity: await ChannelService.getLastActivity(customerId)
      }
    });
  } catch (error) {
    console.error('Channel fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

// POST /api/customer/[id]/channels/interact
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const customerId = params.id;
    const body = await request.json();
    const { channel, type, content, scheduledAt } = body;

    const interaction = await ChannelService.initiateInteraction({
      customerId,
      channel,
      type,
      content,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      handledBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: interaction
    });
  } catch (error) {
    console.error('Interaction error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
3.2 Channel Service
File: services/channel.service.ts

typescript
import { prisma } from '@/lib/prisma';
import { ChannelRouterInstance } from './channels/channel-router';

interface ChannelStatus {
  id: string;
  name: string;
  icon: string;
  available: boolean;
  optedIn: boolean;
  verified: boolean;
  preferred: boolean;
  lastUsed: Date | null;
  interactionCount: number;
  color: string;
  actions: ChannelAction[];
}

interface ChannelAction {
  label: string;
  action: string;
  icon: string;
  enabled: boolean;
}

export class ChannelService {
  private static instance: ChannelService;

  static getInstance(): ChannelService {
    if (!ChannelService.instance) {
      ChannelService.instance = new ChannelService();
    }
    return ChannelService.instance;
  }

  /**
   * Get channel status for a customer
   */
  async getChannelStatus(customer: any): Promise<ChannelStatus[]> {
    const preferences = customer.channelPreference;
    const interactions = await prisma.channelInteraction.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' }
    });

    const channelConfigs = this.getChannelConfigs();

    return channelConfigs.map(config => {
      const lastInteraction = interactions.find(i => i.channel === config.id);
      const interactionCount = interactions.filter(i => i.channel === config.id).length;

      return {
        id: config.id,
        name: config.name,
        icon: config.icon,
        available: this.isChannelAvailable(config.id, customer, preferences),
        optedIn: this.isChannelOptedIn(config.id, preferences),
        verified: this.isChannelVerified(config.id, customer, preferences),
        preferred: customer.preferredChannel === config.id,
        lastUsed: lastInteraction?.createdAt || null,
        interactionCount,
        color: config.color,
        actions: this.getChannelActions(config.id, customer, preferences)
      };
    });
  }

  /**
   * Initiate an interaction through a channel
   */
  async initiateInteraction(params: {
    customerId: string;
    channel: string;
    type: string;
    content: any;
    scheduledAt?: Date;
    handledBy: string;
  }) {
    const { customerId, channel, type, content, scheduledAt, handledBy } = params;

    // Create interaction record
    const interaction = await prisma.channelInteraction.create({
      data: {
        customerId,
        channel,
        type,
        direction: type === 'INBOUND' ? 'FROM_CUSTOMER' : 'TO_CUSTOMER',
        initiatedAt: new Date(),
        status: scheduledAt ? 'PENDING' : 'IN_PROGRESS',
        content,
        handledBy,
        channelMetadata: { scheduledAt }
      }
    });

    // If not scheduled, send immediately
    if (!scheduledAt) {
      // Get customer
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      });

      if (customer) {
        // Send through appropriate channel
        await ChannelRouterInstance.sendMessage({
          customer,
          channel: channel as any,
          body: content?.body || '',
          subject: content?.subject || '',
          templateData: content?.templateData || {}
        });
      }
    }

    return interaction;
  }

  /**
   * Get interaction statistics
   */
  async getInteractionStats(customerId: string) {
    const interactions = await prisma.channelInteraction.findMany({
      where: { customerId }
    });

    const total = interactions.length;
    const inbound = interactions.filter(i => i.direction === 'FROM_CUSTOMER').length;
    const outbound = interactions.filter(i => i.direction === 'TO_CUSTOMER').length;
    const resolved = interactions.filter(i => i.status === 'COMPLETED' && i.outcome === 'RESOLVED').length;
    const escalated = interactions.filter(i => i.outcome === 'ESCALATED').length;

    // Channel breakdown
    const byChannel: Record<string, number> = {};
    for (const interaction of interactions) {
      byChannel[interaction.channel] = (byChannel[interaction.channel] || 0) + 1;
    }

    // Sentiment breakdown
    const sentiment: Record<string, number> = {};
    for (const interaction of interactions) {
      if (interaction.sentiment) {
        sentiment[interaction.sentiment] = (sentiment[interaction.sentiment] || 0) + 1;
      }
    }

    // Daily trends (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentInteractions = interactions.filter(
      i => new Date(i.createdAt) >= thirtyDaysAgo
    );

    const dailyTrends: Record<string, number> = {};
    for (const interaction of recentInteractions) {
      const date = new Date(interaction.createdAt).toISOString().split('T')[0];
      dailyTrends[date] = (dailyTrends[date] || 0) + 1;
    }

    return {
      total,
      inbound,
      outbound,
      resolved,
      escalated,
      resolutionRate: total > 0 ? (resolved / total) * 100 : 0,
      byChannel,
      sentiment,
      dailyTrends,
      averageResponseTime: this.calculateAvgResponseTime(interactions)
    };
  }

  /**
   * Get last activity timestamp
   */
  async getLastActivity(customerId: string): Promise<Date | null> {
    const last = await prisma.channelInteraction.findFirst({
      where: { customerId },
      orderBy: { createdAt: 'desc' }
    });

    return last?.createdAt || null;
  }

  /**
   * Get channel configurations
   */
  private getChannelConfigs() {
    return [
      {
        id: 'WEBSITE',
        name: 'Website',
        icon: '🌐',
        color: '#0019F9',
        description: 'Web portal and property listings'
      },
      {
        id: 'APP',
        name: 'Mobile App',
        icon: '📱',
        color: '#00A86A',
        description: 'CX Portal mobile application'
      },
      {
        id: 'SOCIAL',
        name: 'Social Media',
        icon: '📱',
        color: '#1DA1F2',
        description: 'LinkedIn, Facebook, Instagram'
      },
      {
        id: 'EMAIL',
        name: 'Email',
        icon: '✉️',
        color: '#EA4335',
        description: 'Marketing and communication'
      },
      {
        id: 'CHATBOT',
        name: 'Chatbots',
        icon: '🤖',
        color: '#6C63FF',
        description: 'AI-powered support'
      },
      {
        id: 'MARKETPLACE',
        name: 'Digital Marketplaces',
        icon: '🏪',
        color: '#FF6B35',
        description: 'Property listing platforms'
      },
      {
        id: 'WHATSAPP',
        name: 'WhatsApp',
        icon: '💬',
        color: '#25D366',
        description: 'Instant messaging'
      },
      {
        id: 'SMS',
        name: 'SMS',
        icon: '📨',
        color: '#FFB800',
        description: 'Text messaging'
      },
      {
        id: 'PHONE',
        name: 'Phone',
        icon: '📞',
        color: '#FF6B6B',
        description: 'Voice calls'
      },
      {
        id: 'IN_PERSON',
        name: 'In-Person',
        icon: '🤝',
        color: '#845EC2',
        description: 'Face-to-face meetings'
      }
    ];
  }

  private isChannelAvailable(channelId: string, customer: any, preferences: any): boolean {
    switch (channelId) {
      case 'EMAIL':
        return !!customer.email && (preferences?.emailAvailable !== false);
      case 'SMS':
        return !!customer.phone && (preferences?.smsAvailable !== false);
      case 'WHATSAPP':
        return !!customer.phone && (preferences?.whatsappAvailable !== false);
      case 'PHONE':
        return !!customer.phone && (preferences?.phoneAvailable !== false);
      case 'WEBSITE':
        return preferences?.webAvailable !== false;
      case 'APP':
        return preferences?.appAvailable !== false;
      case 'SOCIAL':
        return preferences?.socialAvailable !== false;
      case 'CHATBOT':
        return preferences?.chatbotAvailable !== false;
      case 'MARKETPLACE':
        return preferences?.marketplaceAvailable !== false;
      case 'IN_PERSON':
        return preferences?.inPersonAvailable !== false;
      default:
        return false;
    }
  }

  private isChannelOptedIn(channelId: string, preferences: any): boolean {
    switch (channelId) {
      case 'EMAIL':
        return preferences?.emailOptedIn !== false;
      case 'SMS':
        return preferences?.smsOptedIn !== false;
      case 'WHATSAPP':
        return preferences?.whatsappOptedIn !== false;
      case 'PHONE':
        return preferences?.phoneOptedIn !== false;
      default:
        return true;
    }
  }

  private isChannelVerified(channelId: string, customer: any, preferences: any): boolean {
    switch (channelId) {
      case 'EMAIL':
        return preferences?.emailVerified || false;
      case 'SMS':
        return preferences?.smsVerified || false;
      case 'WHATSAPP':
        return preferences?.whatsappVerified || false;
      case 'PHONE':
        return preferences?.phoneVerified || false;
      default:
        return true;
    }
  }

  private getChannelActions(channelId: string, customer: any, preferences: any): ChannelAction[] {
    const actions: ChannelAction[] = [];

    switch (channelId) {
      case 'EMAIL':
        actions.push({ label: 'Send Email', action: 'send', icon: '✉️', enabled: true });
        actions.push({ label: 'View History', action: 'history', icon: '📋', enabled: true });
        break;
      case 'SMS':
        actions.push({ label: 'Send SMS', action: 'send', icon: '📨', enabled: true });
        break;
      case 'WHATSAPP':
        actions.push({ label: 'Send WhatsApp', action: 'send', icon: '💬', enabled: true });
        break;
      case 'PHONE':
        actions.push({ label: 'Call Now', action: 'call', icon: '📞', enabled: true });
        actions.push({ label: 'Schedule Call', action: 'schedule', icon: '📅', enabled: true });
        break;
      case 'WEBSITE':
        actions.push({ label: 'View Portal', action: 'view', icon: '🌐', enabled: true });
        break;
      case 'APP':
        actions.push({ label: 'Send Notification', action: 'notify', icon: '🔔', enabled: true });
        break;
      case 'SOCIAL':
        actions.push({ label: 'View Profile', action: 'view', icon: '👤', enabled: true });
        break;
      case 'IN_PERSON':
        actions.push({ label: 'Schedule Meeting', action: 'schedule', icon: '📅', enabled: true });
        break;
      default:
        break;
    }

    return actions;
  }

  private calculateAvgResponseTime(interactions: any[]): number {
    const responded = interactions.filter(
      i => i.initiatedAt && i.respondedAt
    );

    if (responded.length === 0) return 0;

    const totalTime = responded.reduce((sum, i) => {
      return sum + (new Date(i.respondedAt).getTime() - new Date(i.initiatedAt).getTime());
    }, 0);

    return totalTime / responded.length / 1000; // Return in seconds
  }
}

export const ChannelServiceInstance = ChannelService.getInstance();
4. Frontend Components
4.1 Omnichannel Page
File: app/(dashboard)/customers/[id]/channels/page.tsx

tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Mail,
  Phone,
  MessageSquare,
  Send,
  Calendar,
  Globe,
  Smartphone,
  Bot,
  Store,
  Users,
  Handshake,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minimize2,
  Maximize2,
  ExternalLink,
  MoreHorizontal,
  Star,
  StarOff,
} from 'lucide-react';

// Channel configuration
const CHANNELS = {
  WEBSITE: {
    id: 'WEBSITE',
    name: 'Website',
    icon: Globe,
    color: '#0019F9',
    description: 'Web portal and property listings'
  },
  APP: {
    id: 'APP',
    name: 'Mobile App',
    icon: Smartphone,
    color: '#00A86A',
    description: 'CX Portal mobile application'
  },
  SOCIAL: {
    id: 'SOCIAL',
    name: 'Social Media',
    icon: Users,
    color: '#1DA1F2',
    description: 'LinkedIn, Facebook, Instagram'
  },
  EMAIL: {
    id: 'EMAIL',
    name: 'Email',
    icon: Mail,
    color: '#EA4335',
    description: 'Marketing and communication'
  },
  CHATBOT: {
    id: 'CHATBOT',
    name: 'Chatbots',
    icon: Bot,
    color: '#6C63FF',
    description: 'AI-powered support'
  },
  MARKETPLACE: {
    id: 'MARKETPLACE',
    name: 'Marketplaces',
    icon: Store,
    color: '#FF6B35',
    description: 'Property listing platforms'
  },
  WHATSAPP: {
    id: 'WHATSAPP',
    name: 'WhatsApp',
    icon: MessageSquare,
    color: '#25D366',
    description: 'Instant messaging'
  },
  SMS: {
    id: 'SMS',
    name: 'SMS',
    icon: Send,
    color: '#FFB800',
    description: 'Text messaging'
  },
  PHONE: {
    id: 'PHONE',
    name: 'Phone',
    icon: Phone,
    color: '#FF6B6B',
    description: 'Voice calls'
  },
  IN_PERSON: {
    id: 'IN_PERSON',
    name: 'In-Person',
    icon: Handshake,
    color: '#845EC2',
    description: 'Face-to-face meetings'
  }
} as const;

type ChannelId = keyof typeof CHANNELS;

interface ChannelStatus {
  id: ChannelId;
  name: string;
  icon: any;
  available: boolean;
  optedIn: boolean;
  verified: boolean;
  preferred: boolean;
  lastUsed: string | null;
  interactionCount: number;
  color: string;
  actions: Array<{
    label: string;
    action: string;
    icon: string;
    enabled: boolean;
  }>;
}

interface CustomerData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  preferredChannel: string | null;
}

export default function OmnichannelPage() {
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [channels, setChannels] = useState<ChannelStatus[]>([]);
  const [recentInteractions, setRecentInteractions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [lastActivity, setLastActivity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<ChannelId | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchChannelData();
  }, [customerId]);

  const fetchChannelData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/customer/${customerId}/channels`);
      const result = await response.json();

      if (result.success) {
        setCustomer(result.data.customer);
        setChannels(result.data.channels);
        setRecentInteractions(result.data.recentInteractions);
        setStats(result.data.stats);
        setLastActivity(result.data.lastActivity);
      }
    } catch (error) {
      console.error('Error fetching channel data:', error);
      toast.error('Failed to load channel data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedChannel || !messageContent) return;

    setSending(true);
    try {
      const response = await fetch(`/api/customer/${customerId}/channels/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: selectedChannel,
          type: 'OUTBOUND',
          content: {
            body: messageContent,
            subject: messageSubject || undefined
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Message sent via ${CHANNELS[selectedChannel].name}`);
        setDialogOpen(false);
        setMessageContent('');
        setMessageSubject('');
        fetchChannelData();
      } else {
        toast.error(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (channel: ChannelStatus) => {
    if (!channel.available) {
      return <Badge variant="outline" className="text-muted-foreground">Unavailable</Badge>;
    }
    if (channel.preferred) {
      return <Badge className="bg-primary text-white">Preferred</Badge>;
    }
    if (channel.verified) {
      return <Badge variant="success">Verified</Badge>;
    }
    return <Badge variant="secondary">Available</Badge>;
  };

  const getInteractionTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Omnichannel Interactions
          </h1>
          <p className="text-muted-foreground">
            {customer?.firstName} {customer?.lastName} · {customer?.email}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last activity: {lastActivity ? getInteractionTime(lastActivity) : 'Never'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Channel Grid - 8 columns */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Communication Channels
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Center Customer */}
              <div className="relative flex items-center justify-center py-8">
                <div className="relative">
                  {/* Customer Center */}
                  <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {customer?.firstName?.[0]}{customer?.lastName?.[0]}
                      </div>
                      <div className="text-xs text-muted-foreground">Customer</div>
                    </div>
                  </div>

                  {/* Channel Connections - We'll render channels around the customer */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Lines radiating from center */}
                    {channels.slice(0, 8).map((channel, index) => {
                      const angle = (index / 8) * 2 * Math.PI;
                      const radius = 140;
                      const x = Math.cos(angle) * radius;
                      const y = Math.sin(angle) * radius;
                      return (
                        <div
                          key={channel.id}
                          className="absolute pointer-events-none"
                          style={{
                            left: `calc(50% + ${x}px)`,
                            top: `calc(50% + ${y}px)`,
                            transform: 'translate(-50%, -50%)'
                          }}
                        >
                          <div
                            className="w-px h-16 bg-gradient-to-t from-muted to-transparent"
                            style={{
                              transform: `rotate(${angle}rad)`,
                              transformOrigin: 'bottom center'
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Channel Nodes */}
                  <div className="relative">
                    {channels.slice(0, 8).map((channel, index) => {
                      const angle = (index / 8) * 2 * Math.PI;
                      const radius = 160;
                      const x = Math.cos(angle) * radius;
                      const y = Math.sin(angle) * radius;

                      const IconComponent = channel.icon;

                      return (
                        <div
                          key={channel.id}
                          className="absolute"
                          style={{
                            left: `calc(50% + ${x}px)`,
                            top: `calc(50% + ${y}px)`,
                            transform: 'translate(-50%, -50%)'
                          }}
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  className={`
                                    flex flex-col items-center gap-1 p-3 rounded-xl transition-all
                                    hover:scale-110 hover:shadow-lg
                                    ${channel.available ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                                    ${channel.preferred ? 'ring-2 ring-primary ring-offset-2' : ''}
                                  `}
                                  style={{
                                    backgroundColor: channel.available ? `${channel.color}15` : '#f5f5f5',
                                    borderColor: channel.color,
                                    borderWidth: channel.available ? '2px' : '1px',
                                    borderStyle: 'solid'
                                  }}
                                  onClick={() => {
                                    if (channel.available) {
                                      setSelectedChannel(channel.id);
                                      setDialogOpen(true);
                                    }
                                  }}
                                >
                                  <IconComponent
                                    className="w-6 h-6"
                                    style={{ color: channel.available ? channel.color : '#999' }}
                                  />
                                  <span className="text-xs font-medium">
                                    {channel.name}
                                  </span>
                                  {channel.preferred && (
                                    <Star className="w-3 h-3 text-primary absolute -top-1 -right-1 fill-primary" />
                                  )}
                                  {channel.interactionCount > 0 && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {channel.interactionCount} interactions
                                    </span>
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-sm max-w-xs">
                                  <p className="font-semibold">{channel.name}</p>
                                  <p className="text-muted-foreground">{CHANNELS[channel.id]?.description}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {getStatusBadge(channel)}
                                    {channel.lastUsed && (
                                      <span className="text-xs text-muted-foreground">
                                        Last: {new Date(channel.lastUsed).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Channel Status Legend */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4 pt-4 border-t">
                <div className="flex items-center gap-1">
                  <Badge className="bg-primary text-white">★</Badge>
                  <span className="text-xs text-muted-foreground">Preferred</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs text-muted-foreground">Verified</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                  <span className="text-xs text-muted-foreground">Unavailable</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full border-2 border-primary" />
                  <span className="text-xs text-muted-foreground">Click to interact</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 4 columns */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {channels.filter(c => c.available).slice(0, 5).map(channel => {
                const IconComponent = channel.icon;
                return (
                  <Button
                    key={channel.id}
                    variant="outline"
                    className="w-full justify-start gap-2 text-sm"
                    onClick={() => {
                      setSelectedChannel(channel.id);
                      setDialogOpen(true);
                    }}
                  >
                    <IconComponent className="w-4 h-4" style={{ color: channel.color }} />
                    Send {channel.name} Message
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent Interactions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Recent Interactions</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] pr-4">
                {recentInteractions.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    No recent interactions
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentInteractions.slice(0, 10).map((interaction) => {
                      const channel = CHANNELS[interaction.channel as ChannelId];
                      const IconComponent = channel?.icon || Mail;
                      const isOutbound = interaction.direction === 'TO_CUSTOMER';

                      return (
                        <div
                          key={interaction.id}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                            <IconComponent className="w-4 h-4" style={{ color: channel?.color || '#999' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {channel?.name || interaction.channel}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {getInteractionTime(interaction.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {isOutbound ? 'Outbound' : 'Inbound'}
                              </Badge>
                              {interaction.status === 'COMPLETED' && (
                                <CheckCircle className="w-3 h-3 text-green-500" />
                              )}
                              {interaction.status === 'FAILED' && (
                                <XCircle className="w-3 h-3 text-red-500" />
                              )}
                              {interaction.status === 'IN_PROGRESS' && (
                                <Loader2 className="w-3 h-3 text-primary animate-spin" />
                              )}
                            </div>
                            {interaction.content?.body && (
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {interaction.content.body}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Interaction Stats */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Channel Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total Interactions</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{stats.resolutionRate.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Resolution Rate</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{stats.inbound}</p>
                    <p className="text-xs text-muted-foreground">Inbound</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{stats.outbound}</p>
                    <p className="text-xs text-muted-foreground">Outbound</p>
                  </div>
                </div>

                {/* Channel Breakdown */}
                {Object.entries(stats.byChannel).length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-muted-foreground">By Channel</p>
                    {Object.entries(stats.byChannel).map(([channelId, count]) => {
                      const channel = CHANNELS[channelId as ChannelId];
                      if (!channel) return null;
                      const percentage = (count / stats.total) * 100;
                      return (
                        <div key={channelId} className="flex items-center gap-2">
                          <span className="text-xs w-20 truncate">{channel.name}</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: channel.color
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Send Message Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedChannel && CHANNELS[selectedChannel] && (
                <>
                  <CHANNELS[selectedChannel].icon className="w-5 h-5" style={{ color: CHANNELS[selectedChannel].color }} />
                  Send via {CHANNELS[selectedChannel].name}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedChannel === 'EMAIL' && (
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Email subject"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                />
              </div>
            )}
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Type your message..."
                rows={4}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleSendMessage}
              disabled={sending || !messageContent}
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
4.2 Channel Status Badge Component
File: components/omni/ChannelStatusBadge.tsx

tsx
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, XCircle, AlertCircle, Star } from 'lucide-react';

interface ChannelStatusBadgeProps {
  channel: {
    id: string;
    name: string;
    available: boolean;
    optedIn: boolean;
    verified: boolean;
    preferred: boolean;
    lastUsed: string | null;
    interactionCount: number;
    color: string;
  };
}

export function ChannelStatusBadge({ channel }: ChannelStatusBadgeProps) {
  const getStatusIcon = () => {
    if (!channel.available) return <XCircle className="w-3 h-3 text-muted-foreground" />;
    if (channel.verified) return <CheckCircle className="w-3 h-3 text-green-500" />;
    if (channel.preferred) return <Star className="w-3 h-3 text-primary fill-primary" />;
    return <AlertCircle className="w-3 h-3 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (!channel.available) return 'Unavailable';
    if (channel.verified) return 'Verified';
    if (channel.preferred) return 'Preferred';
    return 'Available';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={channel.available ? 'default' : 'outline'}
            className={`
              flex items-center gap-1 text-xs
              ${!channel.available ? 'text-muted-foreground' : ''}
              ${channel.preferred ? 'border-primary bg-primary/10 text-primary' : ''}
            `}
          >
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <p className="font-medium">{channel.name}</p>
            <p>Status: {getStatusText()}</p>
            {channel.lastUsed && (
              <p>Last used: {new Date(channel.lastUsed).toLocaleString()}</p>
            )}
            <p>Interactions: {channel.interactionCount}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
4.3 Channel Interaction Timeline Component
File: components/omni/InteractionTimeline.tsx

tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Filter, ChevronDown, ChevronUp } from 'lucide-react';

interface InteractionTimelineProps {
  interactions: any[];
  onInteractionClick?: (interaction: any) => void;
}

export function InteractionTimeline({ interactions, onInteractionClick }: InteractionTimelineProps) {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  const channels = [...new Set(interactions.map(i => i.channel))];

  const filteredInteractions = filter
    ? interactions.filter(i => i.channel === filter)
    : interactions;

  const displayedInteractions = expanded ? filteredInteractions : filteredInteractions.slice(0, 10);

  const getChannelColor = (channel: string) => {
    const colors: Record<string, string> = {
      EMAIL: '#EA4335',
      SMS: '#FFB800',
      WHATSAPP: '#25D366',
      PHONE: '#FF6B6B',
      WEBSITE: '#0019F9',
      APP: '#00A86A',
      SOCIAL: '#1DA1F2',
      CHATBOT: '#6C63FF',
      MARKETPLACE: '#FF6B35',
      IN_PERSON: '#845EC2'
    };
    return colors[channel] || '#999';
  };

  const getChannelIcon = (channel: string) => {
    const icons: Record<string, string> = {
      EMAIL: '✉️',
      SMS: '📨',
      WHATSAPP: '💬',
      PHONE: '📞',
      WEBSITE: '🌐',
      APP: '📱',
      SOCIAL: '📱',
      CHATBOT: '🤖',
      MARKETPLACE: '🏪',
      IN_PERSON: '🤝'
    };
    return icons[channel] || '📌';
  };

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Interaction Timeline
        </CardTitle>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            className="text-xs border rounded px-2 py-1 bg-transparent"
            value={filter || ''}
            onChange={(e) => setFilter(e.target.value || null)}
          >
            <option value="">All Channels</option>
            {channels.map(ch => (
              <option key={ch} value={ch}>{ch}</option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {displayedInteractions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No interactions found
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-muted space-y-6">
              {displayedInteractions.map((interaction) => (
                <div
                  key={interaction.id}
                  className="relative cursor-pointer hover:bg-muted/30 p-2 rounded-lg transition-colors"
                  onClick={() => onInteractionClick?.(interaction)}
                >
                  {/* Timeline dot */}
                  <div
                    className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-background"
                    style={{ backgroundColor: getChannelColor(interaction.channel) }}
                  />

                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {getChannelIcon(interaction.channel)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {interaction.channel}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {interaction.direction === 'TO_CUSTOMER' ? 'Outbound' : 'Inbound'}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{
                              color: interaction.status === 'COMPLETED' ? '#00A86A' :
                                     interaction.status === 'FAILED' ? '#FF0000' :
                                     '#FFB800',
                              borderColor: interaction.status === 'COMPLETED' ? '#00A86A' :
                                          interaction.status === 'FAILED' ? '#FF0000' :
                                          '#FFB800'
                            }}
                          >
                            {interaction.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {getTimeAgo(interaction.createdAt)}
                        </span>
                      </div>
                      {interaction.content?.body && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {interaction.content.body}
                        </p>
                      )}
                      {interaction.content?.subject && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Subject: {interaction.content.subject}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {filteredInteractions.length > 10 && (
          <Button
            variant="ghost"
            className="w-full mt-4 text-sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>Show Less <ChevronUp className="w-4 h-4 ml-1" /></>
            ) : (
              <>Show More <ChevronDown className="w-4 h-4 ml-1" /></>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
5. Navigation Integration
5.1 Add Tab to Customer Page
File: app/(dashboard)/customers/[id]/layout.tsx

tsx
'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function CustomerLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const pathname = usePathname();
  const customerId = params.id;

  const tabs = [
    { label: '360 View', href: `/customers/${customerId}` },
    { label: 'Omnichannel', href: `/customers/${customerId}/channels` },
    { label: 'Properties', href: `/customers/${customerId}/properties` },
    { label: 'Transactions', href: `/customers/${customerId}/transactions` },
    { label: 'Complaints', href: `/customers/${customerId}/complaints` },
  ];

  const currentTab = tabs.find(tab => pathname === tab.href)?.href || tabs[0].href;

  return (
    <div className="container mx-auto px-4 py-6">
      <Tabs value={currentTab} className="w-full">
        <TabsList className="mb-6">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.href}
              value={tab.href}
              asChild
            >
              <Link href={tab.href}>{tab.label}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
        {children}
      </Tabs>
    </div>
  );
}
6. Styling & Tailwind Config
6.1 Tailwind Configuration
File: tailwind.config.js

javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#0019F9",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.95)", opacity: "0.5" },
          "100%": { transform: "scale(1.05)", opacity: "0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "spin-slow": "spin-slow 8s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
6.2 Additional CSS
File: app/globals.css

css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 223 100% 49%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 223 100% 49%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 223 100% 49%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 223 100% 49%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Channel node hover animation */
.channel-node {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.channel-node:hover {
  transform: scale(1.1);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

/* Pulse animation for active channels */
.channel-active {
  animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Radial connector lines */
.connector-line {
  stroke-dasharray: 4 4;
  animation: spin-slow 20s linear infinite;
}

/* Floating animation for channel icons */
.channel-icon {
  animation: float 4s ease-in-out infinite;
}

.channel-icon:nth-child(2) { animation-delay: 0.2s; }
.channel-icon:nth-child(3) { animation-delay: 0.4s; }
.channel-icon:nth-child(4) { animation-delay: 0.6s; }
.channel-icon:nth-child(5) { animation-delay: 0.8s; }
.channel-icon:nth-child(6) { animation-delay: 1.0s; }
.channel-icon:nth-child(7) { animation-delay: 1.2s; }
.channel-icon:nth-child(8) { animation-delay: 1.4s; }

/* Tooltip styles */
.custom-tooltip {
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(8px);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  max-width: 250px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}