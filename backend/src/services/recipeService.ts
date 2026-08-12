import type {
  Recipe,
  RecipeMatch,
} from "../types/recipe.js";
import { matchRecipeIngredients } from "../utils/matchRecipeIngredients.js";

const recipes: Recipe[] = [
  {
    id: "scrambled-eggs",
    title: "Scrambled Eggs",
    ingredients: [
      { name: "eggs" },
      { name: "milk" },
      { name: "butter" },
    ],
  },
  {
    id: "banana-yoghurt-bowl",
    title: "Banana Yoghurt Bowl",
    ingredients: [
      { name: "bananas" },
      { name: "greek yoghurt" },
    ],
  },
  {
    id: "turkey-sandwich",
    title: "Turkey Sandwich",
    ingredients: [
      { name: "turkey" },
      { name: "bread" },
    ],
  },
];

export function searchRecipes(
  inventoryNames: string[],
): RecipeMatch[] {
  return recipes
    .map((recipe) =>
      matchRecipeIngredients(recipe, inventoryNames),
    )
    .sort(
      (a, b) =>
        a.missingIngredients.length -
        b.missingIngredients.length,
    );
}