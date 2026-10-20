// Local entry point: binds to 127.0.0.1 only. The app itself lives in ./app.mjs (shared with the Vercel function).
import app, { aiEnabled } from './app.mjs';

const PORT = Number(process.env.PORT ?? 8787);
app.listen(PORT, '127.0.0.1', () => console.log(`Research service on http://127.0.0.1:${PORT}  (AI ${aiEnabled ? 'enabled' : 'not configured'})`));
