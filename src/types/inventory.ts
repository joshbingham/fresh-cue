export type StorageLocation = "fridge" | "freezer" | "cupboard";

export type InventoryStatus =
  | "active"
  | "consumed"
  | "wasted"
  | "expired";

export type QuantityUnit =
  | "item"
  | "pack"
  | "g"
  | "kg"
  | "ml"
  | "l";

export interface InventoryItem {
  id: string;
  name: string;
  barcode?: string;
  quantity: number;
  quantityUnit: QuantityUnit;
  expiryDate: string;
  storageLocation: StorageLocation;
  status: InventoryStatus;
  createdAt: string;
  updatedAt: string;
}