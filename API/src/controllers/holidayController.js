import prisma from "../utils/prisma.js";

export async function listHolidays(req, res) {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    const holidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: start,
          lt: end,
        },
      },
      orderBy: { date: "asc" },
    });

    res.json(holidays);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to list holidays" });
  }
}

export async function createHoliday(req, res) {
  try {
    const { date, name, isOptional } = req.body;
    const holiday = await prisma.holiday.create({
      data: {
        date: new Date(date),
        name,
        isOptional: Boolean(isOptional),
      },
    });
    res.status(201).json(holiday);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create holiday" });
  }
}
