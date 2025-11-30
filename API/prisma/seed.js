import prisma from "../src/utils/prisma.js";
import bcrypt from "bcryptjs";

async function resetDatabase() {
  console.log("🧹 Resetting database...");

  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`);

  const tableNames = await prisma.$queryRawUnsafe(`
    SELECT TABLE_NAME
    FROM information_schema.tables
    WHERE table_schema = DATABASE();
  `);

  const skip = ["_prisma_migrations"];

  for (const row of tableNames) {
    const name = row.table_name || row.TABLE_NAME;
    if (!name || skip.includes(name)) continue;

    console.log(`→ Truncating: ${name}`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${name}\`;`);
  }

  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`);
  console.log("✔ All tables truncated & auto-increment reset");
}

async function seed() {
  console.log("🌱 Starting seed...");

  const passwordHash = await bcrypt.hash("Password@123", 10);

  // USERS
  const admin = await prisma.user.create({
    data: {
      id: 1,
      name: "Admin",
      email: "admin@erp.com",
      password: passwordHash,
      role: "ADMIN",
    },
  });

  const hr = await prisma.user.create({
    data: {
      id: 2,
      name: "Alice",
      email: "hr@erp.com",
      password: passwordHash,
      role: "HR",
    },
  });

  const manager = await prisma.user.create({
    data: {
      id: 3,
      name: "John",
      email: "manager@erp.com",
      password: passwordHash,
      role: "MANAGER",
    },
  });

  const emp1 = await prisma.user.create({
    data: {
      id: 4,
      name: "Nirmal",
      email: "nirmaljyothisbenny97@gmail.com",
      password: passwordHash,
      role: "EMPLOYEE",
    },
  });

  const emp2 = await prisma.user.create({
    data: {
      id: 5,
      name: "Christy",
      email: "christy@erp.com",
      password: passwordHash,
      role: "EMPLOYEE",
    },
  });

  const emp3 = await prisma.user.create({
    data: {
      id: 6,
      name: "Amal",
      email: "amal@erp.com",
      password: passwordHash,
      role: "EMPLOYEE",
    },
  });

  const emp4 = await prisma.user.create({
    data: {
      id: 7,
      name: "Arjun",
      email: "arjun@erp.com",
      password: passwordHash,
      role: "EMPLOYEE",
    },
  });

    const hrManager = await prisma.user.create({
    data: {
      id: 8,
      name: "Eliza",
      email: "hr.manager@erp.com",
      password: passwordHash,
      role: "HR_MANAGER",
    },
  });

  console.log("✔ Users seeded");

  // CLIENTS
  await prisma.client.createMany({
    data: [
      {
        id: 1,
        name: "JP Morgan Solutions",
        email: "contact@techcorp.com",
        phone: "9876543210",
        contactedBy: "John",
      },
      {
        id: 2,
        name: "PCP Pvt Ltd",
        email: "contact@blueocean.com",
        phone: "9123456780",
        contactedBy: "Paul",
      },
    ],
  });

  console.log("✔ Clients seeded");

  // PROJECTS
  await prisma.project.createMany({
    data: [
      {
        id: 1,
        name: "PCP Kitchen Management System",
        description: "Kitchen control automation",
        clientId: 1,
        managerId: 3,
        status: "ON_HOLD",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
      },
      {
        id: 2,
        name: "PCP Attendance Management System",
        description: "Warehouse tracking suite",
        clientId: 2,
        managerId: 3,
        status: "ACTIVE",
        startDate: new Date("2024-06-01"),
        endDate: new Date("2025-06-30"),
      },
      {
        id: 3,
        name: "Waste Classify",
        description: "Waste identification and management automation",
        clientId: 2,
        managerId: 3,
        status: "COMPLETED",
        startDate: new Date("2024-06-01"),
        endDate: new Date("2025-06-30"),
      },
      {
        id: 4,
        name: "TaskWhiz",
        description: "Company project management",
        clientId: 1,
        managerId: 3,
        status: "CANCELLED",
        startDate: new Date("2024-06-01"),
        endDate: new Date("2025-06-30"),
      },
    ],
  });

  console.log("✔ Projects seeded");

  // EMPLOYEE ASSIGNMENTS
  await prisma.projectEmployee.createMany({
    data: [
      { id: 1, projectId: 1, employeeId: 4 },
      { id: 2, projectId: 2, employeeId: 5 },
      { id: 3, projectId: 3, employeeId: 6 },
      { id: 4, projectId: 4, employeeId: 7 },
    ],
  });

  console.log("✔ Project assignments seeded");

  console.log("🎉 Seeding completed successfully.");
}

async function main() {
  await resetDatabase();
  await seed();
}

main()
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
