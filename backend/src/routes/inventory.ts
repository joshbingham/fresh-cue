import { Router } from "express";
import { pool } from "../db.js";

export const inventoryRouter = Router();

inventoryRouter.get("/", async (_request, response) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        quantity,
        quantity_unit,
        expiry_date,
        storage_location,
        status,
        created_at,
        updated_at
      FROM inventory_items
      ORDER BY expiry_date ASC;
    `);

    response.status(200).json(result.rows);
  } catch (error) {
    console.error("Failed to retrieve inventory:", error);

    response.status(500).json({
      message: "Unable to retrieve inventory.",
    });
  }
});