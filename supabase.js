import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_DATA_TABLE = "app_state";
export const SUPABASE_DATA_ROW_ID = "main";
export const SUPABASE_MEDIA_BUCKET = "media";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

export const getRemoteAppData = async () => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(SUPABASE_DATA_TABLE)
    .select("payload")
    .eq("id", SUPABASE_DATA_ROW_ID)
    .maybeSingle();

  if (error) throw error;
  return data?.payload || null;
};

export const saveRemoteAppData = async (payload) => {
  if (!supabase) return;

  const { error } = await supabase
    .from(SUPABASE_DATA_TABLE)
    .upsert(
      {
        id: SUPABASE_DATA_ROW_ID,
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (error) throw error;
};

const getPublicStorageUrl = (path) => {
  const { data } = supabase.storage.from(SUPABASE_MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

const normalizeUploadError = (error) => {
  const message = error?.message || error?.error || error?.details || "";
  if (/maximum allowed size|entity too large|payload too large/i.test(message)) {
    return new Error("Fisierul depaseste limita configurata in bucket-ul Supabase.");
  }
  return error instanceof Error ? error : new Error(message || "Upload failed.");
};

export const uploadToStorage = async (path, fileOrBlob, contentType) => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.storage.from(SUPABASE_MEDIA_BUCKET).upload(path, fileOrBlob, {
    cacheControl: "3600",
    upsert: false,
    contentType,
  });

  if (error) throw normalizeUploadError(error);
  return getPublicStorageUrl(path);
};
