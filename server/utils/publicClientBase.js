const os = require("os");

function getLocalIPv4() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net && net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "";
}

function getPublicClientBaseUrl() {
  const configured = String(process.env.PUBLIC_CLIENT_BASE_URL || "").trim();
  if (configured) {
    try {
      const u = new URL(configured);
      const host = String(u.hostname || "").trim();
      if (host && host !== "localhost" && host !== "127.0.0.1") {
        return configured.replace(/\/+$/, "");
      }
      // If someone configured localhost, it will break mobile QR links.
      // Fall through to LAN IP detection.
    } catch {
      // If it's not a valid URL, fall through to LAN IP detection.
    }
  }

  const ip = getLocalIPv4();
  if (!ip) return "";

  const port = String(process.env.PUBLIC_CLIENT_PORT || "5174").trim();
  const protocol = String(process.env.PUBLIC_CLIENT_PROTOCOL || "http").trim();
  return `${protocol}://${ip}${port ? `:${port}` : ""}`;
}

module.exports = { getPublicClientBaseUrl };
