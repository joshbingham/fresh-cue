import type { InventoryItem } from "../types";
import {
  getDaysUntilExpiry,
  getExpiryUrgency,
} from "../utils";

interface InventoryCardProps {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
}

function formatQuantity(item: InventoryItem): string {
  if (item.quantityUnit === "item") {
    return `${item.quantity} ${item.quantity === 1 ? "item" : "items"}`;
  }

  if (item.quantityUnit === "l") {
    return `${item.quantity} ${item.quantity === 1 ? "litre" : "litres"}`;
  }

  return `${item.quantity} ${item.quantityUnit}`;
}

function formatStorageLocation(
  storageLocation: InventoryItem["storageLocation"],
): string {
  return (
    storageLocation.charAt(0).toUpperCase() +
    storageLocation.slice(1)
  );
}

function getExpiryLabel(expiryDate: string): string {
  const daysUntilExpiry = getDaysUntilExpiry(expiryDate);

  if (daysUntilExpiry < 0) {
    const daysExpired = Math.abs(daysUntilExpiry);

    return `Expired ${daysExpired} ${
      daysExpired === 1 ? "day" : "days"
    } ago`;
  }

  if (daysUntilExpiry === 0) {
    return "Expires today";
  }

  if (daysUntilExpiry === 1) {
    return "Expires tomorrow";
  }

  return `Expires in ${daysUntilExpiry} days`;
}

export default function InventoryCard({
  item,
  onEdit,
}: InventoryCardProps) {
  const urgency = getExpiryUrgency(item.expiryDate);

  return (
    <article className={`inventory-card inventory-card--${urgency}`}>
      <div className="inventory-card__header">
        <h3>{item.name}</h3>
        <span className={`urgency-label urgency-label--${urgency}`}>
          {getExpiryLabel(item.expiryDate)}
        </span>
      </div>

      <dl className="inventory-card__details">
        <div>
          <dt>Quantity</dt>
          <dd>{formatQuantity(item)}</dd>
        </div>

        <div>
          <dt>Expiry date</dt>
          <dd>
            <time dateTime={item.expiryDate}>
              {new Date(
                `${item.expiryDate}T00:00:00`,
              ).toLocaleDateString("en-GB")}
            </time>
          </dd>
        </div>

        <div>
          <dt>Stored in</dt>
          <dd>{formatStorageLocation(item.storageLocation)}</dd>
        </div>
      </dl>

      <button
        type="button"
        className="inventory-card__edit-button"
        onClick={() => onEdit(item)}
      >
        Edit
      </button>
    </article>
  );
}