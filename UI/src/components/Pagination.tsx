import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pagesToShow = 3;
  const pageNumbers: (number | string)[] = [];

  // Always show first page
  pageNumbers.push(1);

  // Insert left ellipsis
  if (page > pagesToShow + 2) {
    pageNumbers.push("...");
  }

  // Middle pages
  for (
    let i = Math.max(2, page - pagesToShow);
    i <= Math.min(totalPages - 1, page + pagesToShow);
    i++
  ) {
    pageNumbers.push(i);
  }

  // Insert right ellipsis
  if (page < totalPages - (pagesToShow + 1)) {
    pageNumbers.push("...");
  }

  // Always show last page
  if (totalPages > 1) {
    pageNumbers.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center py-2 gap-2">
      {/* Prev Button */}
      <button
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="p-1 border border-[var(--border)] rounded-md disabled:opacity-40 hover:bg-[#2f4f82] dark:hover:bg-[#2f4f82] hover:text-white disabled:pointer-events-none"
      >
        <ChevronLeft />
      </button>

      {pageNumbers.map((num, idx) =>
        num === "..." ? (
          <span key={idx} className="px-2 text-gray-500">
            ...
          </span>
        ) : (
          <button
            key={idx}
            onClick={() => onPageChange(num as number)}
            className={`px-3 py-1 rounded-md border 
              ${
                page === num
                  ? "bg-[#2f4f82] text-white border border-[var(--border)]"
                  : "hover:bg-[#2f4f82] dark:hover:bg-[#2f4f82] hover:text-white"
              }`}
          >
            {num}
          </button>
        )
      )}

      <button
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        className="p-1 border border-[var(--border)] rounded-md disabled:opacity-40 hover:bg-[#2f4f82] dark:hover:bg-[#2f4f82] hover:text-white disabled:pointer-events-none"
      >
        <ChevronRight />
      </button>
    </div>
  );
}
