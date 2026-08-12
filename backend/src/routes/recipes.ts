import { Router } from "express";
import { pool } from "../db.js";
import { searchRecipes } from "../services/recipeService.js";

export const recipesRouter = Router();

recipesRouter.get("/", async (_request, response) => {
  try {
    const inventoryResult = await pool.query(`
      SELECT name
      FROM inventory_items
      WHERE status = 'active';
    `);

    const inventoryNames = inventoryResult.rows.map(
      (item: { name: string }) => item.name,
    );

    const recipes = searchRecipes(inventoryNames);

    response.status(200).json(recipes);
  } catch (error) {
    console.error("Failed to search recipes:", error);

    response.status(500).json({
      message: "Unable to search recipes.",
    });
  }
});