const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { logAppError, logAppInfo } = require("./services/app-logger");

loadDotEnv(path.join(__dirname, ".env"));

const PORT = Number.parseInt(process.env.PORT || "4173", 10);
const HOST = process.env.HOST || "0.0.0.0";
const FATSECRET_CLIENT_ID = process.env.FATSECRET_CLIENT_ID || "";
const FATSECRET_CLIENT_SECRET = process.env.FATSECRET_CLIENT_SECRET || "";
const FATSECRET_SCOPE = process.env.FATSECRET_SCOPE || "basic";
const USE_SAMPLE_FALLBACK = String(process.env.FATSECRET_USE_SAMPLE_FALLBACK || "true").toLowerCase() !== "false";

const sampleFoods = [
  {
    id: "sample-chicken-rice-bowl",
    name: "Chicken Rice Bowl",
    brand: "MassTrack Test Kitchen",
    description: "493 kcal | P 44.2g | C 55g | F 9.9g",
    servings: [
      { id: "serving", serving_id: "serving", serving_description: "1 serving", calories: 492.8, protein: 44.2, carbohydrate: 55, fat: 9.9, metric_serving_amount: 320, metric_serving_unit: "g", is_default: 1 },
      { id: "grams", serving_id: "grams", serving_description: "grams", calories: 1.5, protein: 0.1, carbohydrate: 0.2, fat: 0, metric_serving_amount: 1, metric_serving_unit: "g", is_default: 0 },
    ],
  },
  {
    id: "sample-lean-ground-beef",
    name: "Lean Ground Beef",
    brand: "MassTrack Protein",
    description: "217 kcal | P 26g | C 0g | F 12g",
    servings: [
      { id: "4oz", serving_id: "4oz", serving_description: "4 oz cooked", calories: 245, protein: 29.4, carbohydrate: 0, fat: 13.6, metric_serving_amount: 113, metric_serving_unit: "g", is_default: 1 },
      { id: "grams", serving_id: "grams", serving_description: "grams", calories: 2.2, protein: 0.3, carbohydrate: 0, fat: 0.1, metric_serving_amount: 1, metric_serving_unit: "g", is_default: 0 },
    ],
  },
  {
    id: "sample-beef-sirloin",
    name: "Beef Sirloin Steak",
    brand: "Butcher Counter",
    description: "206 kcal | P 27g | C 0g | F 10.5g",
    servings: [
      { id: "6oz", serving_id: "6oz", serving_description: "6 oz steak", calories: 350, protein: 45.9, carbohydrate: 0, fat: 17.9, metric_serving_amount: 170, metric_serving_unit: "g", is_default: 1 },
      { id: "grams", serving_id: "grams", serving_description: "grams", calories: 2.1, protein: 0.3, carbohydrate: 0, fat: 0.1, metric_serving_amount: 1, metric_serving_unit: "g", is_default: 0 },
    ],
  },
  {
    id: "sample-beef-burger-patty",
    name: "Beef Burger Patty",
    brand: "Sample Grill",
    description: "254 kcal | P 17g | C 0g | F 20g",
    servings: [
      { id: "patty", serving_id: "patty", serving_description: "1 patty", calories: 254, protein: 17, carbohydrate: 0, fat: 20, metric_serving_amount: 100, metric_serving_unit: "g", is_default: 1 },
      { id: "grams", serving_id: "grams", serving_description: "grams", calories: 2.5, protein: 0.2, carbohydrate: 0, fat: 0.2, metric_serving_amount: 1, metric_serving_unit: "g", is_default: 0 },
    ],
  },
  {
    id: "sample-greek-yogurt",
    name: "Greek Yogurt",
    brand: "Sample Foods",
    description: "165 kcal | P 17.5g | C 6.5g | F 7g",
    servings: [
      { id: "label-container", serving_id: "label-container", serving_description: "label container", calories: 164.9, protein: 17.5, carbohydrate: 6.5, fat: 7, metric_serving_amount: 170, metric_serving_unit: "g", is_default: 1 },
      { id: "cup", serving_id: "cup", serving_description: "1 cup", calories: 220.2, protein: 23.4, carbohydrate: 8.6, fat: 9.3, metric_serving_amount: 227, metric_serving_unit: "g", is_default: 0 },
    ],
  },
  {
    id: "sample-banana",
    name: "Banana",
    brand: "Produce",
    description: "105 kcal | P 1.3g | C 26.9g | F 0.4g",
    servings: [
      { id: "medium-banana", serving_id: "medium-banana", serving_description: "1 medium banana", calories: 105, protein: 1.3, carbohydrate: 26.9, fat: 0.4, metric_serving_amount: 118, metric_serving_unit: "g", is_default: 1 },
      { id: "grams", serving_id: "grams", serving_description: "grams", calories: 0.9, protein: 0, carbohydrate: 0.2, fat: 0, metric_serving_amount: 1, metric_serving_unit: "g", is_default: 0 },
    ],
  },
  {
    id: "sample-chicken-breast",
    name: "Chicken Breast",
    brand: "MassTrack Protein",
    description: "165 kcal | P 31g | C 0g | F 3.6g",
    servings: [
      { id: "4oz", serving_id: "4oz", serving_description: "4 oz cooked", calories: 187, protein: 35.1, carbohydrate: 0, fat: 4.1, metric_serving_amount: 120, metric_serving_unit: "g", is_default: 1 },
      { id: "grams", serving_id: "grams", serving_description: "grams", calories: 1.7, protein: 0.3, carbohydrate: 0, fat: 0, metric_serving_amount: 1, metric_serving_unit: "g", is_default: 0 },
    ],
  },
  {
    id: "sample-chicken-thigh",
    name: "Chicken Thigh",
    brand: "MassTrack Protein",
    description: "209 kcal | P 26g | C 0g | F 10.9g",
    servings: [
      { id: "4oz", serving_id: "4oz", serving_description: "4 oz cooked", calories: 237, protein: 29.5, carbohydrate: 0, fat: 12.4, metric_serving_amount: 113, metric_serving_unit: "g", is_default: 1 },
      { id: "grams", serving_id: "grams", serving_description: "grams", calories: 2.1, protein: 0.3, carbohydrate: 0, fat: 0.1, metric_serving_amount: 1, metric_serving_unit: "g", is_default: 0 },
    ],
  },
  {
    id: "sample-white-rice",
    name: "White Rice",
    brand: "Pantry Staples",
    description: "130 kcal | P 2.7g | C 28.2g | F 0.3g",
    servings: [
      { id: "cup", serving_id: "cup", serving_description: "1 cup cooked", calories: 205, protein: 4.3, carbohydrate: 44.5, fat: 0.4, metric_serving_amount: 158, metric_serving_unit: "g", is_default: 1 },
      { id: "grams", serving_id: "grams", serving_description: "grams", calories: 1.3, protein: 0, carbohydrate: 0.3, fat: 0, metric_serving_amount: 1, metric_serving_unit: "g", is_default: 0 },
    ],
  },
  {
    id: "sample-brown-rice",
    name: "Brown Rice",
    brand: "Pantry Staples",
    description: "123 kcal | P 2.7g | C 25.6g | F 1g",
    servings: [
      { id: "cup", serving_id: "cup", serving_description: "1 cup cooked", calories: 216, protein: 5, carbohydrate: 44.8, fat: 1.8, metric_serving_amount: 195, metric_serving_unit: "g", is_default: 1 },
      { id: "grams", serving_id: "grams", serving_description: "grams", calories: 1.2, protein: 0, carbohydrate: 0.3, fat: 0, metric_serving_amount: 1, metric_serving_unit: "g", is_default: 0 },
    ],
  },
  {
    id: "sample-oats",
    name: "Rolled Oats",
    brand: "Pantry Staples",
    description: "156 kcal | P 6.8g | C 26.5g | F 2.8g",
    servings: [
      { id: "half-cup", serving_id: "half-cup", serving_description: "1/2 cup dry", calories: 156, protein: 6.8, carbohydrate: 26.5, fat: 2.8, metric_serving_amount: 40, metric_serving_unit: "g", is_default: 1 },
      { id: "grams", serving_id: "grams", serving_description: "grams", calories: 3.9, protein: 0.2, carbohydrate: 0.7, fat: 0.1, metric_serving_amount: 1, metric_serving_unit: "g", is_default: 0 },
    ],
  },
  {
    id: "sample-whole-eggs",
    name: "Whole Eggs",
    brand: "Sample Farm",
    description: "143 kcal | P 12.6g | C 0.7g | F 9.5g",
    servings: [
      { id: "two-eggs", serving_id: "two-eggs", serving_description: "2 eggs", calories: 143, protein: 12.6, carbohydrate: 0.7, fat: 9.5, metric_serving_amount: 100, metric_serving_unit: "g", is_default: 1 },
      { id: "single-egg", serving_id: "single-egg", serving_description: "1 egg", calories: 71.5, protein: 6.3, carbohydrate: 0.4, fat: 4.8, metric_serving_amount: 50, metric_serving_unit: "g", is_default: 0 },
    ],
  },
  {
    id: "sample-whey-protein",
    name: "Whey Protein",
    brand: "Sample Supplement",
    description: "128 kcal | P 25.6g | C 2.6g | F 1.9g",
    servings: [
      { id: "scoop", serving_id: "scoop", serving_description: "1 scoop", calories: 128, protein: 25.6, carbohydrate: 2.6, fat: 1.9, metric_serving_amount: 32, metric_serving_unit: "g", is_default: 1 },
      { id: "grams", serving_id: "grams", serving_description: "grams", calories: 4, protein: 0.8, carbohydrate: 0.1, fat: 0.1, metric_serving_amount: 1, metric_serving_unit: "g", is_default: 0 },
    ],
  },
  {
    id: "sample-salmon",
    name: "Atlantic Salmon",
    brand: "Seafood Counter",
    description: "208 kcal | P 20g | C 0g | F 13g",
    servings: [
      { id: "fillet", serving_id: "fillet", serving_description: "1 fillet", calories: 320, protein: 30.8, carbohydrate: 0, fat: 20, metric_serving_amount: 154, metric_serving_unit: "g", is_default: 1 },
      { id: "grams", serving_id: "grams", serving_description: "grams", calories: 2.1, protein: 0.2, carbohydrate: 0, fat: 0.1, metric_serving_amount: 1, metric_serving_unit: "g", is_default: 0 },
    ],
  },
];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

