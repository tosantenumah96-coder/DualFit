const fs = require("fs");
const https = require("https");
const path = require("path");

const parseEnvFile = (envPath) => {
  const result = {};
  const file = fs.readFileSync(envPath, "utf8");
  file.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      return;
    }
    const [key, ...rest] = trimmed.split("=");
    result[key] = rest.join("=");
  });
  return result;
};

const envPath = path.join(__dirname, "..", ".env");
const env = parseEnvFile(envPath);
const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.");
}

const request = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    const payload = await response.json().catch(() => ({}));
    return {
      ok: response.ok,
      status: response.status,
      payload,
    };
  } catch (error) {
    if (error?.cause?.code !== "UNABLE_TO_VERIFY_LEAF_SIGNATURE") {
      throw error;
    }

    return new Promise((resolve, reject) => {
      const request = https.request(
        url,
        {
          method: options.method || "GET",
          headers: options.headers || {},
          rejectUnauthorized: false,
        },
        (response) => {
          let body = "";
          response.on("data", (chunk) => {
            body += chunk;
          });
          response.on("end", () => {
            let payload = {};
            try {
              payload = body ? JSON.parse(body) : {};
            } catch (_parseError) {
              payload = { raw: body };
            }
            resolve({
              ok: response.statusCode >= 200 && response.statusCode < 300,
              status: response.statusCode,
              payload,
            });
          });
        }
      );

      request.on("error", reject);
      request.end();
    });
  }
};

const run = async () => {
  const authSettings = await request(`${supabaseUrl}/auth/v1/settings`, {
    headers: {
      apikey: supabaseAnonKey,
    },
  });

  const profilesCheck = await request(`${supabaseUrl}/rest/v1/profiles?select=user_id&limit=1`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  console.log("Supabase auth settings:", authSettings.status, authSettings.ok ? "ok" : authSettings.payload);
  console.log("Profiles table check:", profilesCheck.status, profilesCheck.ok ? "ok" : profilesCheck.payload);

  if (!authSettings.ok) {
    process.exitCode = 1;
    return;
  }

  if (!profilesCheck.ok) {
    console.log(
      "Note: auth connectivity is working, but the profiles table check failed. If you have not applied supabase/schema.sql yet, do that next."
    );
    process.exitCode = 1;
    return;
  }

  console.log("Supabase connectivity looks good.");
};

run().catch((error) => {
  console.error("Supabase verification failed:", error.message);
  process.exitCode = 1;
});
