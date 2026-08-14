import { Router } from "express";
import { pool } from "../db.js";

export const shoppingListRouter = Router();

shoppingListRouter.get("/", async (_request, response) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        created_at
      FROM shopping_list_items
      ORDER BY created_at ASC;
    `);

    response.status(200).json(result.rows);
  } catch (error) {
    console.error("Failed to retrieve shopping list:", error);

    response.status(500).json({
      message: "Unable to retrieve shopping list.",
    });
  }
});

shoppingListRouter.post("/", async (request, response) => {
  const name = request.body?.name;

  if (typeof name !== "string" || name.trim().length === 0) {
    response.status(400).json({
      message: "Name is required.",
    });

    return;
  }

  try {
    const result = await pool.query(
      `
        INSERT INTO shopping_list_items (
          id,
          name
        )
        VALUES (
          gen_random_uuid(),
          $1
        )
        RETURNING
          id,
          name,
          created_at;
      `,
      [name.trim()],
    );

    response.status(201).json(result.rows[0]);
  } catch (error) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "23505"
        ) {
            response.status(409).json({
            message: "Item is already on the shopping list.",
            });

            return;
        }

        console.error("Failed to create shopping list item:", error);

        response.status(500).json({
            message: "Unable to create shopping list item.",
        });
        }
});