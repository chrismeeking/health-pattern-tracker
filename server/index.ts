import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import {
  handleAnalyseMealRequest,
  RequestValidationError,
} from './lib/analyseMealHandler.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173', 'http://127.0.0.1:5173'],
  })
);

app.use(express.json({ limit: '6mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
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

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
  console.log(
    `OpenAI: ${process.env.OPENAI_API_KEY?.trim() ? 'configured' : 'not configured (mock responses)'}`
  );
});
