import { supabase } from './supabase';

export const DOCUMENT_PREFIX = 'storage://';
export const BUCKET_NAME = 'documents';

/**
 * Uploads a file to Supabase Storage and returns the identifier string (storage://...)
 */
export async function uploadDocument(file: File): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("No authenticated user");

  // Create a unique path: user_id/timestamp_filename
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${session.user.id}/${Date.now()}_${sanitizedName}`;

  const { error } = await supabase.storage.from(BUCKET_NAME).upload(path, file);
  if (error) {
    throw error;
  }

  return `${DOCUMENT_PREFIX}${path}`;
}

/**
 * Deletes a document from Supabase Storage if it is a storage:// document.
 * Safe to call with base64 strings (does nothing).
 */
export async function deleteDocument(identifier: string): Promise<void> {
  if (!identifier || !identifier.startsWith(DOCUMENT_PREFIX)) return;
  
  const path = identifier.replace(DOCUMENT_PREFIX, '');
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
  if (error) {
    console.error("Error deleting document from storage:", error);
  }
}

/**
 * Resolves an identifier to a viewable URL.
 * If it's a base64 string, returns it directly.
 * If it's a storage:// path, returns a temporary signed URL.
 */
export async function resolveDocumentUrl(identifier: string): Promise<string> {
  if (!identifier) return '';
  if (!identifier.startsWith(DOCUMENT_PREFIX)) {
    // It's base64 or a standard URL
    return identifier;
  }

  const path = identifier.replace(DOCUMENT_PREFIX, '');
  const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(path, 60 * 60); // 1 hour valid
  
  if (error || !data) {
    console.error("Error creating signed URL:", error);
    return '';
  }

  return data.signedUrl;
}
