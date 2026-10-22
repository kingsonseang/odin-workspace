import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createApp } from "./app";

dotenv.config({
  path: fileURLToPath(new URL("../../../.env", import.meta.url))
});

const port = Number(process.env.API_PORT ?? "4000");
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("API_PORT must be a valid TCP port.");
}

const app = createApp();
app.listen(port, () => {
  console.log(`Forgeboard API listening on http://localhost:${port}`);
});
