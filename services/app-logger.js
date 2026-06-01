function normalizeError(error) {
  if (!error) {
    return null;
  }

  return {
    name: error.name || "Error",
    message: error.message || String(error),
    stack: error.stack || null,
  };
}

function logAppEvent(level, payload) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    source: payload?.source || "app",
    action: payload?.action || "unknown",
    userMessage: payload?.userMessage || "",
    details: payload?.details || null,
    error: normalizeError(payload?.error),
  };

  const message = `[${entry.source}] ${entry.action}`;
  if (level === "error") {
    console.error(message, entry);
  } else if (level === "warn") {
    console.warn(message, entry);
  } else {
    console.log(message, entry);
  }

  return entry;
}

function logAppError(payload) {
  return logAppEvent("error", payload);
}

function logAppWarning(payload) {
  return logAppEvent("warn", payload);
}

function logAppInfo(payload) {
  return logAppEvent("info", payload);
}

module.exports = {
  logAppError,
  logAppWarning,
  logAppInfo,
};
