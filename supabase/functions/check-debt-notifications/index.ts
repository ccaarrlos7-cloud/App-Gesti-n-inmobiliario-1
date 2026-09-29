/**
 * check-debt-notifications — Detector de deuda del día 5
 *
 * RESPONSABILIDAD ÚNICA: detectar contratos que actualmente estarían en "Deuda"
 * según la misma lógica que ya usa GestiCasa (getContractTruePaymentStatus),
 * y enviar el evento a process-push-event para que este gestione todo lo demás.
 *
 * ESTA FUNCIÓN NO:
 *   - Escribe en notification_logs (lo gestiona process-push-event).
 *   - Envía directamente a APNs.
 *   - Modifica contratos, monthly_payments ni ningún dato de negocio.
 *   - Crea incidencias artificiales.
 *   - Duplica la lógica APNs.
 *
 * ESTA FUNCIÓN SOLO:
 *   1. Calcula la fecha/día actual en zona horaria de Madrid.
 *   2. Si día < 5, termina sin hacer nada.
 *   3. Lee los contratos activos con sus monthly_payments.
 *   4. Aplica exactamente la misma lógica que getContractTruePaymentStatus().
 *   5. Para cada contrato en Deuda, llama a process-push-event con:
 *         { event_type: "debt_alert", contract_id, month_key }
 *   6. process-push-event resuelve el propietario, verifica idempotencia y envía.
 *
 * La idempotencia día 5→única notificación por mes está garantizada por
 * notification_logs dentro de process-push-event.
 *
 * Invocada por pg_cron diariamente via la función SQL gcasa_invoke_debt_check()
 * que lee las credenciales desde Supabase Vault (nunca texto plano).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 })
    }

    // Verificar webhook secret (mismo mecanismo que process-push-event)
    const webhookSecret = Deno.env.get("WEBHOOK_SECRET")
    if (!webhookSecret) {
      console.error("[DEBT] Webhook secret no configurado en el entorno")
      return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 })
    }

    const incoming = req.headers.get("x-webhook-secret")
    if (incoming !== webhookSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    // ---------------------------------------------------------------------------
    // Calcular fecha actual en zona horaria de Madrid
    // Importante: el Cron corre en UTC; hay que convertir para respetar la regla del día 5.
    // ---------------------------------------------------------------------------
    const nowMadrid = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" })
    )
    const dayOfMonth = nowMadrid.getDate()
    const currentYear = nowMadrid.getFullYear()
    const currentMonth = String(nowMadrid.getMonth() + 1).padStart(2, "0")
    const currentMonthKey = `${currentYear}-${currentMonth}` // "YYYY-MM"

    // Misma lógica que getContractTruePaymentStatus: solo actuar desde día 5
    if (dayOfMonth < 5) {
      console.log(`[DEBT] Día ${dayOfMonth} de Madrid — antes del día 5. Sin acción.`)
      return new Response(
        JSON.stringify({ skipped: true, reason: "before_day_5", day: dayOfMonth }),
        { status: 200 }
      )
    }

    console.log(`[DEBT] Comprobando contratos en deuda para ${currentMonthKey} (día ${dayOfMonth})`)

    // ---------------------------------------------------------------------------
    // Leer contratos activos
    // ---------------------------------------------------------------------------
    const db = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    const { data: contracts, error: contractsError } = await db
      .from("contracts")
      .select("id, property_id, start_date, end_date, monthly_payments")
      .eq("status", "Activo")

    if (contractsError) {
      console.error("[DEBT] Error al leer contratos:", contractsError)
      return new Response(JSON.stringify({ error: "DB error" }), { status: 500 })
    }

    if (!contracts?.length) {
      console.log("[DEBT] No hay contratos activos.")
      return new Response(JSON.stringify({ success: true, checked: 0 }), { status: 200 })
    }

    // ---------------------------------------------------------------------------
    // Detectar contratos en Deuda (misma lógica que getContractTruePaymentStatus)
    // ---------------------------------------------------------------------------
    const debtContractIds: string[] = []

    for (const c of contracts) {
      // Verificar que el mes actual está dentro del rango del contrato
      const startMonth = c.start_date?.slice(0, 7) ?? ""
      const endMonth = c.end_date?.slice(0, 7) ?? ""
      if (startMonth && currentMonthKey < startMonth) continue
      if (endMonth && currentMonthKey > endMonth) continue

      const payments = (c.monthly_payments ?? {}) as Record<string, string>
      const statusForCurrentMonth = payments[currentMonthKey] ?? "Pendiente"

      // Deuda = explícitamente marcado como 'Deuda', o 'Pendiente' y día >= 5
      const isDeuda =
        statusForCurrentMonth === "Deuda" ||
        (statusForCurrentMonth === "Pendiente" && dayOfMonth >= 5)

      if (isDeuda) {
        debtContractIds.push(c.id)
      }
    }

    console.log(`[DEBT] Contratos en deuda detectados: ${debtContractIds.length} / ${contracts.length}`)

    // ---------------------------------------------------------------------------
    // Delegar cada deuda al motor único process-push-event
    // process-push-event se encarga de:
    //   - Resolver el propietario del contrato
    //   - Verificar idempotencia en notification_logs
    //   - Enviar a APNs si corresponde
    // ---------------------------------------------------------------------------
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const webhookSecretHeader = Deno.env.get("WEBHOOK_SECRET") ?? ""

    let dispatchedCount = 0

    for (const contractId of debtContractIds) {
      const eventPayload = {
        event_type: "debt_alert",
        contract_id: contractId,
        month_key: currentMonthKey,
      }

      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/process-push-event`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-webhook-secret": webhookSecretHeader,
          },
          body: JSON.stringify(eventPayload),
        })

        if (response.ok) {
          dispatchedCount++
          const result = await response.json()
          console.log(`[DEBT] Procesado contrato ${contractId}:`, JSON.stringify(result))
        } else {
          const errText = await response.text()
          console.error(`[DEBT] Error procesando contrato ${contractId}:`, errText.slice(0, 200))
        }
      } catch (fetchErr) {
        const msg = fetchErr instanceof Error ? fetchErr.message : "Unknown"
        console.error(`[DEBT] Fallo de red para contrato ${contractId}:`, msg)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        month: currentMonthKey,
        day: dayOfMonth,
        total_active_contracts: contracts.length,
        debt_contracts_detected: debtContractIds.length,
        dispatched_to_process: dispatchedCount,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown"
    console.error("[DEBT] Error no manejado:", msg)
    return new Response(JSON.stringify({ error: "Internal Server Error", message: msg }), { status: 500 })
  }
})
