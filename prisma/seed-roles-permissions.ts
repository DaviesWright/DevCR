// One-off seed (2026-09-03) — creates the 24 roles from the Devtraco CRM Roles & Permissions
// Specification (v1.0, July 2026) with real dataScope/reportScope/isReadOnly values, upserts
// the two existing demo roles (Sales Agent, Sales Manager) onto the same scale, creates the
// missing Devtraco departments, and adds 3 new demo users in illustrative roles (Group CEO,
// Client Experience Officer, Quantity Surveyor) so the existing account-switcher in the header
// can actually demonstrate different access tiers. Also seeds a couple of FieldPermission rows
// so field-level redaction (not just data-scope filtering) has something real to show.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type RoleSpec = {
  name: string;
  department: string;
  description: string;
  dataScope: "OWN" | "TEAM" | "DEPARTMENT" | "ALL" | "SYSTEM";
  reportScope: "OWN" | "TEAM" | "DEPARTMENT" | "ALL" | "SYSTEM";
  isReadOnly?: boolean;
};

const ROLES: RoleSpec[] = [
  // Executive
  { name: "Group Chief Executive Officer", department: "Executive", description: "Executive View — read-only access to all data.", dataScope: "ALL", reportScope: "ALL", isReadOnly: true },
  { name: "Chief Sales & Marketing Officer", department: "Executive", description: "Executive View — read-only sales/marketing/CX data; approves certain deal stages.", dataScope: "ALL", reportScope: "ALL", isReadOnly: true },
  { name: "Chief Technology Officer", department: "Executive", description: "System Administrator — full system access for configuration; limited data write access.", dataScope: "SYSTEM", reportScope: "SYSTEM" },

  // Sales
  { name: "Group Head of Sales", department: "Sales", description: "Sales Manager — read/write access to all sales data.", dataScope: "ALL", reportScope: "ALL" },
  { name: "Senior Sales Consultant", department: "Sales", description: "Sales User — full access to assigned leads; view-only for team leads.", dataScope: "OWN", reportScope: "TEAM" },
  { name: "Sales Agent", department: "Sales", description: "Sales Consultant — full access to assigned leads only; no access to other agents' data.", dataScope: "OWN", reportScope: "OWN" },
  { name: "Assistant Sales Manager", department: "Sales", description: "Sales Manager (limited) — read/write to team leads; limited approval rights.", dataScope: "TEAM", reportScope: "TEAM" },
  { name: "Sales Executive", department: "Sales", description: "Sales User (limited) — read/write to assigned leads; can update contact information.", dataScope: "OWN", reportScope: "OWN" },

  // Marketing
  { name: "Head of Marketing", department: "Marketing", description: "Marketing Manager — read/write access to campaign data and lead source attribution.", dataScope: "DEPARTMENT", reportScope: "DEPARTMENT" },
  { name: "Group Marketing Manager", department: "Marketing", description: "Marketing User — read/write to campaign and lead source data.", dataScope: "TEAM", reportScope: "TEAM" },
  { name: "Digital Marketing Manager", department: "Marketing", description: "Marketing User — read/write to digital campaign data.", dataScope: "TEAM", reportScope: "TEAM" },
  { name: "Marketing, Events, Branding & Strategic Partnerships", department: "Marketing", description: "Marketing User (limited) — read/write to event and partnership data.", dataScope: "OWN", reportScope: "OWN" },

  // CX
  { name: "Head of Client Experience", department: "Customer Experience", description: "CX Manager — full access to client data; can approve complaint resolutions.", dataScope: "DEPARTMENT", reportScope: "DEPARTMENT" },
  { name: "Client Experience Manager", department: "Customer Experience", description: "CX User (manager) — read/write to all CX data; can assign tasks to team.", dataScope: "TEAM", reportScope: "TEAM" },
  { name: "Client Experience Officer", department: "Customer Experience", description: "CX User — read/write to assigned client cases; can log interactions.", dataScope: "OWN", reportScope: "OWN" },
  { name: "Assistant Manager - Customer Service & Corporate Affairs", department: "Customer Experience", description: "CX User (manager) — read/write to client data and VIP client data.", dataScope: "TEAM", reportScope: "TEAM" },

  // Projects/Development
  { name: "Development Director", department: "Projects", description: "Project Manager — read/write to project data.", dataScope: "DEPARTMENT", reportScope: "DEPARTMENT" },
  { name: "Project Manager", department: "Projects", description: "Project User — read/write to project and snag data; can update project status.", dataScope: "OWN", reportScope: "OWN" },
  { name: "Quantity Surveyor", department: "Projects", description: "Project User (limited) — read-only for project data; can update project financials.", dataScope: "DEPARTMENT", reportScope: "DEPARTMENT" },
  { name: "Project Superintendent", department: "Projects", description: "Project User (read-only) — read-only access to project data; can log snags.", dataScope: "OWN", reportScope: "OWN", isReadOnly: true },

  // Finance
  { name: "Group Financial Controller", department: "Finance", description: "Finance Manager — read/write to financial data; can approve collections.", dataScope: "DEPARTMENT", reportScope: "DEPARTMENT" },
  { name: "Collections Officer", department: "Finance", description: "Finance User — read/write to payment and collections data.", dataScope: "OWN", reportScope: "OWN" },

  // IT
  { name: "CRM Administrator", department: "IT", description: "System Administrator — full system access; manages users and permissions.", dataScope: "SYSTEM", reportScope: "SYSTEM" },
  { name: "IT Support Specialist", department: "IT", description: "System Support — system access for support; limited data write access.", dataScope: "DEPARTMENT", reportScope: "DEPARTMENT" },

  // Kept from the original seed, now with real scope (Sales Manager already existed as the
  // demo manager account — maps to Group Head of Sales' tier).
  { name: "Sales Manager", department: "Sales", description: "Sales Manager — read/write access to all sales data.", dataScope: "ALL", reportScope: "ALL" },
];

