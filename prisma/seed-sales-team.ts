// 4 new Sales Agents + 1 new Sales Manager, using the existing "Sales Agent" / "Sales Manager"
// roles and "Sales" department created by the main seed (prisma/seed.ts creates Jane Agent /
// Michael Osei against these same two roles — this file adds a second wave of reps behind them).
// Each gets a SalesAgent profile (agentCode + commissionRate), same as both existing reps,
// including the manager — mirrors Michael Osei, who also carries a SalesAgent profile so
// personally-closed deals still show on commission/leaderboard views.
//
// Run:  npx tsx prisma/seed-sales-team.ts   (after the main seed — needs the Sales Agent/Sales Manager roles + Sales department)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NEW_AGENTS = [
  { firstName: "Efua", lastName: "Darko", employeeCode: "EMP-1003", agentCode: "AG-003", commissionRate: 3 },
  { firstName: "Yaw", lastName: "Owusu-Ansah", employeeCode: "EMP-1004", agentCode: "AG-004", commissionRate: 3 },
  { firstName: "Abena", lastName: "Kyerewaa", employeeCode: "EMP-1005", agentCode: "AG-005", commissionRate: 2.75 },
  { firstName: "Nii Laryea", lastName: "Quartey", employeeCode: "EMP-1006", agentCode: "AG-006", commissionRate: 3 },
];

const NEW_MANAGER = { firstName: "Adjoa", lastName: "Boateng-Mensah", employeeCode: "EMP-1007", agentCode: "AG-007", commissionRate: 2 };

async function main() {
  const [salesRole, managerRole, salesDept] = await Promise.all([
    prisma.role.findUnique({ where: { name: "Sales Agent" } }),
    prisma.role.findUnique({ where: { name: "Sales Manager" } }),
    prisma.department.findUnique({ where: { name: "Sales" } }),
  ]);
  if (!salesRole || !managerRole || !salesDept) {
    throw new Error('"Sales Agent" / "Sales Manager" roles or the "Sales" department are missing — run the main seed first.');
  }

  let created = 0;

  for (const a of NEW_AGENTS) {
    const user = await prisma.user.create({
      data: {
        employeeCode: a.employeeCode,
        firstName: a.firstName,
        lastName: a.lastName,
        email: `${a.firstName.toLowerCase().replace(/\s+/g, "")}.${a.lastName.toLowerCase().replace(/[^a-z]/g, "")}@devtraco.com`,
        passwordHash: "seed-only-not-a-real-hash",
        roleId: salesRole.id,
        departmentId: salesDept.id,
      },
    });
    await prisma.salesAgent.create({
      data: { userId: user.id, agentCode: a.agentCode, commissionRate: a.commissionRate },
    });
    created++;
  }

  const managerUser = await prisma.user.create({
    data: {
      employeeCode: NEW_MANAGER.employeeCode,
      firstName: NEW_MANAGER.firstName,
      lastName: NEW_MANAGER.lastName,
      email: `${NEW_MANAGER.firstName.toLowerCase()}.${NEW_MANAGER.lastName.toLowerCase().replace(/[^a-z]/g, "")}@devtraco.com`,
      passwordHash: "seed-only-not-a-real-hash",
      roleId: managerRole.id,
      departmentId: salesDept.id,
    },
  });
  await prisma.salesAgent.create({
    data: { userId: managerUser.id, agentCode: NEW_MANAGER.agentCode, commissionRate: NEW_MANAGER.commissionRate },
  });
  created++;

  console.log(`Added ${created} sales team members (4 agents + 1 manager), each with a SalesAgent profile.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
