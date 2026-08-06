import "dotenv/config";
import express from "express";

const app = express();

const port = Number(process.env.PORT) || 3001;

app.use(express.json());

app.get("/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    message: "FreshCue API is running",
  });
});

app.listen(port, () => {
  console.log(`FreshCue API listening on port ${port}`);
});