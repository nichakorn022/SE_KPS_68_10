export default function AdminFilterSummary({
  count,
  noun,
  filteredLabel,
  defaultLabel,
  hasActiveFilters,
  onClear,
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-[#fcfbf7] px-4 py-4 ring-1 ring-[#efe8d8]">
      <div>
        <p className="text-sm font-medium text-[#2f3529]">
          Showing {count} {noun}
          {count === 1 ? "" : "s"}
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8d9577]">
          {hasActiveFilters ? filteredLabel : defaultLabel}
        </p>
      </div>
      <button
        type="button"
        onClick={onClear}
        disabled={!hasActiveFilters}
        className="rounded-full bg-[#efe8d8] px-4 py-2 text-xs font-medium text-[#485b3b] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Clear filters
      </button>
    </div>
  );
}
