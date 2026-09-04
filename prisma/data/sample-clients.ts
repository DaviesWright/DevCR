// Sample data roster — ~17 additional customers layered onto the original 4 (Kwame, Ama, John,
// the seeded Corporate customer), spanning every Lead stage, every Opportunity stage, and a mix
// of buyer personas, so Leads Analytics, Sales pipeline, Marketing segments, and CX all have
// enough volume/variety to review meaningfully. Plain data only — prisma/seed-sample-clients.ts
// does the creating, matching the cx-playbook-templates.ts / seed.ts split already used here.

export type BuyerSegment = "LOCAL_RESIDENTIAL" | "DIASPORA" | "CORPORATE" | "INVESTOR";

export type SampleClientStage =
  | "NEW"
  | "CONTACTED"
  | "NURTURING"
  | "NO_RESPONSE"
  | "QUALIFIED"
  | "REAL_OPPORTUNITY"
  | "UNQUALIFIED"
  | "OPP_PROSPECTING"
  | "OPP_QUALIFIED"
  | "OPP_SITE_VISIT"
  | "OPP_NEGOTIATION"
  | "OPP_CONTRACT"
  | "OPP_CLOSED_LOST"
  | "SALE_ACTIVE_COMPLAINT"
  | "SALE_COMPLETED_HANDOVER";

export type SampleClient = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  segment: BuyerSegment;
  kycStatus: "PENDING" | "VERIFIED" | "REJECTED";
  daysAgo: number;
  budgetMin: number;
  budgetMax: number;
  // Indexes into [3-bed townhouse, 4-bed detached, studio (Nova), 2-bed (Nova)].
  propertyType: 0 | 1 | 2 | 3;
  assignedRep: "jane" | "michael";
  source: "website" | "referral";
  stage: SampleClientStage;
  bant?: { budget: number; authority: number; need: number; timeline: number; fit: number };
  lostReason?: "NO_BUDGET" | "WRONG_TIMING" | "NOT_INTERESTED" | "CHOSE_COMPETITOR" | "WRONG_FIT" | "COULD_NOT_SECURE_FINANCE";
  suspectedPersona?: string;
  unitNumber?: string;
};

