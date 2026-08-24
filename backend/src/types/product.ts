export interface ProductLookupResult {
  barcode: string;
  productName: string | null;
  brand: string | null;
  category: string | null;
  quantity: string | null;
  imageUrl: string | null;
}