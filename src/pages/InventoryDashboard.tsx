import { useState } from "react";
import AddItemForm from "../components/AddItemForm";
import InventoryCard from "../components/InventoryCard";
import InventorySummary from "../components/InventorySummary";
import UseSoonSection from "../components/UseSoonSection";
import { sampleInventory } from "../data/sampleInventory";
import type { InventoryItem } from "../types";

export default function InventoryDashboard() {
  const [inventory, setInventory] = useState(sampleInventory);

  const activeItems = inventory
    .filter((item) => item.status === "active")
    .sort(
        (a, b) =>
        new Date(`${a.expiryDate}T00:00:00`).getTime() -
        new Date(`${b.expiryDate}T00:00:00`).getTime(),
    );

  function handleAddItem(item: InventoryItem) {
    setInventory((currentInventory) => [
      item,
      ...currentInventory,
    ]);
  }

  return (
    <main className="inventory-dashboard">
      <header className="inventory-dashboard__header">
        <p className="inventory-dashboard__eyebrow">
          Food inventory and expiry planning
        </p>

        <h1>FreshCue</h1>

        <p>
          See what you have, prioritise what to use next and reduce
          household food waste.
        </p>
      </header>

      <InventorySummary items={inventory} />

      <section
        className="add-item-section"
        aria-labelledby="add-item-heading"
        >
        <div className="add-item-section__header">
            <p className="inventory-summary__eyebrow">Add to inventory</p>
            <h2 id="add-item-heading">Add a food item</h2>
            <p>
            Record what you have and FreshCue will help prioritise what to
            use first.
            </p>
        </div>

        <AddItemForm onAddItem={handleAddItem} />
        </section>

      

      <UseSoonSection items={inventory} />

      <section
        className="all-inventory-section"
        aria-labelledby="all-inventory-heading"
      >
        <h2 id="all-inventory-heading">All inventory</h2>

        {activeItems.length === 0 ? (
          <div className="empty-state">
            <h3>Your inventory is empty</h3>
            <p>
              Add your first food item to start tracking what needs
              using.
            </p>
          </div>
        ) : (
          <div className="inventory-list">
            {activeItems.map((item) => (
              <InventoryCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}