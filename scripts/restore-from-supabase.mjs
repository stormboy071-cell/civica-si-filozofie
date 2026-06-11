import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load environment variables
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
  console.error("❌ Supabase credentials not found in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const restoreData = async () => {
  try {
    console.log("📡 Fetching complete data from Supabase...");

    // Get the stored data
    const { data, error } = await supabase
      .from("app_state")
      .select("payload")
      .eq("id", "main")
      .single();

    if (error) throw error;

    const payload = data.payload;
    console.log("✓ Data retrieved from Supabase");

    // Save to local backup
    console.log("💾 Saving to local presentation-backup.json...");

    const outputPath = "public/presentation-backup.json";
    fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));

    console.log("✅ Data restored successfully!");
    console.log(`📁 File saved to: ${outputPath}`);

    // Show statistics
    const tabs = Object.keys(payload).filter((k) => !k.startsWith("_"));
    let totalItems = 0;
    let totalImages = 0;

    tabs.forEach((tab) => {
      if (Array.isArray(payload[tab])) {
        payload[tab].forEach((section) => {
          if (section.items && Array.isArray(section.items)) {
            totalItems += section.items.length;
            section.items.forEach((item) => {
              if (item.image_url) totalImages++;
            });
          }
        });
      }
    });

    console.log("\n📊 Data Statistics:");
    console.log(`  • Tabs: ${tabs.length} (${tabs.join(", ")})`);
    console.log(`  • Total items: ${totalItems}`);
    console.log(`  • Items with images: ${totalImages}`);
    console.log(`  • Sections: ${Object.values(payload).flat().length}`);
  } catch (error) {
    console.error("❌ Error restoring data:", error.message);
    process.exit(1);
  }
};

restoreData();
