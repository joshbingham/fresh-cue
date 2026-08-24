import type { ProductLookupResult } from "../types/product.js";

interface OpenFoodFactsProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  categories?: string;
  quantity?: string;
  image_front_url?: string;
}

interface OpenFoodFactsResponse {
  product?: OpenFoodFactsProduct;
}

export class ProductLookupError extends Error {
  constructor(
    message: string,
    public code: "not_found" | "unavailable",
  ) {
    super(message);
  }
}

function getFirstValue(value?: string): string | null {
  if (!value) {
    return null;
  }

  const firstValue = value
    .split(",")
    .map((part) => part.trim())
    .find((part) => part.length > 0);

  return firstValue ?? null;
}

function mapOpenFoodFactsProduct(
  barcode: string,
  product: OpenFoodFactsProduct,
): ProductLookupResult {
  return {
    barcode,
    productName: product.product_name?.trim() || null,
    brand: getFirstValue(product.brands),
    category: getFirstValue(product.categories),
    quantity: product.quantity?.trim() || null,
    imageUrl: product.image_front_url?.trim() || null,
  };
}

export async function lookupProductByBarcode(
  barcode: string,
): Promise<ProductLookupResult> {
  const params = new URLSearchParams({
    fields: [
      "code",
      "product_name",
      "brands",
      "categories",
      "quantity",
      "image_front_url",
    ].join(","),
  });

  let response: Response;

  try {
    response = await fetch(
      `https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(barcode)}?${params}`,
      {
        headers: {
          "User-Agent": "FreshCue/1.0 (development)",
        },
      },
    );
  } catch {
    throw new ProductLookupError(
      "Product data provider is unavailable.",
      "unavailable",
    );
  }

  if (response.status === 404) {
    throw new ProductLookupError(
      "Product not found.",
      "not_found",
    );
  }

  if (!response.ok) {
    throw new ProductLookupError(
      `Product data provider request failed with status ${response.status}.`,
      "unavailable",
    );
  }

  let data: OpenFoodFactsResponse;

  try {
    data = (await response.json()) as OpenFoodFactsResponse;
  } catch {
    throw new ProductLookupError(
      "Product data provider returned an invalid response.",
      "unavailable",
    );
  }

  if (!data.product) {
    throw new ProductLookupError(
      "Product not found.",
      "not_found",
    );
  }

  return mapOpenFoodFactsProduct(barcode, data.product);
}