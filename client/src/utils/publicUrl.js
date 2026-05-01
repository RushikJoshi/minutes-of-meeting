export function getPublicFrontendBaseUrl() {
  const configured = import.meta.env.VITE_PUBLIC_FRONTEND_URL;
  if (configured && typeof configured === "string" && configured.trim()) {
    return configured.replace(/\/+$/, "");
  }

  const origin = window.location.origin;
  const hostname = window.location.hostname;

  // If the app is opened on `localhost`, the QR will not work on phones.
  // Try falling back to the API hostname (often configured to a LAN IP / domain).
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    const apiBase = import.meta.env.VITE_API_BASE_URL;
    if (apiBase) {
      try {
        const apiUrl = new URL(apiBase);
        if (apiUrl.hostname && apiUrl.hostname !== "localhost" && apiUrl.hostname !== "127.0.0.1") {
          const port = window.location.port ? `:${window.location.port}` : "";
          return `${window.location.protocol}//${apiUrl.hostname}${port}`;
        }
      } catch {
        // ignore invalid URL
      }
    }
  }

  return origin;
}

