export type StorageLocation = "fridge" | "freezer" | "pantry";

export type InventoryStatus =
  | "active"
  | "consumed"
  | "wasted"
  | "expired";

export interface InventoryItem {
  id: string;
  name: string;
  barcode?: string;
  quantity: number;
  expiryDate: string;
  storageLocation: StorageLocation;
  status: InventoryStatus;
  createdAt: string;
}