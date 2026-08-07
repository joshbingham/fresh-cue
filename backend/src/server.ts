import "dotenv/config";
import express from "express";
import { testDatabaseConnection } from "./db.js";
import { inventoryRouter } from "./routes/inventory.js";

const app = express();

const port = Number(process.env.PORT) || 3001;

app.use(express.json());

app.use("/inventory", inventoryRouter);

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