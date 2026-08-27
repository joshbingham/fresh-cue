import { useRef, useState, type FormEvent } from "react";
import type {
  InventoryItem,
  ProductLookupResult,
  StorageLocation,
} from "../types";

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

type ProductLookupStatus =
  | "idle"
  | "loading"
  | "success"
  | "not-found"
  | "error";

const initialValues: FormValues = {
  name: "",
  barcode: "",
  quantity: 1,
  quantityUnit: "item",
  expiryDate: "",
  storageLocation: "",
};

const barcodePattern = /^(?:\d{8}|\d{12,14})$/;

export default function AddItemForm({
  onAddItem,
}: AddItemFormProps) {
  const [values, setValues] =
    useState<FormValues>(initialValues);

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [productLookupStatus, setProductLookupStatus] =
    useState<ProductLookupStatus>("idle");

  const [lookedUpProduct, setLookedUpProduct] =
    useState<ProductLookupResult | null>(null);

  const [productLookupMessage, setProductLookupMessage] =
    useState<string | null>(null);

  const lookupAbortControllerRef =
    useRef<AbortController | null>(null);

  function handleBarcodeChange(barcode: string): void {
    setValues((currentValues) => ({
      ...currentValues,
      barcode,
    }));

    lookupAbortControllerRef.current?.abort();
    lookupAbortControllerRef.current = null;

    setErrors((currentErrors) => ({
      ...currentErrors,
      barcode: undefined,
    }));

    setLookedUpProduct(null);
    setProductLookupMessage(null);
    setProductLookupStatus("idle");
  }

  async function handleProductLookup(): Promise<void> {
    const trimmedBarcode = values.barcode.trim();

    setLookedUpProduct(null);
    setProductLookupMessage(null);

    if (!trimmedBarcode) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        barcode: "Enter a barcode to look up.",
      }));

      setProductLookupStatus("idle");
      return;
    }

    if (!barcodePattern.test(trimmedBarcode)) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        barcode: "Barcode must be 8, 12, 13 or 14 digits.",
      }));

      setProductLookupStatus("idle");
      return;
    }

    setErrors((currentErrors) => ({
      ...currentErrors,
      barcode: undefined,
    }));

    lookupAbortControllerRef.current?.abort();

    const controller = new AbortController();
    lookupAbortControllerRef.current = controller;

    setProductLookupStatus("loading");

    try {
      const response = await fetch(
        `http://localhost:3001/products/${encodeURIComponent(trimmedBarcode)}`,
        {
          signal: controller.signal,
        },
      );

      if (response.status === 404) {
        setProductLookupStatus("not-found");
        setProductLookupMessage(
          "No product was found for this barcode. You can still enter the item manually.",
        );

        return;
      }

      if (!response.ok) {
        setProductLookupStatus("error");
        setProductLookupMessage(
          "Unable to look up this product right now. You can still enter the item manually.",
        );

        return;
      }

      const product =
        (await response.json()) as ProductLookupResult;

      setLookedUpProduct(product);
      setProductLookupStatus("success");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      console.error("Failed to look up product:", error);

      setProductLookupStatus("error");
      setProductLookupMessage(
        "Unable to connect to the product lookup service. You can still enter the item manually.",
      );
    }
  }

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
      !barcodePattern.test(trimmedBarcode)
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

    lookupAbortControllerRef.current?.abort();
    lookupAbortControllerRef.current = null;

    setValues(initialValues);
    setErrors({});
    setLookedUpProduct(null);
    setProductLookupMessage(null);
    setProductLookupStatus("idle");
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
            handleBarcodeChange(event.target.value)
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

        <button
          type="button"
          onClick={handleProductLookup}
          disabled={productLookupStatus === "loading"}
        >
          {productLookupStatus === "loading"
            ? "Looking up..."
            : "Look up product"}
        </button>

        {productLookupMessage && (
          <p
            role={productLookupStatus === "error" ? "alert" : "status"}
            aria-live="polite"
          >
            {productLookupMessage}
          </p>
        )}

        {productLookupStatus === "success" && lookedUpProduct && (
          <div aria-live="polite">
            <p>
              <strong>Product found</strong>
            </p>

            <p>
              {lookedUpProduct.productName ?? "Unnamed product"}
            </p>

            {lookedUpProduct.brand && (
              <p>Brand: {lookedUpProduct.brand}</p>
            )}

            {lookedUpProduct.category && (
              <p>Category: {lookedUpProduct.category}</p>
            )}

            {lookedUpProduct.quantity && (
              <p>Quantity: {lookedUpProduct.quantity}</p>
            )}
          </div>
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