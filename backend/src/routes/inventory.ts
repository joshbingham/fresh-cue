import { Router } from "express";
import { pool } from "../db.js";

interface InventoryItemBody {
  name?: unknown;
  quantity?: unknown;
  quantity_unit?: unknown;
  expiry_date?: unknown;
  storage_location?: unknown;
  status?: unknown;
}

const validQuantityUnits = [
  "item",
  "pack",
  "g",
  "kg",
  "ml",
  "l",
] as const;

const validStorageLocations = [
  "fridge",
  "freezer",
  "cupboard",
] as const;

const validStatuses = [
  "active",
  "consumed",
  "wasted",
  "expired",
] as const;

export const inventoryRouter = Router();

function validateInventoryItem(
  body: InventoryItemBody,
): string[] {
  const errors: string[] = [];

  if (
    typeof body.name !== "string" ||
    body.name.trim().length === 0
  ) {
    errors.push("Name is required.");
  }

  if (
    typeof body.quantity !== "number" ||
    !Number.isFinite(body.quantity) ||
    body.quantity < 1
  ) {
    errors.push("Quantity must be a number of at least 1.");
  }

  if (
    typeof body.quantity_unit !== "string" ||
    !validQuantityUnits.includes(
      body.quantity_unit as (typeof validQuantityUnits)[number],
    )
  ) {
    errors.push("Quantity unit is invalid.");
  }

  if (
    typeof body.expiry_date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(body.expiry_date) ||
    Number.isNaN(Date.parse(body.expiry_date))
    ) {
    errors.push("Expiry date must be a valid date in YYYY-MM-DD format.");
    }

  if (
    typeof body.storage_location !== "string" ||
    !validStorageLocations.includes(
      body.storage_location as (typeof validStorageLocations)[number],
    )
  ) {
    errors.push("Storage location is invalid.");
  }

  if (
    body.status !== undefined &&
    (
      typeof body.status !== "string" ||
      !validStatuses.includes(
        body.status as (typeof validStatuses)[number],
      )
    )
  ) {
    errors.push("Status is invalid.");
  }

  return errors;
}

inventoryRouter.post("/", async (request, response) => {
  const body = request.body as InventoryItemBody;
  const validationErrors = validateInventoryItem(body);

  if (validationErrors.length > 0) {
    response.status(400).json({
      errors: validationErrors,
    });

    return;
  }

  try {
    const result = await pool.query(
      `
        INSERT INTO inventory_items (
          id,
          name,
          quantity,
          quantity_unit,
          expiry_date,
          storage_location,
          status
        )
        VALUES (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          $4,
          $5,
          $6
        )
        RETURNING
          id,
          name,
          quantity,
          quantity_unit,
          expiry_date,
          storage_location,
          status,
          created_at,
          updated_at;
      `,
      [
        (body.name as string).trim(),
        body.quantity,
        body.quantity_unit,
        body.expiry_date,
        body.storage_location,
        body.status ?? "active",
      ],
    );

    response.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Failed to create inventory item:", error);

    response.status(500).json({
      message: "Unable to create inventory item.",
    });
  }
});

inventoryRouter.put("/:id", async (request, response) => {
  const body = request.body as InventoryItemBody;
  const validationErrors = validateInventoryItem(body);

  if (validationErrors.length > 0) {
    response.status(400).json({
      errors: validationErrors,
    });

    return;
  }

  try {
    const result = await pool.query(
      `
        UPDATE inventory_items
        SET
          name = $1,
          quantity = $2,
          quantity_unit = $3,
          expiry_date = $4,
          storage_location = $5,
          status = $6,
          updated_at = NOW()
        WHERE id = $7
        RETURNING
          id,
          name,
          quantity,
          quantity_unit,
          expiry_date,
          storage_location,
          status,
          created_at,
          updated_at;
      `,
      [
        (body.name as string).trim(),
        body.quantity,
        body.quantity_unit,
        body.expiry_date,
        body.storage_location,
        body.status ?? "active",
        request.params.id,
      ],
    );

    if (result.rowCount === 0) {
      response.status(404).json({
        message: "Inventory item not found.",
      });

      return;
    }

    response.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Failed to update inventory item:", error);

    response.status(500).json({
      message: "Unable to update inventory item.",
    });
  }
});

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