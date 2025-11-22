import { useEffect, useState } from "react";
import { getHolidays } from "../services/erpServices";

interface Holiday {
  id: number;
  date: string;
  name: string;
  isOptional: boolean;
}

export default function CalendarPage() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  useEffect(() => {
    (async () => {
      try {
        // const data = await getHolidays(currentYear);
        // setHolidays(data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [currentYear]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Holidays {currentYear}</h1>
        <div className="space-x-2">
          <button
            onClick={() => setCurrentYear((y) => y - 1)}
            className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-sm"
          >
            Prev
          </button>
          <button
            onClick={() => setCurrentYear((y) => y + 1)}
            className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-sm"
          >
            Next
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-slate-950/60 border-b border-slate-800">
            <tr>
              <th className="text-left px-4 py-2">Date</th>
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">Optional</th>
            </tr>
          </thead>
          <tbody>
            {holidays.map((h) => (
              <tr key={h.id} className="border-t border-slate-800">
                <td className="px-4 py-2">
                  {new Date(h.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">{h.name}</td>
                <td className="px-4 py-2">{h.isOptional ? "Yes" : "No"}</td>
              </tr>
            ))}
            {holidays.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-4 text-center text-slate-400"
                >
                  No holidays defined
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
