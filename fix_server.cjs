const fs = require('fs');

const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const importNodemailer = `import nodemailer from "nodemailer";\n`;
if (!content.includes('nodemailer')) {
  content = content.replace('import express from "express";', `import express from "express";\n${importNodemailer}`);
}

const endpoint = `
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
        subject: \`Soporte Gestinmo: \${name || 'Usuario'}\`,
        text: \`Has recibido un nuevo mensaje de soporte desde la aplicación.\\n\\nNombre: \${name || 'No especificado'}\\nEmail del usuario: \${email || 'No especificado'}\\n\\nMensaje:\\n\${message}\`,
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error sending support email:', error);
      res.status(500).json({ error: 'Error enviando el correo' });
    }
  });
`;

if (!content.includes('/api/support')) {
  content = content.replace('app.use(express.json({ limit: "50mb" }));', `app.use(express.json({ limit: "50mb" }));\n${endpoint}`);
  fs.writeFileSync(file, content);
  console.log('Added /api/support to server.ts');
} else {
  console.log('Already added');
}