let tokenCache = {
  token: "",
  expiresAt: 0,
};
let tokenRequestPromise = null;

const searchCache = new Map();
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
const recentErrorLogCache = new Map();
const ERROR_LOG_DEDUPE_MS = 15 * 1000;

function logDedupedAppError(cacheKey, payload) {
  const now = Date.now();
  const previous = recentErrorLogCache.get(cacheKey) || 0;
  if (now - previous < ERROR_LOG_DEDUPE_MS) {
    return;
  }
  recentErrorLogCache.set(cacheKey, now);
  logAppError(payload);
}

function parseJsonSafe(value) {
  try {
    return value ? JSON.parse(value) : {};
  } catch (_error) {
    return {};
  }
}

async function fetchWithTlsFallback(url, options = {}) {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (error?.cause?.code !== "UNABLE_TO_VERIFY_LEAF_SIGNATURE") {
      throw error;
    }

    return new Promise((resolve, reject) => {
      const targetUrl = typeof url === "string" ? new URL(url) : url;
      const request = https.request(
        targetUrl,
        {
          method: options.method || "GET",
          headers: options.headers || {},
          rejectUnauthorized: false,
        },
        (response) => {
          const chunks = [];
          response.on("data", (chunk) => chunks.push(chunk));
          response.on("end", () => {
            const body = Buffer.concat(chunks).toString("utf8");
            resolve({
              ok: response.statusCode >= 200 && response.statusCode < 300,
              status: response.statusCode,
              json: async () => parseJsonSafe(body),
              text: async () => body,
            });
          });
        }
      );

      request.on("error", reject);
      if (options.body) {
        request.write(options.body.toString());
      }
      request.end();
    });
  }
}

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const envText = fs.readFileSync(filePath, "utf8");
  envText.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^"(.*)"$/, "$1");
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, body, contentType = "text/plain; charset=utf-8") {
  response.writeHead(statusCode, {
    "Content-Type": contentType,
    "Access-Control-Allow-Origin": "*",
  });
  response.end(body);
}

