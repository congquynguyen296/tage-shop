interface AdminProductHeaderProps {
  onOpenCreate: () => void;
}

export function AdminProductHeader({ onOpenCreate }: AdminProductHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 className="serif text-2xl sm:text-3xl font-medium">
          Products & Inventory
        </h1>
        <p className="mute text-xs mt-1">
          Manage product catalog, colorways, size variants, and real-time stock
        </p>
      </div>

      <button
        onClick={onOpenCreate}
        className="btn text-xs tracking-wider py-3 px-6 w-full sm:w-auto text-center shrink-0"
      >
        + Add New Product
      </button>
    </div>
  );
}
