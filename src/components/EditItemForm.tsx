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
  barcode: string;
  brand: string;
  category: string;
  quantity: number;
  quantityUnit: InventoryItem["quantityUnit"];
  expiryDate: string;
  storageLocation: StorageLocation;
  status: InventoryStatus;
}

interface FormErrors {
  name?: string;
  barcode?: string;
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
    barcode: item.barcode ?? "",
    brand: item.brand ?? "",
    category: item.category ?? "other",
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

    const trimmedBarcode = values.barcode.trim();

    if (
      trimmedBarcode.length > 0 &&
      !/^(?:\d{8}|\d{12,14})$/.test(trimmedBarcode)
    ) {
      nextErrors.barcode =
        "Barcode must be 8, 12, 13 or 14 digits.";
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
      barcode: values.barcode.trim() || undefined,
      brand: values.brand.trim() || undefined,
      category: values.category.trim() || "other",
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
          <label htmlFor="edit-item-brand">
            Brand
          </label>

          <input
            id="edit-item-brand"
            type="text"
            value={values.brand}
            onChange={(event) =>
              setValues((currentValues) => ({
                ...currentValues,
                brand: event.target.value,
              }))
            }
            placeholder="Optional"
          />
        </div>

        <div className="form-field">
          <label htmlFor="edit-item-category">
            Category
          </label>

          <input
            id="edit-item-category"
            type="text"
            value={values.category}
            onChange={(event) =>
              setValues((currentValues) => ({
                ...currentValues,
                category: event.target.value,
              }))
            }
          />
        </div>

        <div className="form-field">
          <label htmlFor="edit-item-barcode">
            Barcode
          </label>

          <input
            id="edit-item-barcode"
            type="text"
            inputMode="numeric"
            value={values.barcode}
            onChange={(event) =>
              setValues((currentValues) => ({
                ...currentValues,
                barcode: event.target.value,
              }))
            }
            placeholder="Optional"
            aria-invalid={Boolean(errors.barcode)}
            aria-describedby={
              errors.barcode ? "edit-item-barcode-error" : undefined
            }
          />
          {errors.barcode && (
            <p
              id="edit-item-barcode-error"
              className="form-error"
              role="alert"
            >
              {errors.barcode}
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