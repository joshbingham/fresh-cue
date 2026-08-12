import { useEffect, useState } from "react";
import { getRecipes } from "../api/recipes";
import type { RecipeMatch } from "../types/recipe";

export function RecipeSearch() {
  const [recipes, setRecipes] = useState<RecipeMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecipes() {
      try {
        const data = await getRecipes();
        setRecipes(data);
      } catch {
        setError("Unable to load recipes.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadRecipes();
  }, []);

  if (isLoading) {
    return <p>Finding recipes...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  if (recipes.length === 0) {
    return (
        <section
        className="recipe-section"
        aria-labelledby="recipe-suggestions-heading"
        >
        <div className="recipe-section__header">
            <p className="inventory-summary__eyebrow">
            Meal ideas
            </p>

            <h2 id="recipe-suggestions-heading">
            Recipe suggestions
            </h2>
        </div>

        <div className="empty-state">
            <h3>No recipe suggestions yet</h3>
            <p>
            Add more ingredients to your inventory to discover possible meals.
            </p>
        </div>
        </section>
    );
    }

  return (
    <section
        className="recipe-section"
        aria-labelledby="recipe-suggestions-heading"
    >
        <div className="recipe-section__header">
        <p className="inventory-summary__eyebrow">
            Meal ideas
        </p>

        <h2 id="recipe-suggestions-heading">
            Recipe suggestions
        </h2>

        <p>
            Ideas based on what you already have, with anything missing
            called out clearly.
        </p>
        </div>

        <div className="recipe-list">
        {recipes.map((recipe) => (
            <article
                key={recipe.id}
                className={
                    recipe.missingIngredients.length === 0
                    ? "recipe-card recipe-card--complete"
                    : "recipe-card"
                }
            >
            <h3>{recipe.title}</h3>

            {recipe.missingIngredients.length === 0 && (
                <p className="recipe-card__match">
                    You can make this now
                </p>
            )}

            <p>
                <strong>Available:</strong>{" "}
                {recipe.availableIngredients.length > 0
                ? recipe.availableIngredients.join(", ")
                : "None"}
            </p>

            <p>
                <strong>Missing:</strong>{" "}
                {recipe.missingIngredients.length > 0
                ? recipe.missingIngredients.join(", ")
                : "Nothing — you have everything!"}
            </p>
            </article>
        ))}
        </div>
    </section>
    );
}