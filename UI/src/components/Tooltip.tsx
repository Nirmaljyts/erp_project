import { ReactNode } from "react";

type TooltipPosition = "top" | "bottom" | "left" | "right";

type TooltipProps = {
  text: string;
  children: ReactNode;
  position?: TooltipPosition;
};

export default function Tooltip({
  text,
  children,
  position = "top",
}: TooltipProps) {
  const positionClasses = {
    top: "left-1/2 -translate-x-1/2 -top-8",
    bottom: "left-1/2 -translate-x-1/2 top-8",
    left: "-left-2 -translate-x-full top-1/2 -translate-y-1/2",
    right: "left-full ml-2 top-1/2 -translate-y-1/2",
  };

  return (
    <div className="relative group inline-flex items-center">
      {children}

      <span
        className={`
          absolute ${positionClasses[position]}
          px-2 py-1 text-xs rounded bg-black text-white
          opacity-0 group-hover:opacity-100
          pointer-events-none whitespace-nowrap
          transition
          z-50
        `}
      >
        {text}
      </span>
    </div>
  );
}
