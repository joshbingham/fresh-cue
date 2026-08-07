import { useState, type FormEvent } from "react";
import type {
  InventoryItem,
  InventoryStatus,
  StorageLocation,
} from "../types";

interface EditItemFormProps {
  item: InventoryItem;
  onSave: (item: InventoryItem) => Promise<boolean>;
  onCancel: () => void;
}

interface FormValues {
  name: string;
  quantity: number;
  quantityUnit: InventoryItem["quantityUnit"];
  expiryDate: string;
  storageLocation: StorageLocation;
  status: InventoryStatus;
}

interface FormErrors {
  name?: string;
  quantity?: string;
  expiryDate?: string;
  storageLocation?: string;
}

export default function EditItemForm({
  item,
  onSave,
  onCancel,
}: EditItemFormProps) {
  const [values, setValues] = useState<FormValues>({
    name: item.name,
    quantity: item.quantity,
    quantityUnit: item.quantityUnit,
    expiryDate: item.expiryDate,
    storageLocation: item.storageLocation,
    status: item.status,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaveError(null);

    const nextErrors: FormErrors = {};

    if (!values.name.trim()) {
      nextErrors.name = "Enter an item name.";
    }

    if (values.quantity < 1) {
      nextErrors.quantity =
        "Quantity must be at least 1.";
    }

    if (!values.expiryDate) {
      nextErrors.expiryDate =
        "Choose an expiry date.";
    }

    if (!values.storageLocation) {
      nextErrors.storageLocation =
        "Choose a storage location.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const wasSaved = await onSave({
      ...item,
      name: values.name.trim(),
      quantity: values.quantity,
      quantityUnit: values.quantityUnit,
      expiryDate: values.expiryDate,
      storageLocation: values.storageLocation,
      status: values.status,
    });

    if (!wasSaved) {
      setSaveError(
        "Unable to save your changes. Please try again.",
      );

      return;
    }
  }

  return (
    <section
      className="edit-item-section"
      aria-labelledby="edit-item-heading"
    >
      <div className="add-item-section__header">
        <p className="inventory-summary__eyebrow">
          Edit inventory
        </p>

        <h2 id="edit-item-heading">
          Edit {item.name}
        </h2>
      </div>

      <form
        className="add-item-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="form-field">
          <label htmlFor="edit-item-name">
            Item name
          </label>

          <input
            id="edit-item-name"
            type="text"
            value={values.name}
            onChange={(event) =>
              setValues((currentValues) => ({
                ...currentValues,
                name: event.target.value,
              }))
            }
            aria-invalid={Boolean(errors.name)}
            aria-describedby={
              errors.name
                ? "edit-item-name-error"
                : undefined
            }
          />

          {errors.name && (
            <p
              id="edit-item-name-error"
              className="form-error"
              role="alert"
            >
              {errors.name}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="edit-item-quantity">
            Quantity
          </label>

          <input
            id="edit-item-quantity"
            type="number"
            min="1"
            value={values.quantity}
            onChange={(event) =>
              setValues((currentValues) => ({
                ...currentValues,
                quantity: Number(event.target.value),
              }))
            }
            aria-invalid={Boolean(errors.quantity)}
            aria-describedby={
              errors.quantity
                ? "edit-item-quantity-error"
                : undefined
            }
          />

          {errors.quantity && (
            <p
              id="edit-item-quantity-error"
              className="form-error"
              role="alert"
            >
              {errors.quantity}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="edit-item-unit">
            Unit
          </label>

          <select
            id="edit-item-unit"
            value={values.quantityUnit}
            onChange={(event) =>
              setValues((currentValues) => ({
                ...currentValues,
                quantityUnit:
                  event.target
                    .value as InventoryItem["quantityUnit"],
              }))
            }
          >
            <option value="item">Item</option>
            <option value="pack">Pack</option>
            <option value="g">Grams</option>
            <option value="kg">Kilograms</option>
            <option value="ml">Millilitres</option>
            <option value="l">Litres</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="edit-item-expiry-date">
            Expiry date
          </label>

          <input
            id="edit-item-expiry-date"
            type="date"
            value={values.expiryDate}
            onChange={(event) =>
              setValues((currentValues) => ({
                ...currentValues,
                expiryDate: event.target.value,
              }))
            }
            aria-invalid={Boolean(errors.expiryDate)}
            aria-describedby={
              errors.expiryDate
                ? "edit-item-expiry-date-error"
                : undefined
            }
          />

          {errors.expiryDate && (
            <p
              id="edit-item-expiry-date-error"
              className="form-error"
              role="alert"
            >
              {errors.expiryDate}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="edit-item-storage-location">
            Storage location
          </label>

          <select
            id="edit-item-storage-location"
            value={values.storageLocation}
            onChange={(event) =>
              setValues((currentValues) => ({
                ...currentValues,
                storageLocation:
                  event.target.value as StorageLocation,
              }))
            }
          >
            <option value="fridge">Fridge</option>
            <option value="freezer">Freezer</option>
            <option value="cupboard">Cupboard</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="edit-item-status">
            Status
          </label>

          <select
            id="edit-item-status"
            value={values.status}
            onChange={(event) =>
              setValues((currentValues) => ({
                ...currentValues,
                status:
                  event.target.value as InventoryStatus,
              }))
            }
          >
            <option value="active">Active</option>
            <option value="consumed">Consumed</option>
            <option value="wasted">Wasted</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {saveError && (
          <p className="form-error" role="alert">
            {saveError}
          </p>
        )}

        <button type="submit">
          Save changes
        </button>

        <button
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
      </form>
    </section>
  );
}