export const SAMPLE_CLIENTS: SampleClient[] = [
  {
    firstName: "Kofi", lastName: "Boateng", email: "kofi.boateng@example.com", phone: "+233241110001",
    nationality: "Ghanaian", segment: "LOCAL_RESIDENTIAL", kycStatus: "PENDING", daysAgo: 1,
    budgetMin: 750000, budgetMax: 900000, propertyType: 0, assignedRep: "jane", source: "website", stage: "NEW",
  },
  {
    firstName: "Efua", lastName: "Sarpong", email: "efua.sarpong@example.com", phone: "+441132220002",
    nationality: "British-Ghanaian", segment: "DIASPORA", kycStatus: "PENDING", daysAgo: 3,
    budgetMin: 800000, budgetMax: 1000000, propertyType: 0, assignedRep: "jane", source: "referral", stage: "CONTACTED",
  },
  {
    firstName: "Yaw", lastName: "Adjei", email: "yaw.adjei@example.com", phone: "+233201110003",
    nationality: "Ghanaian", segment: "INVESTOR", kycStatus: "PENDING", daysAgo: 6,
    budgetMin: 900000, budgetMax: 1300000, propertyType: 1, assignedRep: "michael", source: "website", stage: "NURTURING",
  },
  {
    firstName: "Abena", lastName: "Owusu", email: "abena.owusu@example.com", phone: "+233551110004",
    nationality: "Ghanaian", segment: "LOCAL_RESIDENTIAL", kycStatus: "PENDING", daysAgo: 10,
    budgetMin: 700000, budgetMax: 850000, propertyType: 0, assignedRep: "jane", source: "website", stage: "NO_RESPONSE",
  },
  {
    firstName: "Nana Kwame", lastName: "Darko", email: "nanakwame.darko@example.com", phone: "+233241110005",
    nationality: "Ghanaian", segment: "CORPORATE", kycStatus: "VERIFIED", daysAgo: 14,
    budgetMin: 1200000, budgetMax: 1600000, propertyType: 1, assignedRep: "michael", source: "referral", stage: "QUALIFIED",
    bant: { budget: 85, authority: 70, need: 70, timeline: 60, fit: 80 },
  },
  {
    firstName: "Linda", lastName: "Asante", email: "linda.asante@example.com", phone: "+12125550006",
    nationality: "American-Ghanaian", segment: "DIASPORA", kycStatus: "PENDING", daysAgo: 9,
    budgetMin: 850000, budgetMax: 1050000, propertyType: 0, assignedRep: "jane", source: "referral", stage: "QUALIFIED",
    bant: { budget: 88, authority: 90, need: 75, timeline: 70, fit: 82 },
  },
  {
    firstName: "Kwesi", lastName: "Appiah", email: "kwesi.appiah@example.com", phone: "+233201110007",
    nationality: "Ghanaian", segment: "INVESTOR", kycStatus: "VERIFIED", daysAgo: 12,
    budgetMin: 1000000, budgetMax: 1400000, propertyType: 1, assignedRep: "michael", source: "website", stage: "REAL_OPPORTUNITY",
    bant: { budget: 90, authority: 85, need: 80, timeline: 75, fit: 85 },
    suspectedPersona: "Investor — Yield Seeker",
  },
  {
    firstName: "Grace", lastName: "Mensah", email: "grace.mensah@example.com", phone: "+233241110008",
    nationality: "Ghanaian", segment: "CORPORATE", kycStatus: "PENDING", daysAgo: 20,
    budgetMin: 900000, budgetMax: 1100000, propertyType: 1, assignedRep: "michael", source: "referral", stage: "UNQUALIFIED",
    lostReason: "NO_BUDGET",
  },
  {
    firstName: "Samuel", lastName: "Tetteh", email: "samuel.tetteh@example.com", phone: "+233551110009",
    nationality: "Ghanaian", segment: "LOCAL_RESIDENTIAL", kycStatus: "PENDING", daysAgo: 18,
    budgetMin: 700000, budgetMax: 820000, propertyType: 0, assignedRep: "jane", source: "website", stage: "UNQUALIFIED",
    lostReason: "CHOSE_COMPETITOR",
  },
  {
    firstName: "Adwoa", lastName: "Frimpong", email: "adwoa.frimpong@example.com", phone: "+14165550010",
    nationality: "Canadian-Ghanaian", segment: "DIASPORA", kycStatus: "VERIFIED", daysAgo: 25,
    budgetMin: 950000, budgetMax: 1150000, propertyType: 0, assignedRep: "jane", source: "referral", stage: "OPP_PROSPECTING",
    bant: { budget: 80, authority: 75, need: 70, timeline: 55, fit: 78 },
  },
  {
    firstName: "Kojo", lastName: "Antwi", email: "kojo.antwi@example.com", phone: "+233201110011",
    nationality: "Ghanaian", segment: "INVESTOR", kycStatus: "VERIFIED", daysAgo: 22,
    budgetMin: 1100000, budgetMax: 1500000, propertyType: 1, assignedRep: "michael", source: "website", stage: "OPP_QUALIFIED",
    bant: { budget: 82, authority: 88, need: 74, timeline: 65, fit: 80 },
  },
  {
    firstName: "Esi", lastName: "Danso", email: "esi.danso@example.com", phone: "+233241110012",
    nationality: "Ghanaian", segment: "CORPORATE", kycStatus: "VERIFIED", daysAgo: 28,
    budgetMin: 850000, budgetMax: 875000, propertyType: 0, assignedRep: "michael", source: "referral", stage: "OPP_SITE_VISIT",
    bant: { budget: 84, authority: 80, need: 78, timeline: 70, fit: 82 }, unitNumber: "A-401",
  },
  {
    firstName: "Kwabena", lastName: "Osei", email: "kwabena.osei@example.com", phone: "+233551110013",
    nationality: "Ghanaian", segment: "LOCAL_RESIDENTIAL", kycStatus: "VERIFIED", daysAgo: 33,
    budgetMin: 850000, budgetMax: 900000, propertyType: 0, assignedRep: "jane", source: "website", stage: "OPP_NEGOTIATION",
    bant: { budget: 86, authority: 85, need: 82, timeline: 78, fit: 84 }, unitNumber: "A-402",
  },
  {
    firstName: "Akosua", lastName: "Boateng", email: "akosua.boateng@example.com", phone: "+441172220014",
    nationality: "British-Ghanaian", segment: "DIASPORA", kycStatus: "VERIFIED", daysAgo: 40,
    budgetMin: 850000, budgetMax: 900000, propertyType: 0, assignedRep: "jane", source: "referral", stage: "OPP_CONTRACT",
    bant: { budget: 90, authority: 92, need: 85, timeline: 80, fit: 88 }, unitNumber: "A-403",
  },
  {
    firstName: "Ibrahim", lastName: "Yakubu", email: "ibrahim.yakubu@example.com", phone: "+233201110015",
    nationality: "Ghanaian", segment: "INVESTOR", kycStatus: "VERIFIED", daysAgo: 45,
    budgetMin: 1200000, budgetMax: 1600000, propertyType: 1, assignedRep: "michael", source: "website", stage: "OPP_CLOSED_LOST",
    bant: { budget: 70, authority: 75, need: 60, timeline: 50, fit: 65 },
  },
  {
    firstName: "Patricia", lastName: "Owusu", email: "patricia.owusu@example.com", phone: "+233551110016",
    nationality: "Ghanaian", segment: "LOCAL_RESIDENTIAL", kycStatus: "VERIFIED", daysAgo: 50,
    budgetMin: 870000, budgetMax: 880000, propertyType: 0, assignedRep: "jane", source: "website", stage: "SALE_ACTIVE_COMPLAINT",
    bant: { budget: 88, authority: 90, need: 84, timeline: 82, fit: 86 }, unitNumber: "A-404",
  },
  {
    firstName: "Efe", lastName: "Kufuor", email: "efe.kufuor@example.com", phone: "+493012340017",
    nationality: "German-Ghanaian", segment: "DIASPORA", kycStatus: "VERIFIED", daysAgo: 60,
    budgetMin: 870000, budgetMax: 880000, propertyType: 0, assignedRep: "michael", source: "referral", stage: "SALE_COMPLETED_HANDOVER",
    bant: { budget: 92, authority: 95, need: 88, timeline: 85, fit: 90 }, unitNumber: "A-405",
  },

  // Nova (Roman Ridge) — the "more affordable inner-city option" development, distinct from
  // the Airport Hills clients above, so reports show more than one project.
  {
    firstName: "Abena", lastName: "Boakye", email: "abena.boakye@example.com", phone: "+233241110018",
    nationality: "Ghanaian", segment: "LOCAL_RESIDENTIAL", kycStatus: "PENDING", daysAgo: 8,
    budgetMin: 380000, budgetMax: 420000, propertyType: 2, assignedRep: "jane", source: "website", stage: "OPP_QUALIFIED",
    bant: { budget: 75, authority: 80, need: 72, timeline: 60, fit: 76 },
  },
  {
    firstName: "Prince", lastName: "Ofori", email: "prince.ofori@example.com", phone: "+233551110019",
    nationality: "Ghanaian", segment: "LOCAL_RESIDENTIAL", kycStatus: "VERIFIED", daysAgo: 16,
    budgetMin: 500000, budgetMax: 550000, propertyType: 3, assignedRep: "jane", source: "referral", stage: "OPP_SITE_VISIT",
    bant: { budget: 78, authority: 82, need: 80, timeline: 68, fit: 80 }, unitNumber: "NOV201",
  },
  {
    firstName: "Comfort", lastName: "Addai", email: "comfort.addai@example.com", phone: "+233201110020",
    nationality: "Ghanaian", segment: "LOCAL_RESIDENTIAL", kycStatus: "VERIFIED", daysAgo: 35,
    budgetMin: 500000, budgetMax: 550000, propertyType: 3, assignedRep: "michael", source: "website", stage: "OPP_CONTRACT",
    bant: { budget: 84, authority: 86, need: 82, timeline: 78, fit: 83 }, unitNumber: "NOV202",
  },
];
