import prisma from "../utils/prisma.js";
import fs from "fs";
import { parse } from "csv-parse/sync";

// LIST HOLIDAYS BY YEAR (EXCLUDES DELETED)
export async function listHolidaysService(year) {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  return prisma.holiday.findMany({
    where: {
      deletedAt: null,
      date: {
        gte: start,
        lt: end,
      },
    },
    orderBy: { date: "asc" },
  });
}

// CREATE HOLIDAY
export async function createHolidayService({ date, name, isOptional }) {
  return prisma.holiday.create({
    data: {
      date: new Date(date),
      name,
      isOptional: Boolean(isOptional),
      deletedAt: null,
    },
  });
}

// UPDATE HOLIDAY
export async function updateHolidayService(id, data) {
  const existing = await prisma.holiday.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) throw new Error("Holiday not found");

  return prisma.holiday.update({
    where: { id },
    data: {
      name: data.name,
      isOptional: Boolean(data.isOptional),
      date: new Date(data.date),
    },
  });
}

// SOFT DELETE HOLIDAY
export async function deleteHolidayService(id) {
  const existing = await prisma.holiday.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) throw new Error("Holiday not found");

  return prisma.holiday.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

// BULK CSV UPLOAD (HARD DELETE → INSERT NEW)
export async function uploadHolidayBulkService(filepath, fileName, year) {
  if (!fileName.endsWith(".csv")) {
    throw new Error("Only CSV (.csv) files are allowed.");
  }

  const fileContent = fs.readFileSync(filepath, "utf8");

  const rows = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  // Parse CSV rows
  const parsedRows = rows
    .filter((row) => row.date && row.name)
    .map((row) => {
      const [day, month, y] = row.date.split("/");

      const parsedDate = new Date(
        Date.UTC(Number(y), Number(month) - 1, Number(day))
      );

      if (parsedDate.getUTCFullYear() !== year) {
        throw new Error(`Year mismatch: ${row.date}`);
      }

      return {
        date: parsedDate,
        name: row.name.trim(),
        isOptional: !(row.isCommon?.toString().toLowerCase() === "true"),
      };
    });

  // HARD DELETE all holidays for that year
  await prisma.holiday.deleteMany({
    where: {
      date: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      },
    },
  });

  // INSERT new holidays
  if (parsedRows.length > 0) {
    await prisma.holiday.createMany({
      data: parsedRows,
      skipDuplicates: true,
    });
  }

  // Remove uploaded file
  fs.unlinkSync(filepath);
}
