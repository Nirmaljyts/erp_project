import { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { toast } from "react-toastify";
import {
  getHolidays,
  uploadHolidayFile,
  createHoliday,
  deleteHoliday,
  updateHoliday,
} from "../services/holidayServices";
import { X } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

export default function CalendarPage() {
  const calendarRef = useRef(null);
  const user = useSelector((state: RootState) => state?.auth?.user);
  const role = user?.role || "";

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [errors, setErrors] = useState({ name: "" });

  const [modal, setModal] = useState({
    open: false,
    mode: "create",
    id: null,
    date: "",
    name: "",
    isOptional: false,
  });

  const loadData = async (year: number) => {
    const data = await getHolidays(year);
    setEvents(
      data.map((h: any) => ({
        id: h.id,
        title: h.name,
        start: h.date,
        country: h.country,
        isOptional: h.isOptional,
        allDay: true,
        backgroundColor: h.isOptional ? "#8b5cf6" : "#10b981",
        borderColor: "transparent",
        textColor: "#fff",
      }))
    );
  };

  useEffect(() => {
    loadData(currentYear);
  }, [currentYear]);

  function formatDate(d: string) {
    const date = new Date(d);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  const handleUpload = async (file: File) => {
    toast.loading("Uploading holidays...");
    try {
      const res = await uploadHolidayFile(file);
      toast.dismiss();
      toast.success(res.message);
      loadData(currentYear);
    } catch (err: any) {
      toast.dismiss();
      toast.error(err?.response?.data?.message || "Upload failed");
    }
  };

  const closeModal = () => {
    setModal({ ...modal, open: false });
    setErrors({ name: "" });
  };

  const handleSave = async () => {
    if (!modal.name.trim()) {
      setErrors({ name: "Holiday name is required" });
      return;
    } else {
      setErrors({ name: "" });
    }

    toast.loading(
      modal.mode === "create" ? "Creating holiday..." : "Updating holiday..."
    );

    try {
      if (modal.mode === "create") {
        await createHoliday({
          date: modal.date,
          name: modal.name,
          isOptional: modal.isOptional,
        });
      } else if (modal.mode === "edit" && modal.id !== null) {
        await updateHoliday(modal.id, {
          date: modal.date,
          name: modal.name,
          isOptional: modal.isOptional,
        });
      }

      toast.dismiss();
      toast.success(
        modal.mode === "create"
          ? `Holiday created on ${formatDate(modal.date)}!`
          : `Holiday updated on ${formatDate(modal.date)}!`
      );

      setModal({ ...modal, open: false });
      loadData(currentYear);
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to save holiday");
    }
  };

  const handleDelete = async () => {
    if (modal.id === null) {
      toast.error("Invalid holiday ID");
      return;
    }

    toast.loading("Deleting...");

    try {
      await deleteHoliday(modal.id);

      toast.dismiss();
      toast.success("Holiday deleted!");

      setModal({ ...modal, open: false });
      loadData(currentYear);
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="max-h-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0 pb-4">
        <h2 className="font-semibold text-2xl md:text-2xl lg:text-2xl">
          Holidays - {currentYear}
        </h2>

        {(user?.role === "ADMIN" ||
          user?.role === "HR_MANAGER" ||
          user?.role === "HR") && (
          <div className="w-full sm:w-auto flex justify-end">
            <label className="px-4 py-2 text-sm sm:text-sm rounded-lg bg-[#2f4f82] text-white cursor-pointer font-medium hover:bg-[#1b335a]">
              <span className="cursor-pointer">Upload Holidays</span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
              />
            </label>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 border border-[var(--border)] rounded-lg p-3">
        <div className="w-full flex items-end justify-end gap-6 mb-3">
          <div className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded-sm"
              style={{ backgroundColor: "#16a34a" }}
            />
            <span className=" text-[var(--text)] text-[12px] sm:text-sm">
              Mandatory Holidays
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded-sm"
              style={{ backgroundColor: "#8b5cf6" }}
            />
            <span className="text-[var(--text)] text-[12px] sm:text-sm">
              Optional Holidays
            </span>
          </div>
        </div>

        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          initialDate={currentDate}
          headerToolbar={{
            left: "title",
            center: "",
            right: "today prev,next",
          }}
          buttonText={{
            today: "Today",
          }}
          height="100%"
          contentHeight="auto"
          expandRows={true}
          eventClick={(info) => {
            if (role !== "ADMIN" && role !== "HR_MANAGER" && role !== "HR")
              return;

            const holiday = events.find((e) => e.id == info.event.id);

            setModal({
              open: true,
              mode: "edit",
              id: holiday.id,
              date: holiday.start,
              name: holiday.title,
              isOptional: holiday.isOptional,
            });
          }}
          eventDidMount={(info) => {
            const el = info.el;

            el.style.cursor = "pointer";
            el.style.pointerEvents = "auto";
            el.querySelectorAll("*").forEach((child: any) => {
              child.style.pointerEvents = "auto";
            });

            const { country, isOptional } = info.event.extendedProps;
            el.title = `${info.event.title}\nCountry: ${country}\n${
              isOptional ? "Optional Holiday" : "Public Holiday"
            }`;
          }}
          datesSet={(info) => {
            setCurrentYear(info.view.currentStart.getFullYear());
            setCurrentDate(info.view.currentStart);
          }}
          dateClick={(info) => {
            if (role !== "ADMIN" && role !== "HR_MANAGER" && role !== "HR")
              return;

            setModal({
              open: true,
              mode: "create",
              id: null,
              date: info.dateStr,
              name: "",
              isOptional: false,
            });
          }}
        />
      </div>

      {/* ADD/EDIT HOLIDAY MODAL */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] p-4 rounded-lg w-80 space-y-2 relative">
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4"
            >
              <X size={22} className="text-[var(--text)] cursor-pointer" />
            </button>

            <h3 className="text-lg font-semibold">
              {modal.mode === "create" ? "Add Holiday" : "Edit Holiday"}
            </h3>

            <p className="text-sm">
              Date: <span className="font-semibold">{modal.date}</span>
            </p>

            <input
              type="text"
              className={`w-full p-2 border rounded ${
                errors.name
                  ? "border-red-500"
                  : "border border-[var(--border)] "
              } bg-[var(--card)] text-[var(--text)]`}
              placeholder="Holiday name"
              value={modal.name}
              onChange={(e) => {
                setModal({ ...modal, name: e.target.value });

                if (e.target.value.trim()) {
                  setErrors({ name: "" });
                }
              }}
            />

            {errors.name && (
              <p className="text-red-500 text-xs">{errors.name}</p>
            )}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={modal.isOptional}
                onChange={(e) =>
                  setModal({ ...modal, isOptional: e.target.checked })
                }
              />
              Optional Holiday
            </label>

            <div className="flex items-center gap-2">
              {modal.mode === "edit" && (
                <button
                  className="bg-red-600 text-white w-full py-2 rounded"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              )}

              <button
                className="bg-[#2f4f82] text-white font-medium hover:bg-[#1b335a] w-full py-2 rounded"
                onClick={handleSave}
              >
                {modal.mode === "create" ? "Save" : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