function getLanUrls(port) {
  const interfaces = os.networkInterfaces();
  const urls = [];

  Object.values(interfaces).forEach((entries) => {
    (entries || []).forEach((entry) => {
      if (!entry || entry.family !== "IPv4" || entry.internal) {
        return;
      }

      urls.push(`http://${entry.address}:${port}`);
    });
  });

  return [...new Set(urls)];
}

function normalizeSampleSearchResults(query) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  const filtered = !normalizedQuery
    ? sampleFoods
    : sampleFoods
        .map((food) => {
          const haystack = `${food.name} ${food.brand} ${food.description}`.toLowerCase();
          const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
          const tokenMatches = tokens.reduce((count, token) => count + (haystack.includes(token) ? 1 : 0), 0);
          const exactMatch = haystack.includes(normalizedQuery);
          const startsMatch = food.name.toLowerCase().startsWith(normalizedQuery) || food.brand.toLowerCase().startsWith(normalizedQuery);
          const score = (exactMatch ? 100 : 0) + (startsMatch ? 25 : 0) + (tokenMatches * 15);

          return { food, score };
        })
        .filter((entry) => entry.score > 0)
        .sort((left, right) => right.score - left.score || left.food.name.localeCompare(right.food.name))
        .slice(0, 16)
        .map((entry) => entry.food);

  return filtered.map((food) => ({
    id: food.id,
    source: "sample",
    name: food.name,
    brand: food.brand,
    description: food.description,
  }));
}

