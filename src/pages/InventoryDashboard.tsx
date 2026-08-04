import InventoryCard from "../components/InventoryCard";
import InventorySummary from "../components/InventorySummary";
import UseSoonSection from "../components/UseSoonSection";
import { sampleInventory } from "../data/sampleInventory";

export default function InventoryDashboard() {
  const activeItems = sampleInventory.filter(
    (item) => item.status === "active",
  );

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

      <InventorySummary items={sampleInventory} />

      <UseSoonSection items={sampleInventory} />

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
              <InventoryCard
                key={item.id}
                item={item}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}