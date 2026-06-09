import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  handleAnalyseMealRequest,
  RequestValidationError,
} from './lib/analyseMealHandler.js';
import {
  FoodSearchValidationError,
  handleFoodBarcodeRequest,
  handleFoodSearchRequest,
} from './lib/foodSearchHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(process.cwd(), 'dist');
const isProduction = process.env.NODE_ENV === 'production';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

const defaultOrigins = isProduction
  ? []
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

const corsOrigins =
  process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean) ??
  defaultOrigins;

if (corsOrigins.length > 0) {
  app.use(
    cors({
      origin: corsOrigins,
    })
  );
}

app.use(express.json({ limit: '6mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
    mode: isProduction ? 'production' : 'development',
  });
});

app.post('/api/analyse-meal', async (req, res) => {
  try {
    const result = await handleAnalyseMealRequest(req.body);
    res.json(result);
  } catch (error) {
    if (error instanceof RequestValidationError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Meal analysis failed.' });
  }
});

app.get('/api/food/search', async (req, res) => {
  try {
    const result = await handleFoodSearchRequest(req.query as { q?: string; limit?: string });
    res.json(result);
  } catch (error) {
    if (error instanceof FoodSearchValidationError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Food search failed.' });
  }
});

app.get('/api/food/barcode/:code', async (req, res) => {
  try {
    const result = await handleFoodBarcodeRequest(req.params.code);
    res.json(result);
  } catch (error) {
    if (error instanceof FoodSearchValidationError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Barcode lookup failed.' });
  }
});

if (isProduction) {
  app.use(express.static(distDir));

  // Express 5 does not accept app.get('*') — use middleware for SPA fallback.
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      next();
      return;
    }
    res.sendFile(path.join(distDir, 'index.html'), (err) => {
      if (err) next(err);
    });
  });
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT} (${isProduction ? 'production' : 'development'})`);
  if (isProduction) {
    console.log(`Serving app from ${distDir}`);
  }
  console.log(
    `OpenAI: ${process.env.OPENAI_API_KEY?.trim() ? 'configured' : 'not configured (mock responses)'}`
  );
});
