import type { InventoryItem } from "../types";
import { getDaysUntilExpiry } from "../utils";
import InventoryCard from "./InventoryCard";

interface UseSoonSectionProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
}

export default function UseSoonSection({
  items,
  onEdit,
}: UseSoonSectionProps) {
  const useSoonItems = items.filter((item) => {
    if (item.status !== "active") {
      return false;
    }

    const daysUntilExpiry = getDaysUntilExpiry(
      item.expiryDate,
    );

    return daysUntilExpiry >= 0 && daysUntilExpiry <= 3;
  });

  return (
    <section
      aria-labelledby="use-soon-heading"
      className="use-soon-section"
    >
      <h2 id="use-soon-heading">Use Soon</h2>

      {useSoonItems.length === 0 ? (
        <p>No items need using soon.</p>
      ) : (
        <div className="inventory-list">
          {useSoonItems.map((item) => (
            <InventoryCard
              key={item.id}
              item={item}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </section>
  );
}