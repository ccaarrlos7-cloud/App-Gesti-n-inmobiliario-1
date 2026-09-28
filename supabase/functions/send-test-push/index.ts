import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejar CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Inicializar cliente Supabase y verificar autenticación
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Obtener el token del dispositivo del usuario que hace la petición
    const { data: tokens, error: tokensError } = await supabaseClient
      .from('user_push_tokens')
      .select('device_token, platform, environment')
      .eq('user_id', user.id)
      .eq('platform', 'ios')
      .limit(1)

    if (tokensError || !tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ error: 'No iOS device token found for user' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const deviceToken = tokens[0].device_token
    const environment = tokens[0].environment || 'development'

    // 3. Obtener secretos de APNs
    const apnsKeyId = Deno.env.get('APNS_KEY_ID')
    const apnsTeamId = Deno.env.get('APNS_TEAM_ID')
    const apnsBundleId = Deno.env.get('APNS_BUNDLE_ID') || 'com.carlosgil.gesticasa'
    const apnsAuthKeyStr = Deno.env.get('APNS_AUTH_KEY') 

    if (!apnsKeyId || !apnsTeamId || !apnsAuthKeyStr) {
      return new Response(JSON.stringify({ error: 'APNs configuration missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Generar JWT para APNs
    const privateKeyStr = apnsAuthKeyStr.replace(/\\n/g, '\n')
    const privateKey = await jose.importPKCS8(privateKeyStr, 'ES256')

    const jwt = await new jose.SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: apnsKeyId })
      .setIssuer(apnsTeamId)
      .setIssuedAt()
      .sign(privateKey)

    // 5. Construir payload de la notificación APNs
    const payload = {
      aps: {
        alert: {
          title: "GestiCasa",
          body: "GestiCasa está correctamente conectada con las notificaciones."
        },
        sound: "default"
      }
    }

    // 6. Enviar a APNs (sandbox o production según el registro en DB)
    const isSandbox = environment === 'development'
    const apnsHost = isSandbox ? 'api.sandbox.push.apple.com' : 'api.push.apple.com'
    const apnsUrl = `https://${apnsHost}/3/device/${deviceToken}`

    const response = await fetch(apnsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `bearer ${jwt}`,
        'apns-topic': apnsBundleId,
        'apns-push-type': 'alert'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorBody = await response.text()
      // Si el error es BadDeviceToken o Unregistered, deberíamos borrar el token de Supabase.
      if (response.status === 410 || (response.status === 400 && errorBody.includes('BadDeviceToken'))) {
        await supabaseClient.from('user_push_tokens').delete().eq('device_token', deviceToken)
      }

      return new Response(JSON.stringify({ error: 'APNs Error', details: errorBody, status: response.status }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 7. Éxito
    return new Response(JSON.stringify({ success: true, message: 'Notification sent successfully' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Internal Server Error', message: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
