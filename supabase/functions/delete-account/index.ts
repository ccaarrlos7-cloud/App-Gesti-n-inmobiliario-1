// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Lists and removes all objects inside a Storage folder (non-recursive one level).
 * Silently ignores errors so a missing folder never aborts the whole deletion.
 */
async function deleteStorageFolder(
  admin: ReturnType<typeof createClient>,
  bucket: string,
  folder: string,
): Promise<void> {
  try {
    const { data: files } = await admin.storage.from(bucket).list(folder, {
      limit: 1000,
      offset: 0,
    });
    if (files && files.length > 0) {
      const paths = files.map((f: { name: string }) => `${folder}/${f.name}`);
      const { error } = await admin.storage.from(bucket).remove(paths);
      if (error) {
        console.error(`Storage remove error (${bucket}/${folder}):`, error.message);
      }
    }
  } catch (e) {
    console.error(`Unexpected error deleting storage folder ${bucket}/${folder}:`, e);
  }
}

/**
 * Deletes a DB table rows with a single condition column = value.
 * Silently logs errors (table may not exist in all environments).
 */
async function safeDelete(
  admin: ReturnType<typeof createClient>,
  table: string,
  column: string,
  values: string[],
): Promise<void> {
  if (!values || values.length === 0) return;
  const { error } = await admin.from(table).delete().in(column, values);
  if (error) {
    console.error(`Error deleting from ${table} where ${column} IN [...]:`, error.message);
    throw new Error(`Failed to delete from ${table}: ${error.message}`);
  }
}

// ── Owner deletion ────────────────────────────────────────────────────────────

async function deleteOwner(
  admin: ReturnType<typeof createClient>,
  userId: string,
): Promise<void> {
  // 1. Delete all Storage files owned by this user
  //    documents bucket  → user_id/...  (contract docs, tenant docs uploaded by owner)
  //    properties bucket → user_id/...  (property images)
  await deleteStorageFolder(admin, "documents", userId);
  await deleteStorageFolder(admin, "properties", userId);

  // 2. Gather property IDs (RLS is bypassed by service role; filter by user_id column)
  const { data: props } = await admin
    .from("properties")
    .select("id")
    .eq("user_id", userId);
  const propertyIds: string[] = props?.map((r: { id: string }) => r.id) ?? [];

  // 3. Gather contract IDs for those properties
  let contractIds: string[] = [];
  if (propertyIds.length > 0) {
    const { data: conts } = await admin
      .from("contracts")
      .select("id")
      .in("property_id", propertyIds);
    contractIds = conts?.map((r: { id: string }) => r.id) ?? [];
  }

  // 4. Gather issue IDs for those properties
  let issueIds: string[] = [];
  if (propertyIds.length > 0) {
    const { data: iss } = await admin
      .from("issues")
      .select("id")
      .in("property_id", propertyIds);
    issueIds = iss?.map((r: { id: string }) => r.id) ?? [];
  }

  // 5. Gather tenant IDs
  //    Primary: rows in the tenants table owned by this user (via user_id column used in RLS)
  const { data: tenantRows } = await admin
    .from("tenants")
    .select("id")
    .eq("user_id", userId);
  let tenantIds: string[] = tenantRows?.map((r: { id: string }) => r.id) ?? [];

  //    Secondary: any tenants linked through contract_tenants (catches edge cases)
  if (contractIds.length > 0) {
    const { data: ctRows } = await admin
      .from("contract_tenants")
      .select("tenant_id")
      .in("contract_id", contractIds);
    const extraIds: string[] =
      ctRows?.map((r: { tenant_id: string }) => r.tenant_id) ?? [];
    tenantIds = [...new Set([...tenantIds, ...extraIds])];
  }

  // ── Delete in FK-safe order ────────────────────────────────────────────────

  // 6. contract_documents  (FK → contracts)
  await safeDelete(admin, "contract_documents", "contract_id", contractIds);

  // 7. issue_messages       (FK → issues)
  await safeDelete(admin, "issue_messages", "issue_id", issueIds);

  // 8. pending_tenant_invitations  (FK → tenants)
  await safeDelete(admin, "pending_tenant_invitations", "tenant_id", tenantIds);

  // 9. tenant_messages      (FK → tenants)
  await safeDelete(admin, "tenant_messages", "tenant_id", tenantIds);

  // 10. contract_tenants    (FK → contracts + tenants)
  await safeDelete(admin, "contract_tenants", "contract_id", contractIds);

  // 11. contracts           (FK → properties)
  await safeDelete(admin, "contracts", "property_id", propertyIds);

  // 12. issues              (FK → properties)
  await safeDelete(admin, "issues", "property_id", propertyIds);

  // 13. transactions        (FK → properties)
  await safeDelete(admin, "transactions", "property_id", propertyIds);

  // 14. tenants             (the owner's own tenant records)
  await safeDelete(admin, "tenants", "id", tenantIds);

  // 15. properties
  await safeDelete(admin, "properties", "id", propertyIds);

  // 16. profile             (FK → auth.users)
  await safeDelete(admin, "profiles", "id", [userId]);

  // 17. Auth user  — must be last so the JWT stays valid throughout
  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) {
    console.error("Error deleting auth user:", authError.message);
    throw new Error("Failed to delete auth user: " + authError.message);
  }
}

