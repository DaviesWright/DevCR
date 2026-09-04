// Seeds the configurable Channel/Medium master tables (2026-09-04 request) with the full
// taxonomy the user specified — 10 groups, ~95 channels — plus a standard Medium list. Additive
// and idempotent: re-running skips any group/channel/medium that already exists by name.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CHANNEL_GROUPS: { name: string; channels: string[] }[] = [
  {
    name: "Digital Advertising",
    channels: [
      "Google Search Ads",
      "Google Display Ads",
      "YouTube Ads",
      "Facebook Ads",
      "Instagram Ads",
      "LinkedIn Ads",
      "TikTok Ads",
      "X/Twitter Ads",
      "Programmatic Advertising",
      "Retargeting / Remarketing",
      "Native Advertising",
    ],
  },
  {
    name: "Social Media",
    channels: [
      "Facebook",
      "Instagram",
      "LinkedIn",
      "TikTok",
      "X/Twitter",
      "YouTube",
      "Snapchat",
      "Pinterest",
      "Reddit",
      "WhatsApp",
    ],
  },
  {
    name: "Direct Marketing",
    channels: [
      "Email",
      "SMS",
      "WhatsApp",
      "Voice calls",
      "Push notifications",
      "In-app messaging",
      "Direct mail",
      "RCS messaging",
    ],
  },
  {
    name: "Content & Organic",
    channels: [
      "Website",
      "Landing pages",
      "SEO",
      "Blog",
      "E-books / guides",
      "Whitepapers",
      "Case studies",
      "Webinars",
      "Podcasts",
      "Video content",
      "Online communities",
    ],
  },
  {
    name: "Events & Offline",
    channels: [
      "Trade shows",
      "Conferences",
      "Seminars",
      "Workshops",
      "Exhibitions",
      "Networking events",
      "Roadshows",
      "Product launches",
      "Sponsorships",
      "Corporate events",
    ],
  },
  {
    name: "Partnerships & Referral",
    channels: [
      "Partner referrals",
      "Customer referrals",
      "Affiliate marketing",
      "Reseller/channel partners",
      "Strategic partnerships",
      "Influencer marketing",
      "Co-marketing campaigns",
    ],
  },
  {
    name: "Sales-Driven Channels",
    channels: [
      "Cold calling",
      "Outbound email",
      "LinkedIn outreach",
      "Account-based marketing (ABM)",
      "Field sales",
      "Inside sales",
      "Sales referrals",
      "Lead-generation agencies",
    ],
  },
  {
    name: "Marketplace & Third-Party",
    channels: [
      "Google Business Profile",
      "Online directories",
      "Industry directories",
      "Review platforms",
      "Marketplaces",
      "Property portals",
      "App marketplaces",
    ],
  },
  {
    name: "Traditional Media",
    channels: [
      "Television",
      "Radio",
      "Newspapers",
      "Magazines",
      "Billboards",
      "Transit advertising",
      "Outdoor advertising",
      "Cinema advertising",
    ],
  },
  {
    name: "CRM / Automated Marketing",
    channels: [
      "Email campaigns",
      "Email drip sequences",
      "SMS campaigns",
      "WhatsApp campaigns",
      "Automated journeys",
      "Lead nurturing",
      "Retargeting audiences",
      "Website forms",
      "Chatbots",
      "Web push",
      "Trigger-based messaging",
      "Event-triggered campaigns",
      "Birthday/anniversary campaigns",
      "Abandoned enquiry follow-up",
      "Re-engagement campaigns",
    ],
  },
];

const MEDIUMS = [
  "Paid Search",
  "Organic Search",
  "Paid Social",
  "Organic Social",
  "Direct",
  "Referral",
  "Email",
  "SMS/Messaging",
  "Affiliate",
  "Display/Programmatic",
  "Offline/Field",
  "Content/Organic",
];

async function main() {
  let channelsCreated = 0;

  for (let gi = 0; gi < CHANNEL_GROUPS.length; gi++) {
    const g = CHANNEL_GROUPS[gi];
    const group = await prisma.marketingChannelGroup.upsert({
      where: { name: g.name },
      update: {},
      create: { name: g.name, sortOrder: gi },
    });

    for (let ci = 0; ci < g.channels.length; ci++) {
      const name = g.channels[ci];
      const existing = await prisma.marketingChannelMaster.findFirst({ where: { groupId: group.id, name } });
      if (existing) continue;
      await prisma.marketingChannelMaster.create({
        data: { groupId: group.id, name, sortOrder: ci },
      });
      channelsCreated++;
    }
  }

  let mediumsCreated = 0;
  for (let mi = 0; mi < MEDIUMS.length; mi++) {
    const name = MEDIUMS[mi];
    const existing = await prisma.marketingMedium.findFirst({ where: { name } });
    if (existing) continue;
    await prisma.marketingMedium.create({ data: { name, sortOrder: mi } });
    mediumsCreated++;
  }

  console.log(`Groups upserted: ${CHANNEL_GROUPS.length}, channels created: ${channelsCreated}, mediums created: ${mediumsCreated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
