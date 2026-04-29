import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { eppService } from './src/services/eppService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.text({ type: 'application/xml' }));
  app.use(express.text({ type: 'text/xml' }));
  app.use(express.json());

  // EPP API Endpoint
  app.get('/api/epp', (req, res) => {
    res.set('Content-Type', 'application/xml');
    res.send(eppService.getGreeting());
  });

  app.post('/api/epp', (req, res) => {
    let xml = '';
    if (typeof req.body === 'string') {
        xml = req.body;
    } else if (req.body && req.body.xml) {
        xml = req.body.xml;
    }

    if (!xml) {
      return res.status(400).send('Missing EPP XML');
    }

    try {
      eppService.processRequest(xml).then(response => {
        res.set('Content-Type', 'application/xml');
        res.send(response.xml);
      }).catch(error => {
        console.error('EPP Processing Error:', error);
        res.status(500).send('Internal Server Error');
      });
    } catch (error) {
      console.error('EPP Dispatch Error:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', engine: 'EPP Forge Mock' });
  });

  // Initialize mock data in Firestore (non-blocking)
  eppService.initializeMockData().catch(err => {
    console.error('Failed to initialize mock data:', err);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