function getSampleFood(foodId) {
  return sampleFoods.find((food) => food.id === foodId) || null;
}

function parseFatSecretDescription(description = "") {
  const text = String(description || "");
  const caloriesMatch = text.match(/Calories:\s*([0-9.]+)/i);
  const fatMatch = text.match(/Fat:\s*([0-9.]+)/i);
  const carbsMatch = text.match(/Carbs?:\s*([0-9.]+)/i);
  const proteinMatch = text.match(/Protein:\s*([0-9.]+)/i);
  const servingLabel = text.split("-")[0]?.trim() || "";

  return {
    servingLabel,
    calories: caloriesMatch ? Number.parseFloat(caloriesMatch[1]) : null,
    protein: proteinMatch ? Number.parseFloat(proteinMatch[1]) : null,
    carbs: carbsMatch ? Number.parseFloat(carbsMatch[1]) : null,
    fat: fatMatch ? Number.parseFloat(fatMatch[1]) : null,
  };
}

function normalizeFatSecretSearchResults(payload) {
  const foods = Array.isArray(payload.foods?.food) ? payload.foods.food : payload.foods?.food ? [payload.foods.food] : [];

  return foods
    .map((food) => {
      if (!food || !food.food_id) {
        return null;
      }
      const preview = parseFatSecretDescription(food.food_description || "");
      return {
        id: String(food.food_id),
        source: "fatsecret",
        name: String(food.food_name || "").trim(),
        brand: String(food.brand_name || "").trim(),
        description: food.food_description || "",
        servingLabel: preview.servingLabel || "",
        macros: {
          calories: preview.calories,
          protein: preview.protein,
          carbs: preview.carbs,
          fat: preview.fat,
        },
      };
    })
    .filter((food) => food?.id && food.name)
    .filter((food, index, list) => list.findIndex((candidate) => (
      String(candidate.name || "").toLowerCase() === String(food.name || "").toLowerCase() &&
      String(candidate.brand || "").toLowerCase() === String(food.brand || "").toLowerCase()
    )) === index);
}

