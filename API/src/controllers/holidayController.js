import {
  listHolidaysService,
  createHolidayService,
  uploadHolidayBulkService,
  deleteHolidayService,
  updateHolidayService,
} from "../services/holidayService.js";

// LIST HOLIDAYS
export async function listHolidaysController(req, res) {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const holidays = await listHolidaysService(year);
    return res.json(holidays);
  } catch (err) {
    console.error("LIST HOLIDAY ERROR:", err);
    res.status(500).json({ message: "Failed to list holidays" });
  }
}

// CREATE HOLIDAY
export async function createHolidayController(req, res) {
  try {
    const holiday = await createHolidayService(req.body);
    return res.status(201).json(holiday);
  } catch (err) {
    console.error("CREATE HOLIDAY ERROR:", err);
    res.status(500).json({
      message: err.message || "Failed to create holiday",
    });
  }
}

// UPDATE HOLIDAY
export async function updateHolidayController(req, res) {
  try {
    const id = Number(req.params.id);

    const payload = {
      name: req.body.name,
      isOptional: req.body.isOptional,
      date: req.body.date,
    };

    const updated = await updateHolidayService(id, payload);
    return res.json(updated);
  } catch (err) {
    console.error("UPDATE HOLIDAY ERROR:", err);
    res.status(500).json({
      message: err.message || "Failed to update holiday",
    });
  }
}

// DELETE HOLIDAY (SOFT DELETE)
export async function deleteHolidayController(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid holiday ID" });

    await deleteHolidayService(id);

    return res.json({ message: "Holiday deleted successfully" });
  } catch (err) {
    console.error("DELETE HOLIDAY ERROR:", err);
    res.status(500).json({
      message: err.message || "Failed to delete holiday",
    });
  }
}

// BULK UPLOAD CSV (HARD DELETE YEAR → INSERT NEW)
export async function uploadHolidayBulkController(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const originalName = req.file.originalname.toLowerCase();

    if (!originalName.endsWith(".csv")) {
      return res.status(400).json({ message: "File format is wrong" });
    }

    const match = req.file.originalname.match(/(19|20)\d{2}/);

    if (!match) {
      return res.status(400).json({
        message: "Filename should be like holidays-2025.csv",
      });
    }

    const year = Number(match[0]);

    await uploadHolidayBulkService(req.file.path, originalName, year);

    return res.json({ message: `Holidays uploaded for year ${year}` });
  } catch (err) {
    console.error("BULK UPLOAD HOLIDAY ERROR:", err);
    res.status(500).json({
      message: err.message || "Failed to upload holidays",
    });
  }
}
