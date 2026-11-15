"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Product, ProductCategory } from "@/types";
import { useProductStore } from "@/service/products/store";
import {
  DEFAULT_PRODUCT_IMAGE,
  handleProductImageError,
  money,
} from "@/config/utils";

interface AdminCollectionComboSelectorProps {
  category: ProductCategory;
  currentProductId?: string | number;
  selectedComboIds: string[];
  comboTitle?: string;
  onChangeComboIds: (nextIds: string[]) => void;
  onChangeComboTitle?: (title: string) => void;
  onApplySumPrice?: (sumPrice: number) => void;
}

type ModalFilterTab = "all" | "collection" | "individual";

export function AdminCollectionComboSelector({
  category,
  currentProductId,
  selectedComboIds,
  comboTitle = "",
  onChangeComboIds,
  onChangeComboTitle,
  onApplySumPrice,
}: AdminCollectionComboSelectorProps) {
  const allProducts = useProductStore((s) => s.products);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ModalFilterTab>("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  // Available catalog items excluding the product currently being edited
  const availableProducts = useMemo(
    () =>
      allProducts.filter((p) =>
        currentProductId !== undefined
          ? String(p.id) !== String(currentProductId)
          : true
      ),
    [allProducts, currentProductId]
  );

  const selectedProducts = useMemo(
    () =>
      availableProducts.filter((p) =>
        selectedComboIds.includes(String(p.id))
      ),
    [availableProducts, selectedComboIds]
  );

  const totalSelectedValue = useMemo(
    () => selectedProducts.reduce((sum, p) => sum + Number(p.price || 0), 0),
    [selectedProducts]
  );

  const filteredModalProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return availableProducts.filter((p) => {
      if (activeTab === "collection" && p.category !== "Collection") {
        return false;
      }
      if (activeTab === "individual" && p.category === "Collection") {
        return false;
      }
      if (q) {
        const matchName = p.name.toLowerCase().includes(q);
        const matchCat = p.category.toLowerCase().includes(q);
        const matchCombo = (p.comboTitle || "").toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchCombo) return false;
      }
      return true;
    });
  }, [availableProducts, activeTab, searchQuery]);

  // Only show when category is "Collection"
  if (category !== "Collection") {
    return null;
  }

  const toggleProductSelection = (product: Product) => {
    const targetId = String(product.id);
    const isAlreadySelected = selectedComboIds.includes(targetId);

    if (isAlreadySelected) {
      onChangeComboIds(selectedComboIds.filter((id) => id !== targetId));
      return;
    }

    // If user clicks a Collection set that already has linked comboItems,
    // also include its linked member IDs for convenience
    const linkedMemberIds = (product.comboItems || [])
      .map((item) => String(item.id))
      .filter((id) => id !== String(currentProductId));

    const nextIds = Array.from(
      new Set([...selectedComboIds, targetId, ...linkedMemberIds])
    );
    onChangeComboIds(nextIds);

    if (
      onChangeComboTitle &&
      !comboTitle &&
      (product.comboTitle || product.category === "Collection")
    ) {
      onChangeComboTitle(product.comboTitle || product.name);
    }
  };

  const removeSelectedProduct = (idToRemove: string) => {
    onChangeComboIds(selectedComboIds.filter((id) => id !== idToRemove));
  };

  return (
    <div className="p-4 sm:p-5 border line bg-neutral-50/70 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b line">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-black text-white text-[10px] font-mono uppercase tracking-widest">
              Collection Set
            </span>
            <h3 className="text-xs tracking-widest uppercase font-semibold">
              Combo & Outfit Pieces Selection
            </h3>
          </div>
          <p className="mute text-xs mt-1">
            Link individual pieces (e.g., Tee, Jacket, Pants) into this
            Collection combo, or select an existing Collection set.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn text-xs py-2.5 px-4 shrink-0 self-start sm:self-auto"
        >
          + Select Combo Pieces ({selectedProducts.length})
        </button>
      </div>

      {/* Selected Combo Pieces Preview */}
      {selectedProducts.length > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="uppercase tracking-wider text-[11px] font-medium">
              Linked Pieces in this Collection ({selectedProducts.length})
            </span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs">
                Individual Sum:{" "}
                <strong className="font-semibold">
                  {money(totalSelectedValue)}
                </strong>
              </span>
              {onApplySumPrice && totalSelectedValue > 0 && (
                <button
                  type="button"
                  onClick={() => onApplySumPrice(totalSelectedValue)}
                  className="text-[11px] underline hover:text-black mute transition-colors"
                >
                  Apply {money(totalSelectedValue)} as Combo Price
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {selectedProducts.map((item) => {
              const thumb =
                item.images?.[0] ||
                item.temporaryImages?.[0] ||
                DEFAULT_PRODUCT_IMAGE;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2.5 border line bg-white"
                >
                  <div className="w-12 h-16 border line bg-[#ebebeb] shrink-0 overflow-hidden">
                    <img
                      src={thumb}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={handleProductImageError}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-wider mute">
                      {item.category} · {(item.sizes || ["OS"]).join(", ")}
                    </div>
                    <div className="text-xs font-medium truncate">
                      {item.name}
                    </div>
                    <div className="text-xs font-mono mt-0.5">
                      {money(item.price)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSelectedProduct(String(item.id))}
                    className="w-6 h-6 border line flex items-center justify-center text-xs mute hover:text-red-600 hover:border-red-300 shrink-0"
                    title="Remove from combo"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 border border-dashed border-neutral-300 bg-white text-center space-y-2">
          <p className="text-xs mute">
            No combo pieces linked yet. Click{" "}
            <strong className="text-black font-medium">
              + Select Combo Pieces
            </strong>{" "}
            to open the catalog popup and choose the individual items (Tee,
            Jacket, Pants) or existing Collection set.
          </p>
        </div>
      )}

      {/* Popup Modal to Select Combo Pieces / Collection Sets */}
      {mounted &&
        isModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9998] bg-black/65 backdrop-blur-[1px] flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="bg-white border line w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b line flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest mute">
                    Category: Collection
                  </div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider mt-0.5">
                    Select Combo Pieces / Collection Set
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 border line flex items-center justify-center text-sm mute hover:text-black"
                  aria-label="Close popup"
                >
                  ✕
                </button>
              </div>

              {/* Search & Filter Tabs */}
              <div className="p-4 border-b line bg-neutral-50 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by product name, category (e.g. Tees, Bottoms, Outerwear)..."
                    className="flex-1 min-w-0 bg-white border line px-3 py-2 text-xs outline-none focus:border-black"
                  />
                  {selectedComboIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onChangeComboIds([])}
                      className="px-3 py-2 border line bg-white text-[11px] uppercase tracking-wider mute hover:text-black shrink-0"
                    >
                      Clear Selection ({selectedComboIds.length})
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      {
                        id: "all",
                        label: `All Catalog (${availableProducts.length})`,
                      },
                      {
                        id: "individual",
                        label: `Individual Pieces (${
                          availableProducts.filter(
                            (p) => p.category !== "Collection"
                          ).length
                        })`,
                      },
                      {
                        id: "collection",
                        label: `Collection Sets (${
                          availableProducts.filter(
                            (p) => p.category === "Collection"
                          ).length
                        })`,
                      },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-1.5 text-[11px] uppercase tracking-wider border line transition-colors ${
                        activeTab === tab.id
                          ? "bg-black text-white border-black"
                          : "bg-white hover:border-black/50"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product List Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                {filteredModalProducts.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <p className="text-xs uppercase tracking-wider mute">
                      No matching products found in catalog.
                    </p>
                    <p className="text-[11px] mute">
                      Create individual products (e.g. Tee, Jacket, Pants) first
                      to link them into a Collection combo.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredModalProducts.map((item) => {
                      const isSelected = selectedComboIds.includes(
                        String(item.id)
                      );
                      const thumb =
                        item.images?.[0] ||
                        item.temporaryImages?.[0] ||
                        DEFAULT_PRODUCT_IMAGE;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleProductSelection(item)}
                          className={`relative text-left flex items-center gap-3.5 p-3 border transition-all ${
                            isSelected
                              ? "border-neutral-400 bg-neutral-50"
                              : "border-neutral-200 bg-white hover:border-neutral-400"
                          }`}
                        >
                          <div className="relative w-14 h-20 border line bg-[#ebebeb] shrink-0 overflow-hidden">
                            <img
                              src={thumb}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={handleProductImageError}
                            />
                            {isSelected && (
                              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black text-white flex items-center justify-center shadow-sm">
                                <svg
                                  width="9"
                                  height="9"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider border ${
                                  item.category === "Collection"
                                    ? "bg-black text-white border-black"
                                    : "bg-neutral-100 text-neutral-700 border-neutral-200"
                                }`}
                              >
                                {item.category}
                              </span>
                              <span className="text-[10px] font-mono mute">
                                Size: {(item.sizes || ["OS"]).join(", ")}
                              </span>
                            </div>

                            <div className="text-xs font-semibold truncate">
                              {item.name}
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-0.5">
                              <span className="text-xs font-mono font-medium">
                                {money(item.price)}
                              </span>
                              {item.comboItems && item.comboItems.length > 0 && (
                                <span className="text-[10px] font-mono mute">
                                  ({item.comboItems.length} linked pieces)
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t line bg-neutral-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="mute uppercase tracking-wider text-[11px]">
                    Selected:{" "}
                  </span>
                  <strong className="font-mono">
                    {selectedProducts.length} piece
                    {selectedProducts.length === 1 ? "" : "s"}
                  </strong>
                  {selectedProducts.length > 0 && (
                    <span className="ml-2 font-mono text-xs mute">
                      (Total individual value: {money(totalSelectedValue)})
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  {onApplySumPrice && totalSelectedValue > 0 && (
                    <button
                      type="button"
                      onClick={() => onApplySumPrice(totalSelectedValue)}
                      className="px-3.5 py-2 border line bg-white hover:border-black text-xs uppercase tracking-wider"
                    >
                      Use Sum ({money(totalSelectedValue)})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn text-xs py-2 px-5"
                  >
                    Confirm Selection ({selectedProducts.length})
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