async function getAccessToken() {
  const now = Date.now();
  if (tokenCache.token && now < tokenCache.expiresAt - 60_000) {
    return tokenCache.token;
  }
  if (tokenRequestPromise) {
    return tokenRequestPromise;
  }

  if (!FATSECRET_CLIENT_ID || !FATSECRET_CLIENT_SECRET) {
    throw new Error("FatSecret credentials are not configured.");
  }

  tokenRequestPromise = (async () => {
    const auth = Buffer.from(`${FATSECRET_CLIENT_ID}:${FATSECRET_CLIENT_SECRET}`).toString("base64");
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      scope: FATSECRET_SCOPE,
    });

    const response = await fetchWithTlsFallback("https://oauth.fatsecret.com/connect/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FatSecret token request failed (${response.status}): ${errorText}`);
    }

    const payload = await response.json();
    if (!payload?.access_token) {
      throw new Error("FatSecret token response did not include an access token.");
    }

    tokenCache = {
      token: payload.access_token,
      expiresAt: Date.now() + (Number.parseInt(payload.expires_in || "0", 10) * 1000),
    };

    return tokenCache.token;
  })();

  try {
    return await tokenRequestPromise;
  } finally {
    tokenRequestPromise = null;
  }
}

async function fatSecretGet(resourcePath, params, retryOnAuthFailure = true) {
  const token = await getAccessToken();
  const endpoint = new URL(resourcePath, "https://platform.fatsecret.com");
  Object.entries(params).forEach(([key, value]) => {
    endpoint.searchParams.set(key, value);
  });
  endpoint.searchParams.set("format", "json");

  const response = await fetchWithTlsFallback(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    if ((response.status === 401 || response.status === 403) && retryOnAuthFailure) {
      tokenCache = { token: "", expiresAt: 0 };
      return fatSecretGet(resourcePath, params, false);
    }
    throw new Error(`FatSecret request failed (${response.status}): ${errorText}`);
  }

  const payload = await response.json();
  if (payload?.error?.message) {
    throw new Error(`FatSecret API error ${payload.error.code || ""}: ${payload.error.message}`.trim());
  }

  return payload;
}

