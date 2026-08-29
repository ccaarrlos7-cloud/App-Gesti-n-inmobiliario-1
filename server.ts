import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit to 50mb because we are storing base64 documents and images
  app.use(express.json({ limit: "50mb" }));

  // Environment variables
  let SUPABASE_URL = process.env.SUPABASE_URL || '';
  // Normalize the URL if the user included /rest/v1/ in the string
  if (SUPABASE_URL.endsWith('/')) SUPABASE_URL = SUPABASE_URL.slice(0, -1);
  if (SUPABASE_URL.endsWith('/rest/v1')) SUPABASE_URL = SUPABASE_URL.slice(0, -8);
  
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
  
  console.log("Supabase URL configured:", !!SUPABASE_URL);
  console.log("Supabase Key configured:", !!SUPABASE_KEY);

  // API Routes for Supabase Proxy
  app.get("/api/store/:key", async (req, res) => {
    try {
      if (!SUPABASE_URL || !SUPABASE_KEY) {
        return res.status(500).json({ error: "Missing Supabase configuration" });
      }

      const response = await fetch(`${SUPABASE_URL}/rest/v1/kv_store?key=eq.${req.params.key}`, {
        headers: { 
          'apikey': SUPABASE_KEY, 
          'Authorization': `Bearer ${SUPABASE_KEY}` 
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json({ error: data });
      }

      if (data && data.length > 0) {
        res.json(data[0].value);
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/store/:key", async (req, res) => {
    try {
      console.log(`[Supabase] Intentando guardar clave: ${req.params.key}`);
      
      if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error("[Supabase] Error: Faltan credenciales (URL o Key).");
        return res.status(500).json({ error: "Missing Supabase configuration" });
      }

      // Upsert data using POST with prefer resolution merge-duplicates
      const payload = { key: req.params.key, value: req.body };
      
      console.log(`[Supabase] Fetching: ${SUPABASE_URL}/rest/v1/kv_store`);
      const response = await fetch(`${SUPABASE_URL}/rest/v1/kv_store`, {
        method: 'POST',
        headers: { 
          'apikey': SUPABASE_KEY, 
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
         const err = await response.text();
         console.error(`[Supabase] Fallo al guardar en '${req.params.key}':`, err);
         return res.status(response.status).json({ error: err, attemptedUrl: `${SUPABASE_URL}/rest/v1/kv_store` });
      }
      
      console.log(`[Supabase] Éxito al guardar clave: ${req.params.key}`);
      res.json({ success: true });
    } catch (e: any) {
      console.error(`[Supabase] Excepción en servidor al guardar '${req.params.key}':`, e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
