import { useEffect, useState } from "react";
import { getRecipes } from "../api/recipes";
import type { RecipeMatch } from "../types/recipe";
import {
    addShoppingListItem,
  getShoppingList,
  type ShoppingListItem,
} from "../api/shoppingList";

export function RecipeSearch() {
  const [recipes, setRecipes] = useState<RecipeMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [newShoppingItem, setNewShoppingItem] = useState("");
  

    async function generateShoppingList(missingIngredients: string[]) {
        const newIngredients = missingIngredients.filter(
            (ingredient) =>
            !shoppingList.some(
                (item) => item.name.toLowerCase() === ingredient.toLowerCase(),
            ),
        );

        try {
            const createdItems = await Promise.all(
            newIngredients.map((ingredient) =>
                addShoppingListItem(ingredient),
            ),
            );

            setShoppingList((currentList) => [
            ...currentList,
            ...createdItems,
            ]);

        } catch {
            console.error("Unable to add recipe ingredients to shopping list.");
        }
    }

    async function addShoppingItem() {
        const trimmedItem = newShoppingItem.trim();

        if (!trimmedItem) {
            return;
        }

        const alreadyExists = shoppingList.some(
            (item) => item.name.toLowerCase() === trimmedItem.toLowerCase()
        );

        if (alreadyExists) {
            return;
        }

        try {
            const createdItem = await addShoppingListItem(trimmedItem);

            setShoppingList((currentList) => [
            ...currentList,
            createdItem,
            ]);

            setNewShoppingItem("");
        } catch {
            console.error("Unable to add shopping list item.");
        }
    }

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

  useEffect(() => {
    async function loadShoppingList() {
        try {
        const data = await getShoppingList();
        setShoppingList(data);
        } catch {
        console.error("Unable to load shopping list.");
        }
    }

    void loadShoppingList();
    }, []);

function areRecipeIngredientsAdded(missingIngredients: string[]) {
  return missingIngredients.every((ingredient) =>
    shoppingList.some(
      (item) => item.name.toLowerCase() === ingredient.toLowerCase(),
    ),
  );
}

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

            {recipe.missingIngredients.length > 0 && (
                <button
                    type="button"
                    className={
                    areRecipeIngredientsAdded(recipe.missingIngredients)
                        ? "recipe-card__shopping-button recipe-card__shopping-button--added"
                        : "recipe-card__shopping-button"
                    }
                    onClick={() =>
                    generateShoppingList(recipe.missingIngredients)
                    }
                    disabled={areRecipeIngredientsAdded(recipe.missingIngredients)}
                >
                    {areRecipeIngredientsAdded(recipe.missingIngredients)
                    ? "Ingredients added"
                    : "Add missing ingredients to shopping list"}
                </button>
                )}
            </article>
        ))}
        </div>
        
            <div className="shopping-list">
                <div className="shopping-list__header">
                    <div>
                    <p className="inventory-summary__eyebrow">Plan ahead</p>
                    <h2>Shopping list</h2>
                    </div>

                    <p className="shopping-list__count">
                    {shoppingList.length} item{shoppingList.length === 1 ? "" : "s"}
                    </p>
                </div>

                <form
                    className="shopping-list__form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        addShoppingItem();
                    }}
                    >
                    <label htmlFor="shopping-item">Add item manually</label>

                    <input
                        id="shopping-item"
                        type="text"
                        value={newShoppingItem}
                        onChange={(event) => setNewShoppingItem(event.target.value)}
                    />

                    <button type="submit">Add item</button>
                    </form>

    

                {shoppingList.length > 0 ? (
                    <ul className="shopping-list__items">
                    {shoppingList.map((item) => (
                        <li key={item.id} className="shopping-list__item">
                            {item.name}
                        </li>
                    ))}
                    </ul>
                    ) : (
                    <p>Your shopping list is empty.</p>
                    )}
            </div>
            
    </section>
    );
}