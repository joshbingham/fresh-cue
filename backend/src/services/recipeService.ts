import type { RecipeMatch } from "../types/recipe.js";

interface SpoonacularIngredient {
  name: string;
}

interface SpoonacularRecipe {
  id: number;
  title: string;
  usedIngredients: SpoonacularIngredient[];
  missedIngredients: SpoonacularIngredient[];
}

function normaliseIngredient(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\byoghurt\b/g, "yogurt");
}

function inventoryHasIngredient(
  ingredientName: string,
  inventoryNames: string[],
): boolean {
  const normalisedIngredient = normaliseIngredient(ingredientName);

  return inventoryNames.some(
    (inventoryName) =>
      normaliseIngredient(inventoryName) === normalisedIngredient,
  );
}

export async function searchRecipes(
  inventoryNames: string[],
): Promise<RecipeMatch[]> {
  const apiKey = process.env.SPOONACULAR_API_KEY;

  if (!apiKey) {
    throw new Error("Spoonacular API key is not configured.");
  }

  const params = new URLSearchParams({
    apiKey,
    ingredients: inventoryNames.join(","),
    number: "10",
    ranking: "2",
    ignorePantry: "true",
  });

  const response = await fetch(
    `https://api.spoonacular.com/recipes/findByIngredients?${params}`,
  );

  if (!response.ok) {
    throw new Error(
      `Spoonacular request failed with status ${response.status}.`,
    );
  }

  const data = (await response.json()) as SpoonacularRecipe[];

  return data
    .map((recipe) => ({
      id: String(recipe.id),
      title: recipe.title,
      ingredients: [
        ...recipe.usedIngredients.map((ingredient) => ({
          name: ingredient.name,
        })),
        ...recipe.missedIngredients.map((ingredient) => ({
          name: ingredient.name,
        })),
      ],
      availableIngredients: recipe.usedIngredients
        .filter((ingredient) =>
          inventoryHasIngredient(ingredient.name, inventoryNames),
        )
        .map((ingredient) => ingredient.name),

      missingIngredients: [
        ...recipe.missedIngredients.map(
          (ingredient) => ingredient.name,
        ),
        ...recipe.usedIngredients
          .filter(
            (ingredient) =>
              !inventoryHasIngredient(
                ingredient.name,
                inventoryNames,
              ),
          )
          .map((ingredient) => ingredient.name),
      ],
    }))
    .sort(
      (a, b) =>
        a.missingIngredients.length -
        b.missingIngredients.length,
    );
}