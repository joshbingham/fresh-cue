export interface ShoppingListItem {
  id: string;
  name: string;
  created_at: string;
}

const API_URL = "http://localhost:3001";

export async function getShoppingList(): Promise<ShoppingListItem[]> {
  const response = await fetch(`${API_URL}/shopping-list`);

  if (!response.ok) {
    throw new Error("Failed to retrieve shopping list.");
  }

  return response.json() as Promise<ShoppingListItem[]>;
}

export async function addShoppingListItem(
  name: string,
): Promise<ShoppingListItem> {
  const response = await fetch(`${API_URL}/shopping-list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error("Failed to add shopping list item.");
  }

  return response.json() as Promise<ShoppingListItem>;
}