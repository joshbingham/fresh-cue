export interface RecipeIngredient {
  name: string;
  quantity?: number;
  unit?: string;
}

export interface RecipeMatch {
  id: string;
  title: string;
  ingredients: RecipeIngredient[];
  availableIngredients: string[];
  missingIngredients: string[];
}