// One-off seed (2026-09-03) — adds the 7 real, named individuals from the Devtraco Plus
// Organogram (Sandra/CSMO, Wilma/Head of Marketing, Jason/Head of Digital Transformation &
// Growth, Eugene/Marketing & Communications Manager, Marian & Billy/Sales Manager, Queendale/
// Assistant Client Experience Manager). Three roles from the organogram have no exact match in
// the 24-role Devtraco spec catalog (seed-roles-permissions.ts) and are added here. Roles
// explicitly marked "[Not specified in files]" in the organogram (Head of Sales, Client
// Experience Manager, Group Financial Controller, Development Director, HR Lead) are
// deliberately NOT given fabricated names. No last names were provided for any of the 7 —
// left blank rather than invented.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type NewRoleSpec = {
  name: string;
  department: string;
  description: string;
  dataScope: "OWN" | "TEAM" | "DEPARTMENT" | "ALL" | "SYSTEM";
  reportScope: "OWN" | "TEAM" | "DEPARTMENT" | "ALL" | "SYSTEM";
};

// Roles from the organogram with no exact match in the existing 24-role catalog.
const NEW_ROLES: NewRoleSpec[] = [
  { name: "Head of Digital Transformation & Growth", department: "Marketing", description: "Marketing Manager — read/write access to digital transformation and growth initiatives.", dataScope: "DEPARTMENT", reportScope: "DEPARTMENT" },
  { name: "Marketing & Communications Manager", department: "Marketing", description: "Marketing User — read/write to campaign and communications data.", dataScope: "TEAM", reportScope: "TEAM" },
  { name: "Assistant Client Experience Manager", department: "Customer Experience", description: "CX User (manager) — read/write to assigned client cases; assists Client Experience Manager.", dataScope: "TEAM", reportScope: "TEAM" },
];

// email uses the same fake @devtraco.com seed domain as every other demo user in this app.
const NAMED_USERS: { firstName: string; email: string; roleName: string; department: string }[] = [
  { firstName: "Sandra", email: "sandra@devtraco.com", roleName: "Chief Sales & Marketing Officer", department: "Executive" },
  { firstName: "Wilma", email: "wilma@devtraco.com", roleName: "Head of Marketing", department: "Marketing" },
  { firstName: "Jason", email: "jason@devtraco.com", roleName: "Head of Digital Transformation & Growth", department: "Marketing" },
  { firstName: "Eugene", email: "eugene@devtraco.com", roleName: "Marketing & Communications Manager", department: "Marketing" },
  { firstName: "Marian", email: "marian@devtraco.com", roleName: "Sales Manager", department: "Sales" },
  { firstName: "Billy", email: "billy@devtraco.com", roleName: "Sales Manager", department: "Sales" },
  { firstName: "Queendale", email: "queendale@devtraco.com", roleName: "Assistant Client Experience Manager", department: "Customer Experience" },
];

async function main() {
  const departments = new Map<string, string>();
  for (const name of [...new Set(NEW_ROLES.map((r) => r.department))]) {
    const dept = await prisma.department.upsert({ where: { name }, update: {}, create: { name } });
    departments.set(name, dept.id);
  }

  const roleIds = new Map<string, string>();
  for (const spec of NEW_ROLES) {
    const role = await prisma.role.upsert({
      where: { name: spec.name },
      update: { description: spec.description, dataScope: spec.dataScope, reportScope: spec.reportScope },
      create: { name: spec.name, description: spec.description, isSystem: true, dataScope: spec.dataScope, reportScope: spec.reportScope },
    });
    roleIds.set(spec.name, role.id);
  }

  // Resolve existing roles/departments (Chief Sales & Marketing Officer, Head of Marketing,
  // Sales Manager) that NAMED_USERS also references but NEW_ROLES doesn't create.
  const existingRoleNames = [...new Set(NAMED_USERS.map((u) => u.roleName))].filter((n) => !roleIds.has(n));
  for (const name of existingRoleNames) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name } });
    roleIds.set(name, role.id);
  }
  const existingDeptNames = [...new Set(NAMED_USERS.map((u) => u.department))].filter((n) => !departments.has(n));
  for (const name of existingDeptNames) {
    const dept = await prisma.department.upsert({ where: { name }, update: {}, create: { name } });
    departments.set(name, dept.id);
  }

  for (const u of NAMED_USERS) {
    const roleId = roleIds.get(u.roleName)!;
    const deptId = departments.get(u.department)!;
    await prisma.user.upsert({
      where: { email: u.email },
      update: { roleId, departmentId: deptId },
      create: {
        firstName: u.firstName,
        lastName: "",
        email: u.email,
        passwordHash: "seed-only-not-a-real-hash",
        roleId,
        departmentId: deptId,
      },
    });
  }

  console.log(`Seeded ${NEW_ROLES.length} new roles and ${NAMED_USERS.length} named users from the organogram.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