async function handleFoodSearch(requestUrl, response) {
  const query = requestUrl.searchParams.get("q") || "";
  if (!query.trim()) {
    sendJson(response, 200, {
      provider: FATSECRET_CLIENT_ID && FATSECRET_CLIENT_SECRET ? "fatsecret" : "sample",
      message: FATSECRET_CLIENT_ID && FATSECRET_CLIENT_SECRET
        ? "Start typing to search FatSecret."
        : "FatSecret credentials are not configured yet. Showing sample foods.",
      results: [],
    });
    return;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const cachedEntry = searchCache.get(normalizedQuery);
  if (cachedEntry && Date.now() - cachedEntry.createdAt < SEARCH_CACHE_TTL_MS) {
    sendJson(response, 200, cachedEntry.payload);
    return;
  }

  try {
    const payload = await fatSecretGet("/rest/foods/search/v1", {
      search_expression: query,
      max_results: "20",
    });

    const responsePayload = {
      provider: "fatsecret",
      message: "Live search results from FatSecret.",
      results: normalizeFatSecretSearchResults(payload),
    };
    logAppInfo({
      source: "fatsecret",
      action: "search-success",
      userMessage: "FatSecret search completed.",
      details: { query, resultCount: responsePayload.results.length },
    });
    searchCache.set(normalizedQuery, {
      createdAt: Date.now(),
      payload: responsePayload,
    });
    sendJson(response, 200, responsePayload);
  } catch (error) {
    logDedupedAppError(`fatsecret-search:${normalizedQuery}:${error.message}`, {
      source: "fatsecret",
      action: "search-request",
      userMessage: "FatSecret search failed.",
      error,
      details: { query },
    });
    if (!USE_SAMPLE_FALLBACK) {
      sendJson(response, 502, { error: error.message });
      return;
    }

    const responsePayload = {
      provider: "sample",
      message: `FatSecret search is unavailable right now (${error.message}). Showing sample foods instead.`,
      results: normalizeSampleSearchResults(query),
    };
    searchCache.set(normalizedQuery, {
      createdAt: Date.now(),
      payload: responsePayload,
    });
    sendJson(response, 200, responsePayload);
  }
}

async function handleFoodDetail(foodId, response) {
  if (foodId.startsWith("sample-")) {
    const sampleFood = getSampleFood(foodId);
    if (!sampleFood) {
      sendJson(response, 404, { error: "Sample food not found." });
      return;
    }

    sendJson(response, 200, {
      provider: "sample",
      food: {
        food_id: sampleFood.id,
        food_name: sampleFood.name,
        brand_name: sampleFood.brand,
        food_description: sampleFood.description,
        servings: {
          serving: sampleFood.servings,
        },
      },
    });
    return;
  }

  try {
    const payload = await fatSecretGet("/rest/food/v4", {
      food_id: foodId,
      flag_default_serving: "true",
    });

    sendJson(response, 200, {
      provider: "fatsecret",
      food: payload.food,
    });
  } catch (error) {
    sendJson(response, 502, { error: error.message });
  }
}

async function handleBarcodeLookup(barcode, response) {
  const normalizedBarcode = String(barcode || "").trim();
  if (!normalizedBarcode) {
    sendJson(response, 400, { error: "Barcode is required." });
    return;
  }

  try {
    const endpoint = new URL(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(normalizedBarcode)}.json`);
    endpoint.searchParams.set(
      "fields",
      [
        "code",
        "status",
        "status_verbose",
        "id",
        "product_name",
        "generic_name",
        "brands",
        "quantity",
        "categories",
        "serving_size",
        "serving_quantity",
        "nutriments",
      ].join(",")
    );
    const payloadResponse = await fetchWithTlsFallback(endpoint, {
      headers: {
        "User-Agent": "DualFit/0.1 (barcode lookup)",
      },
    });

    if (!payloadResponse.ok) {
      const errorText = await payloadResponse.text();
      throw new Error(`Open Food Facts request failed (${payloadResponse.status}): ${errorText}`);
    }

    const payload = await payloadResponse.json();
    sendJson(response, 200, payload);
  } catch (error) {
    logDedupedAppError(`barcode:${normalizedBarcode}:${error.message}`, {
      source: "barcode",
      action: "openfoodfacts-lookup",
      userMessage: "Barcode lookup failed.",
      error,
      details: { barcode: normalizedBarcode },
    });
    sendJson(response, 502, { error: error.message || "Barcode lookup failed." });
  }
}

function serveStaticFile(requestUrl, response) {
  const relativePath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const safePath = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]+/, "");
  const filePath = path.join(__dirname, safePath);

  if (!filePath.startsWith(__dirname)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, fileBuffer) => {
    if (error) {
      sendText(response, 404, "Not found");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": mimeTypes[extension] || "application/octet-stream",
      "Access-Control-Allow-Origin": "*",
    });
    response.end(fileBuffer);
  });
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    });
    response.end();
    return;
  }

  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  if (requestUrl.pathname === "/api/fatsecret/search") {
    await handleFoodSearch(requestUrl, response);
    return;
  }

  if (requestUrl.pathname.startsWith("/api/fatsecret/food/")) {
    const foodId = decodeURIComponent(requestUrl.pathname.slice("/api/fatsecret/food/".length));
    await handleFoodDetail(foodId, response);
    return;
  }

  if (requestUrl.pathname === "/api/fatsecret/health") {
    sendJson(response, 200, {
      configured: Boolean(FATSECRET_CLIENT_ID && FATSECRET_CLIENT_SECRET),
      fallbackEnabled: USE_SAMPLE_FALLBACK,
    });
    return;
  }

  if (requestUrl.pathname.startsWith("/api/barcode/")) {
    const barcode = decodeURIComponent(requestUrl.pathname.slice("/api/barcode/".length));
    await handleBarcodeLookup(barcode, response);
    return;
  }

  serveStaticFile(requestUrl, response);
});

server.listen(PORT, HOST, () => {
  const localUrl = `http://localhost:${PORT}`;
  const lanUrls = getLanUrls(PORT);
  console.log(`MassTrack server running at ${localUrl}`);

  if (HOST === "0.0.0.0" || HOST === "::") {
    lanUrls.forEach((url) => {
      console.log(`MassTrack LAN URL: ${url}`);
    });
  }
});
