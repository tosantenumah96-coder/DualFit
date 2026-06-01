const { buildSupabaseHeaders, buildSupabaseUrl } = require("./supabase-config");

const parseErrorPayload = async (response) => {
  try {
    return await response.json();
  } catch (_error) {
    return { message: await response.text() };
  }
};

const requestSupabase = async (path, options = {}) => {
  const { accessToken, headers = {}, ...restOptions } = options;
  const response = await fetch(buildSupabaseUrl(path), {
    ...restOptions,
    headers: buildSupabaseHeaders(accessToken, headers),
  });

  if (!response.ok) {
    const payload = await parseErrorPayload(response);
    const message = payload?.message || payload?.error_description || payload?.error || "Supabase request failed";
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const encodeFilterValue = (value) => encodeURIComponent(String(value));

const selectRows = async (table, accessToken, query = "") => {
  const search = query ? `&${query}` : "";
  return requestSupabase(`/rest/v1/${table}?select=*${search}`, {
    accessToken,
    method: "GET",
  });
};

const upsertRows = async (table, rows, accessToken, conflictColumns = "") => {
  return requestSupabase(`/rest/v1/${table}${conflictColumns ? `?on_conflict=${conflictColumns}` : ""}`, {
    accessToken,
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  });
};

const deleteRows = async (table, accessToken, filters = {}) => {
  const filterEntries = Object.entries(filters);
  const query =
    filterEntries.length === 0
      ? ""
      : `?${filterEntries
          .map(([key, value]) => `${key}=eq.${encodeFilterValue(value)}`)
          .join("&")}`;

  return requestSupabase(`/rest/v1/${table}${query}`, {
    accessToken,
    method: "DELETE",
    headers: {
      Prefer: "return=representation",
    },
  });
};

module.exports = {
  requestSupabase,
  selectRows,
  upsertRows,
  deleteRows,
};
