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
    brand?: string;
    category: string;
    quantity: number;
    quantityUnit: InventoryItem["quantityUnit"];
    expiryDate: string;
    storageLocation: StorageLocation;
  }) => Promise<boolean>;
}

interface FormValues {
  name: string;
  barcode: string;
  brand: string;
  category: string;
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
  brand: "",
  category: "other",
  quantity: 1,
  quantityUnit: "item",
  expiryDate: "",
  storageLocation: "",
};

const barcodePattern = /^(?:\d{8}|\d{12,14})$/;

function suggestFreshCueCategory(
  product: ProductLookupResult,
): string | null {
  const searchableText = [
    product.productName,
    product.category,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    /\b(milk|yoghurt|yogurt|cheese|cream|butter|dairy)\b/.test(
      searchableText,
    )
  ) {
    return "dairy";
  }

  if (
    /\b(apple|banana|orange|berry|berries|grape|pear|fruit)\b/.test(
      searchableText,
    )
  ) {
    return "fruit";
  }

  if (
    /\b(vegetable|vegetables|carrot|broccoli|pepper|onion|tomato)\b/.test(
      searchableText,
    )
  ) {
    return "vegetables";
  }

  if (
    /\b(chicken|turkey|beef|pork|lamb|meat)\b/.test(
      searchableText,
    )
  ) {
    return "meat";
  }

  if (
    /\b(fish|salmon|tuna|cod|seafood)\b/.test(
      searchableText,
    )
  ) {
    return "fish";
  }

  if (
    /\b(bread|roll|bagel|bakery)\b/.test(
      searchableText,
    )
  ) {
    return "bakery";
  }

  if (
    /\b(spread|confectionery|confectionary|pasta|rice|cereal|flour|sauce|beans|tin|canned)\b/.test(
      searchableText,
    )
  ) {
    return "pantry";
  }

  return null;
}

function parsePackageQuantity(
  quantity: string | null,
): {
  quantity: number;
  quantityUnit: InventoryItem["quantityUnit"];
} | null {
  if (!quantity) {
    return null;
  }

  const match = quantity
    .trim()
    .toLowerCase()
    .match(/^(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l)$/);

  if (!match) {
    return null;
  }

  const numericQuantity = Number(
    match[1].replace(",", "."),
  );

  const unit =
    match[2] as InventoryItem["quantityUnit"];

  if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
    return null;
  }

  if (unit === "kg" && numericQuantity < 1) {
    return {
      quantity: numericQuantity * 1000,
      quantityUnit: "g",
    };
  }

  if (unit === "l" && numericQuantity < 1) {
    return {
      quantity: numericQuantity * 1000,
      quantityUnit: "ml",
    };
  }

  if (numericQuantity < 1) {
    return null;
  }

  return {
    quantity: numericQuantity,
    quantityUnit: unit,
  };
}

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

  const prefillTouchedFieldsRef = useRef({
    name: false,
    brand: false,
    category: false,
    quantity: false,
    quantityUnit: false,
  });

  function handleBarcodeChange(barcode: string): void {
    setValues((currentValues) => ({
      ...currentValues,
      barcode,

      name: prefillTouchedFieldsRef.current.name
        ? currentValues.name
        : "",

      brand: prefillTouchedFieldsRef.current.brand
        ? currentValues.brand
        : "",

      category: prefillTouchedFieldsRef.current.category
        ? currentValues.category
        : "other",

      quantity:
        prefillTouchedFieldsRef.current.quantity ||
        prefillTouchedFieldsRef.current.quantityUnit
          ? currentValues.quantity
          : 1,

      quantityUnit:
        prefillTouchedFieldsRef.current.quantity ||
        prefillTouchedFieldsRef.current.quantityUnit
          ? currentValues.quantityUnit
          : "item",
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

      const productName = product.productName?.trim() ?? "";
      const productBrand = product.brand?.trim() ?? "";

      const suggestedCategory =
        suggestFreshCueCategory(product);

      const parsedPackageQuantity =
        parsePackageQuantity(product.quantity);

      setLookedUpProduct(product);

      setValues((currentValues) => ({
        ...currentValues,
        name: prefillTouchedFieldsRef.current.name
          ? currentValues.name
          : productName || currentValues.name,
        brand: prefillTouchedFieldsRef.current.brand
          ? currentValues.brand
          : productBrand || currentValues.brand,
        category: prefillTouchedFieldsRef.current.category
          ? currentValues.category
          : suggestedCategory ?? currentValues.category,
        quantity:
          parsedPackageQuantity &&
          !prefillTouchedFieldsRef.current.quantity &&
          !prefillTouchedFieldsRef.current.quantityUnit
            ? parsedPackageQuantity.quantity
            : currentValues.quantity,
        quantityUnit:
          parsedPackageQuantity &&
          !prefillTouchedFieldsRef.current.quantity &&
          !prefillTouchedFieldsRef.current.quantityUnit
            ? parsedPackageQuantity.quantityUnit
            : currentValues.quantityUnit,
      }));

      if (productName) {
        setErrors((currentErrors) => ({
          ...currentErrors,
          name: undefined,
        }));
      }

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
      brand: values.brand.trim() || undefined,
      category: values.category.trim() || "other",
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

    prefillTouchedFieldsRef.current = {
      name: false,
      brand: false,
      category: false,
      quantity: false,
      quantityUnit: false,
    };
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
          onChange={(event) => {
            prefillTouchedFieldsRef.current.name = true;

            setValues((currentValues) => ({
              ...currentValues,
              name: event.target.value,
            }));
          }}
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
        <label htmlFor="item-brand">Brand</label>

        <input
          id="item-brand"
          type="text"
          value={values.brand}
          onChange={(event) => {
            prefillTouchedFieldsRef.current.brand = true;

            setValues((currentValues) => ({
              ...currentValues,
              brand: event.target.value,
            }));
          }}
          placeholder="Optional"
        />
      </div>

      <div className="form-field">
        <label htmlFor="item-category">Category</label>

        <input
          id="item-category"
          type="text"
          value={values.category}
          onChange={(event) => {
            prefillTouchedFieldsRef.current.category = true;

            setValues((currentValues) => ({
              ...currentValues,
              category: event.target.value,
            }));
          }}
        />
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
          onChange={(event) => {
            prefillTouchedFieldsRef.current.quantity = true;

            setValues((currentValues) => ({
              ...currentValues,
              quantity: Number(event.target.value),
            }));
          }}
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
          onChange={(event) => {
            prefillTouchedFieldsRef.current.quantityUnit = true;

            setValues((currentValues) => ({
              ...currentValues,
              quantityUnit: event.target.value,
            }));
          }}
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