interface AdminMetricCardsProps {
  catalogCount: number;
  availableCount?: number;
  soldOutCount?: number;
  lowStockCount: number;
}

export function AdminMetricCards({
  catalogCount,
  availableCount = 0,
  soldOutCount = 0,
  lowStockCount,
}: AdminMetricCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
      <div className="card p-4 sm:p-6 border line bg-white">
        <div className="text-[10px] sm:text-[11px] tracking-widest uppercase mute mb-1.5 sm:mb-2">
          Total Catalog
        </div>
        <div className="serif text-2xl sm:text-3xl">{catalogCount}</div>
        <div className="text-[11px] sm:text-xs mute mt-1.5 sm:mt-2">
          1-of-1 Pieces in DB
        </div>
      </div>

      <div className="card p-4 sm:p-6 border line bg-white">
        <div className="text-[10px] sm:text-[11px] tracking-widest uppercase mute mb-1.5 sm:mb-2">
          Available
        </div>
        <div className="serif text-2xl sm:text-3xl text-emerald-700">
          {availableCount}
        </div>
        <div className="text-[11px] sm:text-xs text-emerald-600 mt-1.5 sm:mt-2">
          Ready to share / sell
        </div>
      </div>

      <div className="card p-4 sm:p-6 border line bg-white">
        <div className="text-[10px] sm:text-[11px] tracking-widest uppercase mute mb-1.5 sm:mb-2">
          Sold Out
        </div>
        <div className="serif text-2xl sm:text-3xl">{soldOutCount}</div>
        <div className="text-[11px] sm:text-xs mute mt-1.5 sm:mt-2">
          Archived pieces
        </div>
      </div>

      <div className="card p-4 sm:p-6 border line bg-white">
        <div className="text-[10px] sm:text-[11px] tracking-widest uppercase mute mb-1.5 sm:mb-2">
          Stock Alerts
        </div>
        <div
          className={`serif text-2xl sm:text-3xl ${
            lowStockCount ? "text-amber-600" : ""
          }`}
        >
          {lowStockCount}
        </div>
        <div className="text-[11px] sm:text-xs mute mt-1.5 sm:mt-2">
          Variants with stock ≤ 3
        </div>
      </div>
    </div>
  );
}
