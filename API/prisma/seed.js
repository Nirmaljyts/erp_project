import prisma from "../src/utils/prisma.js";
import bcrypt from "bcryptjs";

async function resetDatabase() {
  console.log("🧹 Cleaning database...");

  // Disable FK checks
  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`);

  // List all models you want to reset
  const tables = [
    "OtpCode",
    "ProjectEmployee",
    "Project",
    "Client",
    "Holiday",
    "User"
  ];

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${table};`);
  }

  // Re-enable FK
  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`);

  console.log("🧹 Database cleaned. All IDs reset to 1.");
}

async function seed() {
  console.log("🌱 Starting seed...");

  // ------------------------------------------------
  // USERS
  // ------------------------------------------------
  const passwordHash = await bcrypt.hash("Password@123", 10);

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
      email: "emp2@erp.com",
      password: passwordHash,
      role: "EMPLOYEE",
    },
  });

  console.log("✔ Users seeded");

  // ------------------------------------------------
  // CLIENTS
  // ------------------------------------------------
  const client1 = await prisma.client.create({
    data: {
      id: 1,
      name: "TechCorp Solutions",
      email: "contact@techcorp.com",
      phone: "9876543210",
      contactedBy: "John"
    },
  });

  const client2 = await prisma.client.create({
    data: {
      id: 2,
      name: "BlueOcean Services",
      email: "contact@blueocean.com",
      phone: "9123456780",
      contactedBy: "Paul"
    },
  });

  console.log("✔ Clients seeded");

  // ------------------------------------------------
  // PROJECTS
  // ------------------------------------------------
  const project1 = await prisma.project.create({
    data: {
      id: 1,
      name: "Enterprise HR System",
      description: "HR lifecycle automation",
      clientId: client1.id,
      managerId: manager.id,
      status: "IN_PROGRESS",
      startDate: new Date("2024-01-10"),
    },
  });

  const project2 = await prisma.project.create({
    data: {
      id: 2,
      name: "Inventory Automation",
      description: "Warehouse tracking suite",
      clientId: client2.id,
      managerId: manager.id,
      status: "ACTIVE",
      startDate: new Date("2024-05-01"),
    },
  });

  console.log("✔ Projects seeded");

  // ------------------------------------------------
  // PROJECT — EMPLOYEE ASSIGNMENTS
  // ------------------------------------------------
  await prisma.projectEmployee.createMany({
    data: [
      { id: 1, projectId: project1.id, employeeId: emp1.id },
      { id: 2, projectId: project1.id, employeeId: emp2.id },
      { id: 3, projectId: project2.id, employeeId: emp1.id },
    ],
  });

  console.log("✔ Project assignments seeded");

  // ------------------------------------------------
  // HOLIDAYS
  // ------------------------------------------------
  await prisma.holiday.createMany({
    data: [
      {
        id: 1,
        date: new Date("2024-12-25"),
        name: "Christmas",
        isOptional: false,
      },
      {
        id: 2,
        date: new Date("2024-01-01"),
        name: "New Year",
        isOptional: false,
      },
    ],
  });

  console.log("✔ Holidays seeded");

  console.log("🌱 Seeding completed successfully.");
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
