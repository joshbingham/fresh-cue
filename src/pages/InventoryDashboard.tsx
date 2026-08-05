import { useState } from "react";
import AddItemForm from "../components/AddItemForm";
import EditItemForm from "../components/EditItemForm";
import InventoryCard from "../components/InventoryCard";
import InventorySummary from "../components/InventorySummary";
import UseSoonSection from "../components/UseSoonSection";
import { sampleInventory } from "../data/sampleInventory";
import type { InventoryItem } from "../types";

type StorageFilter = "all" | InventoryItem["storageLocation"];

export default function InventoryDashboard() {
  const [inventory, setInventory] = useState(sampleInventory);

  const [searchQuery, setSearchQuery] = useState("");

  const [storageFilter, setStorageFilter] =
    useState<StorageFilter>("all");

  const [itemBeingEdited, setItemBeingEdited] =
    useState<InventoryItem | null>(null);

  const [itemBeingDeleted, setItemBeingDeleted] =
    useState<InventoryItem | null>(null);

  const normalisedSearchQuery = searchQuery.trim().toLowerCase();

  const activeItems = inventory
    .filter((item) => item.status === "active")
    .filter((item) =>
      item.name
        .toLowerCase()
        .includes(normalisedSearchQuery),
    )
    .filter(
      (item) =>
        storageFilter === "all" ||
        item.storageLocation === storageFilter,
    )
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

  function handleEditItem(item: InventoryItem) {
    setItemBeingEdited(item);
  }

  function handleSaveItem(updatedItem: InventoryItem) {
    setInventory((currentInventory) =>
      currentInventory.map((item) =>
        item.id === updatedItem.id ? updatedItem : item,
      ),
    );

    setItemBeingEdited(null);
  }

  function handleCancelEdit() {
    setItemBeingEdited(null);
  }

  function handleDeleteItem(item: InventoryItem) {
    setItemBeingDeleted(item);
  }

  function handleConfirmDelete() {
    if (!itemBeingDeleted) {
      return;
    }

    setInventory((currentInventory) =>
      currentInventory.filter(
        (item) => item.id !== itemBeingDeleted.id,
      ),
    );

    setItemBeingDeleted(null);
  }

  function handleCancelDelete() {
    setItemBeingDeleted(null);
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
          <p className="inventory-summary__eyebrow">
            Add to inventory
          </p>

          <h2 id="add-item-heading">Add a food item</h2>

          <p>
            Record what you have and FreshCue will help
            prioritise what to use first.
          </p>
        </div>

        <AddItemForm onAddItem={handleAddItem} />
      </section>

      {itemBeingEdited && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={handleCancelEdit}
        >
          <div
            className="modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-item-heading"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <EditItemForm
              key={itemBeingEdited.id}
              item={itemBeingEdited}
              onSave={handleSaveItem}
              onCancel={handleCancelEdit}
            />
          </div>
        </div>
      )}

      {itemBeingDeleted && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={handleCancelDelete}
        >
          <div
            className="modal-dialog modal-dialog--confirmation"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-item-heading"
            aria-describedby="delete-item-description"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <section className="delete-confirmation">
              <div>
                <p className="inventory-summary__eyebrow">
                  Remove from inventory
                </p>

                <h2 id="delete-item-heading">
                  Delete {itemBeingDeleted.name}?
                </h2>

                <p id="delete-item-description">
                  This item will be removed from your inventory.
                </p>
              </div>

              <div className="delete-confirmation__actions">
                <button
                  type="button"
                  className="delete-confirmation__confirm"
                  onClick={handleConfirmDelete}
                >
                  Delete item
                </button>

                <button
                  type="button"
                  className="delete-confirmation__cancel"
                  onClick={handleCancelDelete}
                >
                  Cancel
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

      <UseSoonSection
        items={inventory}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
      />

      <section
        className="all-inventory-section"
        aria-labelledby="all-inventory-heading"
      >
        <h2 id="all-inventory-heading">
          All inventory
        </h2>

        <div className="inventory-search">
          <label htmlFor="inventory-search">
            Search inventory
          </label>

          <input
            id="inventory-search"
            type="search"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
            placeholder="Search by item name"
          />
        </div>

        <fieldset className="storage-filter">
          <legend>Filter by storage location</legend>

          <div className="storage-filter__options">
            {(
              [
                ["all", "All"],
                ["fridge", "Fridge"],
                ["freezer", "Freezer"],
                ["cupboard", "Cupboard"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={
                  storageFilter === value
                    ? "storage-filter__button storage-filter__button--active"
                    : "storage-filter__button"
                }
                onClick={() => setStorageFilter(value)}
                aria-pressed={storageFilter === value}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        {activeItems.length === 0 ? (
          <div className="empty-state">
            {normalisedSearchQuery || storageFilter !== "all" ? (
              <>
                <h3>No matching items</h3>

                <p>
                  Try changing your search or storage filter to view more
                  inventory items.
                </p>
              </>
            ) : (
              <>
                <h3>Your inventory is empty</h3>

                <p>
                  Add your first food item to start tracking what needs
                  using.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="inventory-list">
            {activeItems.map((item) => (
              <InventoryCard
                key={item.id}
                item={item}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}