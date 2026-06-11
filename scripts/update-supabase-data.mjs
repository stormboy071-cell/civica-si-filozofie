import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load environment variables from .env.local
const envPath = ".env.local";
let envVars = {};

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  content.split("\n").forEach((line) => {
    const [key, value] = line.split("=");
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
}

const supabaseUrl = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  envVars.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase URL and ANON_KEY must be set in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const updateData = async () => {
  try {
    console.log("📡 Fetching current data from Supabase...");

    // Get current data
    const { data, error } = await supabase
      .from("app_state")
      .select("payload")
      .eq("id", "main")
      .single();

    if (error) throw error;

    const payload = data.payload;
    console.log("✓ Current data retrieved");

    // Update the structure
    console.log("🔄 Updating data structure...");

    // Rename "Politica" key to "Psihologie"
    if (payload.Politica) {
      payload.Psihologie = payload.Politica;
      delete payload.Politica;
    }

    // Update tabLabels
    if (payload._settings && payload._settings.tabLabels) {
      payload._settings.tabLabels.Psihologie =
        "Procesele Afective - Emoții și Sentimente";
      delete payload._settings.tabLabels.Politica;
    }

    console.log("✓ Data structure updated");

    // Save updated data back to Supabase
    console.log("💾 Saving updated data to Supabase...");

    const { error: updateError } = await supabase.from("app_state").upsert({
      id: "main",
      payload,
      updated_at: new Date().toISOString(),
    });

    if (updateError) throw updateError;

    console.log("✅ Successfully updated Supabase!");
    console.log("\nChanges made:");
    console.log('  • "Politica" → "Psihologie"');
    console.log(
      '  • Tab label updated to "Procesele Afective - Emoții și Sentimente"',
    );
  } catch (error) {
    console.error("❌ Error updating Supabase:", error.message);
    process.exit(1);
  }
};

updateData();
