// 15 new customer records — fits the existing `customers` table structure exactly (Customer +
// one primary CustomerAddress + one CustomerPreference each, the same shape prisma/seed.ts and
// prisma/seed-sample-clients.ts already populate). Spread across all four buyer segments and a
// realistic KYC mix. Independent of leads/opportunities — pure customer-master data.
//
// Run:  npx tsx prisma/seed-new-customers.ts   (after the main seed — needs existing sales reps)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Segment = "LOCAL_RESIDENTIAL" | "DIASPORA" | "CORPORATE" | "INVESTOR";
type Kyc = "PENDING" | "VERIFIED" | "REJECTED";

type NewCustomer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  segment: Segment;
  kycStatus: Kyc;
  dateOfBirth?: string; // YYYY-MM-DD
  address: { label: string; line1: string; city: string; region: string; country?: string };
  preferredContact: "EMAIL" | "PHONE" | "SMS" | "WHATSAPP";
  marketingOptIn: boolean;
};

const NEW_CUSTOMERS: NewCustomer[] = [
  {
    firstName: "Nana Yaw", lastName: "Boadi", email: "nanayaw.boadi@example.com", phone: "+233244550101",
    nationality: "Ghanaian", segment: "LOCAL_RESIDENTIAL", kycStatus: "VERIFIED", dateOfBirth: "1985-03-14",
    address: { label: "Home", line1: "12 Ridge Close", city: "Kumasi", region: "Ashanti" },
    preferredContact: "PHONE", marketingOptIn: true,
  },
  {
    firstName: "Akosua", lastName: "Frimpomaa", email: "akosua.frimpomaa@example.com", phone: "+233208880102",
    nationality: "Ghanaian", segment: "LOCAL_RESIDENTIAL", kycStatus: "PENDING", dateOfBirth: "1990-07-22",
    address: { label: "Home", line1: "45 Dzorwulu Crescent", city: "Accra", region: "Greater Accra" },
    preferredContact: "WHATSAPP", marketingOptIn: true,
  },
  {
    firstName: "Kwabena", lastName: "Ofori-Atta", email: "procurement@kofigroupgh.example.com", phone: "+233302660103",
    nationality: "Ghanaian", segment: "CORPORATE", kycStatus: "VERIFIED",
    address: { label: "Head Office", line1: "8 Independence Avenue", city: "Accra", region: "Greater Accra" },
    preferredContact: "EMAIL", marketingOptIn: true,
  },
  {
    firstName: "Sarah", lastName: "Addo-Wilson", email: "sarah.addowilson@example.com", phone: "+442071230104",
    nationality: "British-Ghanaian", segment: "DIASPORA", kycStatus: "PENDING", dateOfBirth: "1979-11-02",
    address: { label: "UK correspondence", line1: "22 Camden High Street", city: "London", region: "Greater London", country: "United Kingdom" },
    preferredContact: "EMAIL", marketingOptIn: true,
  },
  {
    firstName: "Kwame", lastName: "Asiedu-Larbi", email: "kwame.asiedularbi@example.com", phone: "+233247770105",
    nationality: "Ghanaian", segment: "INVESTOR", kycStatus: "VERIFIED", dateOfBirth: "1975-01-30",
    address: { label: "Home", line1: "3 Labone Link", city: "Accra", region: "Greater Accra" },
    preferredContact: "PHONE", marketingOptIn: false,
  },
  {
    firstName: "Comfort", lastName: "Nyamekye", email: "comfort.nyamekye@example.com", phone: "+233551110106",
    nationality: "Ghanaian", segment: "LOCAL_RESIDENTIAL", kycStatus: "PENDING", dateOfBirth: "1993-05-18",
    address: { label: "Home", line1: "17 Beach Road", city: "Takoradi", region: "Western" },
    preferredContact: "SMS", marketingOptIn: true,
  },
  {
    firstName: "David", lastName: "Boateng-Smith", email: "david.boatengsmith@example.com", phone: "+12125559807",
    nationality: "American-Ghanaian", segment: "DIASPORA", kycStatus: "PENDING", dateOfBirth: "1982-09-09",
    address: { label: "Family home", line1: "5 Airport West Close", city: "Accra", region: "Greater Accra" },
    preferredContact: "EMAIL", marketingOptIn: true,
  },
  {
    firstName: "Patricia", lastName: "Ankrah", email: "patricia.ankrah@example.com", phone: "+233201110108",
    nationality: "Ghanaian", segment: "LOCAL_RESIDENTIAL", kycStatus: "VERIFIED", dateOfBirth: "1988-12-25",
    address: { label: "Home", line1: "9 Community 18", city: "Tema", region: "Greater Accra" },
    preferredContact: "WHATSAPP", marketingOptIn: true,
  },
  {
    firstName: "Emmanuel", lastName: "Yeboah-Mensah", email: "finance@yeboahmensahltd.example.com", phone: "+233302990109",
    nationality: "Ghanaian", segment: "CORPORATE", kycStatus: "PENDING",
    address: { label: "Head Office", line1: "14 Liberation Road", city: "Accra", region: "Greater Accra" },
    preferredContact: "EMAIL", marketingOptIn: true,
  },
  {
    firstName: "Michelle", lastName: "Owusu-Cole", email: "michelle.owusucole@example.com", phone: "+14165550110",
    nationality: "Canadian-Ghanaian", segment: "DIASPORA", kycStatus: "VERIFIED", dateOfBirth: "1986-04-11",
    address: { label: "Family home", line1: "31 Trasacco Valley Road", city: "Accra", region: "Greater Accra" },
    preferredContact: "WHATSAPP", marketingOptIn: true,
  },
  {
    firstName: "Kojo", lastName: "Amoako", email: "kojo.amoako@example.com", phone: "+233244440111",
    nationality: "Ghanaian", segment: "INVESTOR", kycStatus: "VERIFIED", dateOfBirth: "1970-06-06",
    address: { label: "Home", line1: "2 Cantonments Close", city: "Accra", region: "Greater Accra" },
    preferredContact: "PHONE", marketingOptIn: false,
  },
  {
    firstName: "Beatrice", lastName: "Sackey", email: "beatrice.sackey@example.com", phone: "+233551110112",
    nationality: "Ghanaian", segment: "LOCAL_RESIDENTIAL", kycStatus: "REJECTED", dateOfBirth: "1995-02-19",
    address: { label: "Home", line1: "27 Pedu Estate", city: "Cape Coast", region: "Central" },
    preferredContact: "SMS", marketingOptIn: true,
  },
  {
    firstName: "Ibrahim", lastName: "Mahama", email: "ibrahim.mahama@example.com", phone: "+233208880113",
    nationality: "Ghanaian", segment: "LOCAL_RESIDENTIAL", kycStatus: "PENDING", dateOfBirth: "1991-10-03",
    address: { label: "Home", line1: "6 Jisonaayili Road", city: "Tamale", region: "Northern" },
    preferredContact: "PHONE", marketingOptIn: true,
  },
  {
    firstName: "Wendy", lastName: "Appiah-Kubi", email: "wendy.appiahkubi@example.com", phone: "+493012340114",
    nationality: "German-Ghanaian", segment: "DIASPORA", kycStatus: "PENDING", dateOfBirth: "1984-08-27",
    address: { label: "Family home", line1: "19 Adjiringanor Road", city: "Accra", region: "Greater Accra" },
    preferredContact: "EMAIL", marketingOptIn: true,
  },
  {
    firstName: "Global Properties", lastName: "Consult Ltd (c/o Nii Odartey)", email: "info@globalpropertiesconsult.example.com", phone: "+233302110115",
    nationality: "Ghanaian", segment: "CORPORATE", kycStatus: "VERIFIED",
    address: { label: "Head Office", line1: "21 Ring Road Central", city: "Accra", region: "Greater Accra" },
    preferredContact: "EMAIL", marketingOptIn: true,
  },
];

