import type { RecipeMatch } from "../types/recipe";

const API_BASE_URL = "http://localhost:3001";

export async function getRecipes(): Promise<RecipeMatch[]> {
  const response = await fetch(`${API_BASE_URL}/recipes`);

  if (!response.ok) {
    throw new Error("Failed to load recipes.");
  }

  return response.json() as Promise<RecipeMatch[]>;
}