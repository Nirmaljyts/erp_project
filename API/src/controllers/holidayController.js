import {
  listHolidaysService,
  createHolidayService,
  uploadHolidayBulkService,
  deleteHolidayService,
  updateHolidayService,
} from "../services/holidayService.js";

export async function listHolidaysController(req, res) {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const holidays = await listHolidaysService(year);
    res.json(holidays);
  } catch (err) {
    res.status(500).json({ message: "Failed to list holidays" });
  }
}

export async function createHolidayController(req, res) {
  try {
    const holiday = await createHolidayService(req.body);
    res.status(201).json(holiday);
  } catch (err) {
    res.status(500).json({ message: "Failed to create holiday" });
  }
}

export async function updateHolidayController(req, res) {
  try {
    const id = Number(req.params.id);

    const payload = {
      name: req.body.name,
      isOptional: req.body.isOptional,
      date: new Date(req.body.date),
    };

    const updated = await updateHolidayService(id, payload);
    res.json(updated);
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ message: "Failed to update holiday" });
  }
}

export async function deleteHolidayController(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid holiday ID" });

    await deleteHolidayService(id);
    res.json({ message: "Holiday deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete holiday" });
  }
}

export async function uploadHolidayBulkController(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const originalName = req.file.originalname.toLowerCase();

    // Validate file extension strictly to .csv
    if (!originalName.endsWith(".csv")) {
      return res.status(400).json({ message: "File format is wrong" });
    }

    // Validate file format strictly to holidays-2025.csv
    const match = req.file.originalname.match(/(19|20)\d{2}/);
    if (!match) {
      return res.status(400).json({
        message: "Filename should be like holidays-2025.csv",
      });
    }

    const year = Number(match[0]);
    const fileName = req.file.originalname.toLowerCase();

    await uploadHolidayBulkService(req.file.path, fileName, year);

    res.json({ message: `Holidays uploaded for year ${year}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to upload holidays" });
  }
}
