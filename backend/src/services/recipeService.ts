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

interface TheMealDbFilterResult {
  idMeal: string;
  strMeal: string;
}

interface TheMealDbFilterResponse {
  meals: TheMealDbFilterResult[] | null;
}

interface TheMealDbMeal {
  idMeal: string;
  strMeal: string;
  [key: `strIngredient${number}`]: string | null;
}

interface TheMealDbLookupResponse {
  meals: TheMealDbMeal[] | null;
}

class RecipeProviderError extends Error {
  constructor(
    message: string,
    public provider: "spoonacular" | "themealdb",
    public code: "quota" | "unavailable",
  ) {
    super(message);
  }
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

async function fetchSpoonacularRecipes(
  inventoryNames: string[],
): Promise<SpoonacularRecipe[]> {
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

  if (response.status === 402) {
    throw new RecipeProviderError(
      "Spoonacular API quota has been exhausted.",
      "spoonacular",
      "quota",
    );
  }

  if (!response.ok) {
    throw new RecipeProviderError(
      `Spoonacular request failed with status ${response.status}.`,
      "spoonacular",
      "unavailable",
    );
  }

  return (await response.json()) as SpoonacularRecipe[];
}

async function fetchTheMealDbMealsByIngredient(
  ingredient: string,
): Promise<TheMealDbFilterResult[]> {
  const params = new URLSearchParams({
    i: ingredient,
  });

  const response = await fetch(
    `https://www.themealdb.com/api/json/v1/1/filter.php?${params}`,
  );

  if (!response.ok) {
    throw new RecipeProviderError(
      `TheMealDB request failed with status ${response.status}.`,
      "themealdb",
      "unavailable",
    );
  }

  const data = (await response.json()) as TheMealDbFilterResponse;

  return data.meals ?? [];
}

async function fetchTheMealDbMealById(
  id: string,
): Promise<TheMealDbMeal | null> {
  const params = new URLSearchParams({
    i: id,
  });

  const response = await fetch(
    `https://www.themealdb.com/api/json/v1/1/lookup.php?${params}`,
  );

  if (!response.ok) {
    throw new RecipeProviderError(
      `TheMealDB lookup failed with status ${response.status}.`,
      "themealdb",
      "unavailable",
    );
  }

  const data = (await response.json()) as TheMealDbLookupResponse;

  return data.meals?.[0] ?? null;
}

function getTheMealDbIngredients(meal: TheMealDbMeal): string[] {
  const ingredients: string[] = [];

  for (let index = 1; index <= 20; index += 1) {
    const ingredient = meal[`strIngredient${index}`];

    if (typeof ingredient === "string" && ingredient.trim().length > 0) {
      ingredients.push(ingredient.trim());
    }
  }

  return ingredients;
}

function mapTheMealDbMealToRecipeMatch(
  meal: TheMealDbMeal,
  inventoryNames: string[],
): RecipeMatch {
  const ingredients = getTheMealDbIngredients(meal);

  const availableIngredients = ingredients.filter((ingredient) =>
    inventoryHasIngredient(ingredient, inventoryNames),
  );

  const missingIngredients = ingredients.filter(
    (ingredient) =>
      !inventoryHasIngredient(ingredient, inventoryNames),
  );

  return {
    id: meal.idMeal,
    title: meal.strMeal,
    ingredients: ingredients.map((ingredient) => ({
      name: ingredient,
    })),
    availableIngredients,
    missingIngredients,
  };
}

async function searchTheMealDbRecipes(
  inventoryNames: string[],
): Promise<RecipeMatch[]> {
  const filterResults = await Promise.all(
    inventoryNames.map((ingredient) =>
      fetchTheMealDbMealsByIngredient(ingredient),
    ),
  );

  const uniqueMeals = new Map<string, TheMealDbFilterResult>();

  filterResults.flat().forEach((meal) => {
    uniqueMeals.set(meal.idMeal, meal);
  });

  const candidateMeals = Array.from(uniqueMeals.values()).slice(0, 10);

  const fullMeals = await Promise.all(
    candidateMeals.map((meal) =>
      fetchTheMealDbMealById(meal.idMeal),
    ),
  );

  return fullMeals
    .filter((meal): meal is TheMealDbMeal => meal !== null)
    .map((meal) =>
      mapTheMealDbMealToRecipeMatch(meal, inventoryNames),
    )
    .sort(
      (a, b) =>
        a.missingIngredients.length -
        b.missingIngredients.length,
    );
}

export async function searchRecipes(
  inventoryNames: string[],
): Promise<RecipeMatch[]> {
  try {

    const data = await fetchSpoonacularRecipes(inventoryNames);

    console.log("Recipe provider: Spoonacular");

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
  } catch (error) {
    if (
      error instanceof RecipeProviderError &&
      error.provider === "spoonacular"
    ) {
      console.warn(
        `Spoonacular unavailable (${error.code}). Falling back to TheMealDB.`,
      );

      try {
        const recipes = await searchTheMealDbRecipes(inventoryNames);

        console.log("Recipe provider: TheMealDB");

        return recipes;
      } catch (fallbackError) {
        console.error(
          "Both recipe providers failed:",
          fallbackError,
        );

        throw new Error(
          "Unable to retrieve recipes from any available provider.",
        );
      }
    }

    throw error;
  }
}