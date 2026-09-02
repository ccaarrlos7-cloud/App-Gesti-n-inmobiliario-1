import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejo de peticiones preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email, message } = await req.json()

    // Validar mensaje
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY no está configurado')
    }

    // Datos del usuario (opcionales pero validados si vienen)
    const userName = name ? String(name).trim() : 'Usuario Desconocido'
    const userEmail = email ? String(email).trim() : 'No proporcionado'

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'GestInmo Soporte <onboarding@resend.dev>',
        to: 'appgestioninmuebles@gmail.com',
        subject: `Soporte Gestinmo: ${userName}`,
        html: `
          <h2>Nuevo mensaje de soporte desde la aplicación</h2>
          <p><strong>Nombre:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
          <hr />
          <p><strong>Mensaje:</strong></p>
          <p style="white-space: pre-wrap;">${message}</p>
        `
      })
    })

    const resData = await res.json()

    if (res.ok) {
      return new Response(
        JSON.stringify({ success: true, data: resData }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      console.error('Error desde Resend:', resData)
      return new Response(
        JSON.stringify({ error: 'Error enviando el correo desde Resend' }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Error en Edge Function:', error.message)
    return new Response(
      JSON.stringify({ error: 'Error interno en el servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
