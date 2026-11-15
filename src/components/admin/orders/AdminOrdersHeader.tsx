interface AdminOrdersHeaderProps {
  statusMessage?: string;
  isLoading?: boolean;
}

export function AdminOrdersHeader({
  statusMessage,
  isLoading,
}: AdminOrdersHeaderProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="serif text-3xl font-medium">Orders Management</h1>
        <p className="mute text-xs mt-1">
          Review, fulfill, and update order statuses across all sales channels
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 bg-neutral-900 text-white text-xs tracking-wider uppercase animate-fade-in flex items-center justify-between">
          <span>{statusMessage}</span>
          {isLoading && <span className="animate-spin">⏳</span>}
        </div>
      )}
    </div>
  );
}

