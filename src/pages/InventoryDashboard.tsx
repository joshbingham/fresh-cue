import { useEffect, useState } from "react";
import AddItemForm from "../components/AddItemForm";
import EditItemForm from "../components/EditItemForm";
import InventoryCard from "../components/InventoryCard";
import InventorySummary from "../components/InventorySummary";
import UseSoonSection from "../components/UseSoonSection";
import type { InventoryItem } from "../types";

type StorageFilter = "all" | InventoryItem["storageLocation"];

interface InventoryApiItem {
  id: string;
  name: string;
  quantity: string | number;
  quantity_unit: InventoryItem["quantityUnit"];
  expiry_date: string;
  storage_location: InventoryItem["storageLocation"];
  status: InventoryItem["status"];
  created_at: string;
  updated_at: string;
}

interface CreateInventoryItemRequest {
  name: string;
  quantity: number;
  quantityUnit: InventoryItem["quantityUnit"];
  expiryDate: string;
  storageLocation: InventoryItem["storageLocation"];
}



export default function InventoryDashboard() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [addItemError, setAddItemError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  const [storageFilter, setStorageFilter] =
    useState<StorageFilter>("all");

  const [itemBeingEdited, setItemBeingEdited] =
    useState<InventoryItem | null>(null);

  const [itemBeingDeleted, setItemBeingDeleted] =
    useState<InventoryItem | null>(null);

  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInventory() {
      try {
        const response = await fetch(
          "http://localhost:3001/inventory",
        );

        if (!response.ok) {
          throw new Error(
            `Inventory request failed with status ${response.status}`,
          );
        }

        const data = (await response.json()) as InventoryApiItem[];

        const mappedInventory: InventoryItem[] = data.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: Number(item.quantity),
          quantityUnit: item.quantity_unit,
          expiryDate: item.expiry_date.slice(0, 10),
          storageLocation: item.storage_location,
          status: item.status,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));

        setInventory(mappedInventory);
      } catch (error) {
        console.error("Failed to load inventory:", error);

        setLoadError(
          "We couldn't load your inventory. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadInventory();
  }, []);

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

  async function handleAddItem(
    item: CreateInventoryItemRequest,
  ): Promise<boolean> {
    setAddItemError(null);

    try {
      const response = await fetch(
        "http://localhost:3001/inventory",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: item.name,
            quantity: item.quantity,
            quantity_unit: item.quantityUnit,
            expiry_date: item.expiryDate,
            storage_location: item.storageLocation,
            status: "active",
          }),
        },
      );

      if (!response.ok) {
        const errorData = (await response.json()) as {
          errors?: string[];
          message?: string;
        };

        const message =
          errorData.errors?.join(" ") ??
          errorData.message ??
          "Unable to add this item. Please try again.";

        setAddItemError(message);

        return false;
      }

      const createdItem =
        (await response.json()) as InventoryApiItem;

      const mappedItem: InventoryItem = {
        id: createdItem.id,
        name: createdItem.name,
        quantity: Number(createdItem.quantity),
        quantityUnit: createdItem.quantity_unit,
        expiryDate: createdItem.expiry_date.slice(0, 10),
        storageLocation: createdItem.storage_location,
        status: createdItem.status,
        createdAt: createdItem.created_at,
        updatedAt: createdItem.updated_at,
      };

      setInventory((currentInventory) => [
        ...currentInventory,
        mappedItem,
      ]);

      return true;
    } catch (error) {
      console.error(
        "Failed to create inventory item:",
        error,
      );

      setAddItemError(
        "Unable to connect to the server. Please try again.",
      );

      return false;
    }
  }

  function handleEditItem(item: InventoryItem) {
    setItemBeingEdited(item);
  }

  async function handleSaveItem(
    updatedItem: InventoryItem,
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `http://localhost:3001/inventory/${updatedItem.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: updatedItem.name,
            quantity: updatedItem.quantity,
            quantity_unit: updatedItem.quantityUnit,
            expiry_date: updatedItem.expiryDate,
            storage_location: updatedItem.storageLocation,
            status: updatedItem.status,
          }),
        },
      );

      if (!response.ok) {
        return false;
      }

      const savedItem =
        (await response.json()) as InventoryApiItem;

      const mappedItem: InventoryItem = {
        id: savedItem.id,
        name: savedItem.name,
        quantity: Number(savedItem.quantity),
        quantityUnit: savedItem.quantity_unit,
        expiryDate: savedItem.expiry_date.slice(0, 10),
        storageLocation: savedItem.storage_location,
        status: savedItem.status,
        createdAt: savedItem.created_at,
        updatedAt: savedItem.updated_at,
      };

      setInventory((currentInventory) =>
        currentInventory.map((item) =>
          item.id === mappedItem.id ? mappedItem : item,
        ),
      );

      setItemBeingEdited(null);

      return true;
    } catch (error) {
      console.error("Failed to update inventory item:", error);

      return false;
    }
  }

  function handleCancelEdit() {
    setItemBeingEdited(null);
  }

  function handleDeleteItem(item: InventoryItem) {
    setItemBeingDeleted(item);
  }

  async function handleConfirmDelete(): Promise<void> {
    if (!itemBeingDeleted) {
      return;
    }

    setDeleteError(null);

    try {
      const response = await fetch(
        `http://localhost:3001/inventory/${itemBeingDeleted.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        setDeleteError(
          "Unable to delete this item. Please try again.",
        );

        return;
      }

      setInventory((currentInventory) =>
        currentInventory.filter(
          (item) => item.id !== itemBeingDeleted.id,
        ),
      );

      setItemBeingDeleted(null);
    } catch (error) {
      console.error(
        "Failed to delete inventory item:",
        error,
      );

      setDeleteError(
        "Unable to connect to the server. Please try again.",
      );
    }
  }

  function handleCancelDelete() {
    setDeleteError(null);
    setItemBeingDeleted(null);
  }

  if (isLoading) {
    return (
      <main className="inventory-dashboard">
        <p>Loading inventory...</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="inventory-dashboard">
        <p role="alert">{loadError}</p>
      </main>
    );
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
        {addItemError && (
          <p className="form-error" role="alert">
            {addItemError}
          </p>
        )}
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

              {deleteError && (
                <p className="form-error" role="alert">
                  {deleteError}
                </p>
              )}

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