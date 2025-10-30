import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { apiKeyAuth } from './middleware/auth';
import aiRoutes from './routes/ai';
import metaRoutes from './routes/meta';


const PORT = Number(process.env.PORT ?? 8081);
const ORIGIN = process.env.CORS_ORIGIN ?? '*';

const app = express();
app.use(cors({ origin: ORIGIN }));
app.use(express.json());
app.use(morgan('dev'));

// Health abierto (sin API-Key)
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'ai-service', time: new Date().toISOString() });
});

// Auth para el resto
app.use(apiKeyAuth);

// Rutas protegidas
app.use('/ai', aiRoutes);
app.use('/ai', metaRoutes);

app.listen(PORT, () => {
  console.log(`[ai-service] listening on :${PORT}`);
});
