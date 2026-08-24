import { Router } from "express";
import {
  lookupProductByBarcode,
  ProductLookupError,
} from "../services/productService.js";

export const productsRouter = Router();

productsRouter.get("/:barcode", async (request, response) => {
  const barcode = request.params.barcode.trim();

  if (!/^(?:\d{8}|\d{12,14})$/.test(barcode)) {
    response.status(400).json({
      message: "Barcode must be 8, 12, 13 or 14 digits.",
    });

    return;
  }

  try {
    const product = await lookupProductByBarcode(barcode);

    response.status(200).json(product);
  } catch (error) {
    if (error instanceof ProductLookupError) {
      if (error.code === "not_found") {
        response.status(404).json({
          message: "Product not found.",
        });

        return;
      }

      response.status(502).json({
        message: "Product lookup service is unavailable.",
      });

      return;
    }

    console.error("Unexpected product lookup error:", error);

    response.status(500).json({
      message: "Unable to look up product.",
    });
  }
});