async function main() {
  const reps = await prisma.user.findMany({ where: { salesAgentProfile: { isNot: null } }, select: { id: true } });
  if (reps.length === 0) {
    throw new Error("No sales reps found — run the main seed (and optionally seed-sales-team.ts) first.");
  }

  let count = 0;
  for (let i = 0; i < NEW_CUSTOMERS.length; i++) {
    const c = NEW_CUSTOMERS[i];
    const rep = reps[i % reps.length];
    const daysAgo = Math.floor(Math.random() * 45) + 1;
    const createdAt = new Date(Date.now() - daysAgo * 86400000);

    const customer = await prisma.customer.create({
      data: {
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        nationality: c.nationality,
        segment: c.segment,
        dateOfBirth: c.dateOfBirth ? new Date(c.dateOfBirth) : undefined,
        kycStatus: c.kycStatus,
        assignedSalesRepId: rep.id,
        createdAt,
      },
    });

    await prisma.customerAddress.create({
      data: {
        customerId: customer.id,
        label: c.address.label,
        line1: c.address.line1,
        city: c.address.city,
        region: c.address.region,
        country: c.address.country ?? "Ghana",
        isPrimary: true,
      },
    });

    await prisma.customerPreference.create({
      data: {
        customerId: customer.id,
        preferredContact: c.preferredContact,
        marketingOptIn: c.marketingOptIn,
      },
    });

    count++;
  }

  console.log(`Added ${count} customers (with address + preference each).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