async function main() {
  const departmentNames = [...new Set(ROLES.map((r) => r.department))];
  const departments = new Map<string, string>();
  for (const name of departmentNames) {
    const dept = await prisma.department.upsert({ where: { name }, update: {}, create: { name } });
    departments.set(name, dept.id);
  }

  const roleIds = new Map<string, string>();
  for (const spec of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: spec.name },
      update: { description: spec.description, dataScope: spec.dataScope, reportScope: spec.reportScope, isReadOnly: spec.isReadOnly ?? false },
      create: { name: spec.name, description: spec.description, isSystem: true, dataScope: spec.dataScope, reportScope: spec.reportScope, isReadOnly: spec.isReadOnly ?? false },
    });
    roleIds.set(spec.name, role.id);
  }

  // Demo users so the account-switcher can show three genuinely different access tiers.
  const demoUsers: { firstName: string; lastName: string; email: string; roleName: string; department: string }[] = [
    { firstName: "Akosua", lastName: "Frimpong", email: "akosua.frimpong@devtraco.com", roleName: "Group Chief Executive Officer", department: "Executive" },
    { firstName: "Yaw", lastName: "Osei-Bonsu", email: "yaw.osei-bonsu@devtraco.com", roleName: "Client Experience Officer", department: "Customer Experience" },
    { firstName: "Nana Ama", lastName: "Quaye", email: "nanaama.quaye@devtraco.com", roleName: "Quantity Surveyor", department: "Projects" },
  ];

  const createdUserIds: Record<string, string> = {};
  for (const u of demoUsers) {
    const roleId = roleIds.get(u.roleName)!;
    const deptId = departments.get(u.department)!;
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { roleId, departmentId: deptId },
      create: {
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        passwordHash: "seed-only-not-a-real-hash",
        roleId,
        departmentId: deptId,
      },
    });
    createdUserIds[u.roleName] = user.id;
  }

  // Field-level demo: commission dollar amounts and customer lifetime value are hidden from CX
  // (they service complaints/log interactions, not agent commission economics or a client's
  // total spend) — CommissionListItem exposes the property as "amount" (src/lib/queries/
  // commissions.ts), not "commissionAmount" as originally seeded here; corrected below and the
  // stale row removed so redactFields actually matches real data.
  await prisma.fieldPermission.deleteMany({ where: { entityType: "SALE", fieldName: "commissionAmount" } });

  const cxOfficerRoleId = roleIds.get("Client Experience Officer")!;
  const cxManagerRoleId = roleIds.get("Client Experience Manager")!;
  const fieldPermissions: { roleId: string; entityType: "SALE" | "CUSTOMER"; fieldName: string }[] = [
    { roleId: cxOfficerRoleId, entityType: "SALE", fieldName: "amount" },
    { roleId: cxManagerRoleId, entityType: "SALE", fieldName: "amount" },
    { roleId: cxOfficerRoleId, entityType: "CUSTOMER", fieldName: "lifetimeValue" },
    { roleId: cxManagerRoleId, entityType: "CUSTOMER", fieldName: "lifetimeValue" },
  ];
  for (const fp of fieldPermissions) {
    await prisma.fieldPermission.upsert({
      where: { roleId_entityType_fieldName: { roleId: fp.roleId, entityType: fp.entityType, fieldName: fp.fieldName } },
      update: { access: "HIDDEN" },
      create: { roleId: fp.roleId, entityType: fp.entityType, fieldName: fp.fieldName, access: "HIDDEN" },
    });
  }

  console.log(`Seeded ${ROLES.length} roles, ${departmentNames.length} departments, ${demoUsers.length} demo users, ${fieldPermissions.length} field permissions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
