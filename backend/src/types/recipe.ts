export interface RecipeIngredient {
  name: string;
  quantity?: number;
  unit?: string;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: RecipeIngredient[];
}

export interface RecipeMatch extends Recipe {
  availableIngredients: string[];
  missingIngredients: string[];
}