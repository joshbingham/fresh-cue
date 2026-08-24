import { useState, type FormEvent } from "react";
import type { InventoryItem, StorageLocation } from "../types";

interface AddItemFormProps {
  onAddItem: (item: {
    name: string;
    barcode?: string;
    quantity: number;
    quantityUnit: InventoryItem["quantityUnit"];
    expiryDate: string;
    storageLocation: StorageLocation;
  }) => Promise<boolean>;
}

interface FormValues {
  name: string;
  barcode: string;
  quantity: number;
  quantityUnit: string;
  expiryDate: string;
  storageLocation: StorageLocation | "";
}

interface FormErrors {
  name?: string;
  barcode?: string;
  quantity?: string;
  expiryDate?: string;
  storageLocation?: string;
}

const initialValues: FormValues = {
  name: "",
  barcode: "",
  quantity: 1,
  quantityUnit: "item",
  expiryDate: "",
  storageLocation: "",
};

export default function AddItemForm({
  onAddItem,
}: AddItemFormProps) {
  const [values, setValues] =
    useState<FormValues>(initialValues);

  const [errors, setErrors] =
    useState<FormErrors>({});

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

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

    const wasAdded = await onAddItem({
      name: values.name.trim(),
      barcode: values.barcode.trim() || undefined,
      quantity: values.quantity,
      quantityUnit:
        values.quantityUnit as InventoryItem["quantityUnit"],
      expiryDate: values.expiryDate,
      storageLocation:
        values.storageLocation as StorageLocation,
    });

    if (!wasAdded) {
      return;
    }

    setValues(initialValues);
    setErrors({});
  }

  return (
    <form
      className="add-item-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="form-field">
        <label htmlFor="item-name">Item name</label>

        <input
          id="item-name"
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
              ? "item-name-error"
              : undefined
          }
        />

        {errors.name && (
          <p
            id="item-name-error"
            className="form-error"
            role="alert"
          >
            {errors.name}
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="item-barcode">
          Barcode
        </label>

        <input
          id="item-barcode"
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
            errors.barcode ? "item-barcode-error" : undefined
          }
        />

        {errors.barcode && (
          <p
            id="item-barcode-error"
            className="form-error"
            role="alert"
          >
            {errors.barcode}
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="item-quantity">
          Quantity
        </label>

        <input
          id="item-quantity"
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
              ? "item-quantity-error"
              : undefined
          }
        />

        {errors.quantity && (
          <p
            id="item-quantity-error"
            className="form-error"
            role="alert"
          >
            {errors.quantity}
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="item-unit">Unit</label>

        <select
          id="item-unit"
          value={values.quantityUnit}
          onChange={(event) =>
            setValues((currentValues) => ({
              ...currentValues,
              quantityUnit: event.target.value,
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
        <label htmlFor="item-expiry-date">
          Expiry date
        </label>

        <input
          id="item-expiry-date"
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
              ? "item-expiry-date-error"
              : undefined
          }
        />

        {errors.expiryDate && (
          <p
            id="item-expiry-date-error"
            className="form-error"
            role="alert"
          >
            {errors.expiryDate}
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="item-storage-location">
          Storage location
        </label>

        <select
          id="item-storage-location"
          value={values.storageLocation}
          onChange={(event) =>
            setValues((currentValues) => ({
              ...currentValues,
              storageLocation:
                event.target.value as StorageLocation | "",
            }))
          }
          aria-invalid={Boolean(errors.storageLocation)}
          aria-describedby={
            errors.storageLocation
              ? "item-storage-location-error"
              : undefined
          }
        >
          <option value="">
            Select a location
          </option>
          <option value="fridge">Fridge</option>
          <option value="freezer">Freezer</option>
          <option value="cupboard">Cupboard</option>
        </select>

        {errors.storageLocation && (
          <p
            id="item-storage-location-error"
            className="form-error"
            role="alert"
          >
            {errors.storageLocation}
          </p>
        )}
      </div>

      <button type="submit">
        Add item
      </button>
    </form>
  );
}