import type { InventoryItem } from "../types";

interface InventorySummaryProps {
  items: InventoryItem[];
}

export default function InventorySummary({
  items,
}: InventorySummaryProps) {
  const activeItems = items.filter(
    (item) => item.status === "active",
  );

  const fridgeItems = activeItems.filter(
    (item) => item.storageLocation === "fridge",
  );

  const freezerItems = activeItems.filter(
    (item) => item.storageLocation === "freezer",
  );

  const cupboardItems = activeItems.filter(
    (item) => item.storageLocation === "cupboard",
  );

  return (
    <section
      className="inventory-summary"
      aria-labelledby="inventory-summary-heading"
    >
      <div>
        <p className="inventory-summary__eyebrow">
          Current inventory
        </p>
        <h2 id="inventory-summary-heading">
          {activeItems.length} active{" "}
          {activeItems.length === 1 ? "item" : "items"}
        </h2>
      </div>

      <dl className="inventory-summary__breakdown">
        <div>
          <dt>Fridge</dt>
          <dd>{fridgeItems.length}</dd>
        </div>

        <div>
          <dt>Freezer</dt>
          <dd>{freezerItems.length}</dd>
        </div>

        <div>
          <dt>Cupboard</dt>
          <dd>{cupboardItems.length}</dd>
        </div>
      </dl>
    </section>
  );
}