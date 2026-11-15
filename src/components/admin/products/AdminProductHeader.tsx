interface AdminProductHeaderProps {
  onOpenCreate: () => void;
  statusMessage?: string;
  actionLoading?: boolean;
}

export function AdminProductHeader({
  onOpenCreate,
  statusMessage,
  actionLoading,
}: AdminProductHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="serif text-3xl font-medium">Products & Inventory</h1>
          <p className="mute text-xs mt-1">
            Manage product catalog, colorways, size variants, and real-time stock
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="btn text-xs tracking-wider py-3 px-6"
        >
          + Add New Product
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 bg-neutral-900 text-white text-xs tracking-wider uppercase animate-fade-in flex items-center justify-between">
          <span>{statusMessage}</span>
          {actionLoading && <span className="animate-spin">⏳</span>}
        </div>
      )}
    </div>
  );
}

