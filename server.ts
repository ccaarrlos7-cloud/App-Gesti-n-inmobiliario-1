import "dotenv/config";
import express from "express";
import nodemailer from "nodemailer";

import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit to 50mb because we are storing base64 documents and images
  app.use(express.json({ limit: "50mb" }));

  app.post('/api/support', async (req, res) => {
    try {
      const { name, email, message } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Check if SMTP is configured, otherwise simulate success or fail based on env (but for this requirement, we need to try sending)
      // The instructions say "Si para enviar correos es necesario configurar una variable de entorno... utiliza la arquitectura más segura y sencilla"
      // So we will expect SMTP_USER and SMTP_PASS in .env.
      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER || 'appgestioninmuebles@gmail.com',
          pass: process.env.SMTP_PASS
        }
      });

      const mailOptions = {
        from: process.env.SMTP_USER || 'appgestioninmuebles@gmail.com',
        to: 'appgestioninmuebles@gmail.com',
        subject: `Soporte Gestinmo: ${name || 'Usuario'}`,
        text: `Has recibido un nuevo mensaje de soporte desde la aplicación.\n\nNombre: ${name || 'No especificado'}\nEmail del usuario: ${email || 'No especificado'}\n\nMensaje:\n${message}`,
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error sending support email:', error);
      res.status(500).json({ error: 'Error enviando el correo' });
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
