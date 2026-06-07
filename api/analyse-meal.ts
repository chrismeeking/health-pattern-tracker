import {
  handleAnalyseMealRequest,
  RequestValidationError,
} from '../server/lib/analyseMealHandler.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '6mb',
    },
  },
};

export default async function handler(
  req: { method?: string; body?: unknown },
  res: {
    status: (code: number) => {
      json: (body: unknown) => void;
      end: () => void;
    };
    setHeader: (name: string, value: string) => void;
  }
) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await handleAnalyseMealRequest(req.body);
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Meal analysis failed.' });
  }
}
