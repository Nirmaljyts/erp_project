import { useNavigate } from "react-router-dom";

type RingProps = {
  label: string;
  taken: number;
  total: number | null;
  linkTo: any;
};

export function RingComponent({ label, taken, total, linkTo }: RingProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(linkTo);
  };
  // LOP
  if (total === null) {
    return (
      <div className="flex flex-col items-center">
        <div
          className="relative w-16 h-16 rounded-full flex items-center justify-center cursor-pointer"
          style={{
            background: `conic-gradient(#6b7280 100%, #e5e7eb 0)`,
          }}
          onClick={handleClick}
        >
          <div className="w-12 h-12 rounded-full bg-[var(--card)] text-[var(--text)] flex items-center justify-center text-sm font-bold cursor-pointer">
            {taken}
          </div>
        </div>
        <p className="mt-2 text-xs font-semibold">{label}</p>
      </div>
    );
  }

  const safeTaken = Math.min(taken, total);
  const remaining = total - safeTaken;

  const takenPercent = (safeTaken / total) * 100;

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer"
        style={{
          background: `
            conic-gradient(
              #dc2626 ${takenPercent}%,
              #16a34a ${takenPercent}% 100%
            )
          `,
        }}
        onClick={handleClick}
      >
        <div className="w-12 h-12 rounded-full bg-[var(--card)] text-[var(--text)] flex items-center justify-center text-sm font-bold cursor-pointer">
          {remaining}/{total}
        </div>
      </div>

      <p className="mt-2 text-xs font-semibold">{label}</p>
    </div>
  );
}
