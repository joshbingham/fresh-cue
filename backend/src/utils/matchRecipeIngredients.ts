import type {
  Recipe,
  RecipeMatch,
} from "../types/recipe.js";

function normaliseIngredient(value: string): string {
  return value.trim().toLowerCase();
}

export function matchRecipeIngredients(
  recipe: Recipe,
  inventoryNames: string[],
): RecipeMatch {
  const normalisedInventory = new Set(
    inventoryNames.map(normaliseIngredient),
  );

  const availableIngredients: string[] = [];
  const missingIngredients: string[] = [];

  for (const ingredient of recipe.ingredients) {
    const ingredientName = normaliseIngredient(ingredient.name);

    if (normalisedInventory.has(ingredientName)) {
      availableIngredients.push(ingredient.name);
    } else {
      missingIngredients.push(ingredient.name);
    }
  }

  return {
    ...recipe,
    availableIngredients,
    missingIngredients,
  };
}