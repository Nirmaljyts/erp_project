import prisma from "../utils/prisma.js";
import ExcelJS from "exceljs";
import fs from "fs";
import { parse } from "csv-parse/sync";

export async function listHolidaysService(year) {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  return prisma.holiday.findMany({
    where: {
      date: {
        gte: start,
        lt: end,
      },
    },
    orderBy: { date: "asc" },
  });
}

export async function createHolidayService({ date, name, isOptional }) {
  return prisma.holiday.create({
    data: {
      date: new Date(date),
      name,
      isOptional: Boolean(isOptional),
    },
  });
}

export async function updateHolidayService(id, data) {
  return prisma.holiday.update({
    where: { id },
    data: {
      name: data.name,
      isOptional: data.isOptional,
      date: new Date(data.date),
    },
  });
}

export async function deleteHolidayService(id) {
  await prisma.holiday.delete({ where: { id } });
}

export async function uploadHolidayBulkService(filepath, fileName, year) {
  const isCSV = fileName.endsWith(".csv");

  if (!isCSV) {
    throw new Error("Only CSV (.csv) files are allowed.");
  }

  let rows = [];

  if (isCSV) {
    const fileContent = fs.readFileSync(filepath, "utf8");
    rows = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });
  }

  const data = rows
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
        name: row.name.toString().trim(),
        isOptional: !(row.isCommon?.toString().toLowerCase() === "true"),
      };
    });

  await prisma.holiday.createMany({
    data,
    skipDuplicates: true,
  });

  fs.unlinkSync(filepath);
}
