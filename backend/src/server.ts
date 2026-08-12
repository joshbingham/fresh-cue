import "dotenv/config";
import cors from "cors";
import express from "express";
import { testDatabaseConnection } from "./db.js";
import { inventoryRouter } from "./routes/inventory.js";
import { recipesRouter } from "./routes/recipes.js";

const app = express();

const port = Number(process.env.PORT) || 3001;

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json());

app.use("/inventory", inventoryRouter);

app.use("/recipes", recipesRouter);

app.get("/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    message: "FreshCue API is running",
  });
});

async function startServer(): Promise<void> {
  try {
    await testDatabaseConnection();

    app.listen(port, () => {
      console.log(`FreshCue API listening on port ${port}`);
    });
  } catch (error) {
    console.error(
      "Unable to connect to PostgreSQL:",
      error,
    );

    process.exit(1);
  }
}

void startServer();