// ── Tenant deletion ───────────────────────────────────────────────────────────

async function deleteTenant(
  admin: ReturnType<typeof createClient>,
  userId: string,
): Promise<void> {
  // 1. Delete DB records for documents uploaded by this tenant
  const { error: cdError } = await admin
    .from("contract_documents")
    .delete()
    .like("storage_path", `${userId}/%`);
  if (cdError) {
    console.error("contract_documents delete error:", cdError.message);
    throw new Error("Failed to delete contract_documents: " + cdError.message);
  }

  // 2. Delete Storage files uploaded by this tenant user
  //    (documents bucket only — tenants don't upload to properties bucket)
  await deleteStorageFolder(admin, "documents", userId);

  // 3. Delete messages authored by this tenant
  //    issue_messages where author_id = userId
  const { error: imError } = await admin
    .from("issue_messages")
    .delete()
    .eq("author_id", userId);
  if (imError) {
    console.error("issue_messages delete error:", imError.message);
    throw new Error("Failed to delete issue_messages: " + imError.message);
  }

  //    tenant_messages where author_id = userId
  const { error: tmError } = await admin
    .from("tenant_messages")
    .delete()
    .eq("author_id", userId);
  if (tmError) {
    console.error("tenant_messages delete error:", tmError.message);
    throw new Error("Failed to delete tenant_messages: " + tmError.message);
  }

  // 4. Unlink the auth account from the tenants record.
  //    The tenant RECORD itself belongs to the owner and must be preserved.
  //    We only remove the profile_id link so the owner's data stays intact.
  const { error: unlinkError } = await admin
    .from("tenants")
    .update({ profile_id: null })
    .eq("profile_id", userId);
  if (unlinkError) {
    console.error("tenants unlink error:", unlinkError.message);
    throw new Error("Failed to unlink tenant profile: " + unlinkError.message);
  }

  // 5. Delete the profile row
  const { error: profError } = await admin
    .from("profiles")
    .delete()
    .eq("id", userId);
  if (profError) {
    console.error("profiles delete error:", profError.message);
    throw new Error("Failed to delete profile: " + profError.message);
  }

  // 5. Delete auth user — must be last
  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) {
    console.error("Error deleting tenant auth user:", authError.message);
    throw new Error("Failed to delete auth user: " + authError.message);
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req: any) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── 1. Extract and validate the JWT ──────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    const jwt = authHeader.replace("Bearer ", "").trim();

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing required environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Admin client — service_role key never leaves this server-side function
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Validate the JWT by resolving the actual user.
    // userId is taken from the verified token, NEVER from the request body.
    const { data: { user }, error: userError } = await admin.auth.getUser(jwt);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const userId = user.id; // Comes from verified JWT — cannot be spoofed by client

    // ── 2. Determine role ────────────────────────────────────────────────────
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    const role: string = profile?.role ?? "unknown";

    // ── 3. Execute the appropriate deletion path ─────────────────────────────
    if (role === "propietario") {
      await deleteOwner(admin, userId);
    } else if (role === "inquilino") {
      await deleteTenant(admin, userId);
    } else {
      // Unknown or missing role — delete only the auth user and profile
      console.warn(`Unknown role "${role}" for user ${userId}. Deleting auth user only.`);
      await admin.from("profiles").delete().eq("id", userId);
      const { error: authErr } = await admin.auth.admin.deleteUser(userId);
      if (authErr) throw new Error(authErr.message);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("delete-account fatal error:", message);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
