import express from "express";
import path from "path";
import dotenv from "dotenv";
import { publicKeyJson, privateKey } from "./generateKeys.js";

dotenv.config({ quiet: true });

const app = express();
const port = Number(process.env.PORT) || 5000;
const AGREGADOR_URL = process.env.AGREGADOR_URL || "http://localhost:3001";

app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

// El Agregador descarga esta pública para cifrar los consumos.
app.get("/pubKey", (_req, res) => {
  res.json(publicKeyJson);
});

// Get stats: pide los consumos cifrados al Agregador, los descifra con la
// clave privada y calcula las estadísticas para el frontend.
app.get("/stats", async (_req, res) => {
  try {
    const r = await fetch(`${AGREGADOR_URL}/stats`);
    if (!r.ok) throw new Error(`agregador respondió ${r.status}`);

    const { consumos } = (await r.json()) as {
      count: number;
      consumos: string[];
    };

    const values = (consumos ?? []).map((c) => privateKey.decrypt(BigInt(c)));
    if (values.length === 0) {
      res.json({ count: 0, mean: "0", min: "0", max: "0" });
      return;
    }

    const sum = values.reduce((a, b) => a + b, 0n);
    const min = values.reduce((a, b) => (a < b ? a : b));
    const max = values.reduce((a, b) => (a > b ? a : b));

    res.json({
      count: values.length,
      mean: (sum / BigInt(values.length)).toString(),
      min: min.toString(),
      max: max.toString(),
    });
  } catch (error) {
    res.status(502).json({ error: "stats_failed", details: String(error) });
  }
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Externa server listening at http://localhost:${port}`);
});