import express from "express";
import path from "path";
import dotenv from "dotenv";
import { publicKeyJson } from "./generateKeys.js";

dotenv.config({ quiet: true });

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

// Endpoint para devolver la clave pública
app.get("/pubKey", (_req, res) => {
  res.json(publicKeyJson);
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Externa server listening at http://localhost:${port}`);
});
