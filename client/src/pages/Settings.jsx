import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import API from "../api/api";
import IntegrationCard from "../components/IntegrationCard";

export default function Settings() {
  const [ms, setMs] = useState({ connected: false });
  const [google, setGoogle] = useState({ connected: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const [msRes, googleRes] = await Promise.all([
        API.get("/integrations/microsoft/status"),
        API.get("/integrations/google/status"),
      ]);
      setMs(msRes.data || { connected: false });
      setGoogle(googleRes.data || { connected: false });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load integration status.");
      toast.error("Failed to load integrations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();

    // Handle OAuth callback success messages
    if (searchParams.get("google") === "connected") {
      toast.success("Google Calendar connected successfully!");
      setSearchParams({});
    } else if (searchParams.get("microsoft") === "connected") {
      toast.success("Microsoft Outlook connected successfully!");
      setSearchParams({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleConnectGoogle = async () => {
    try {
      const res = await API.get("/integrations/google/connect");
      if (res?.data?.url) window.location.href = res.data.url;
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to start Google connect flow.");
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      await API.post("/integrations/google/disconnect");
      toast.success("Google Calendar disconnected.");
      await refresh();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to disconnect Google.");
    }
  };

  const handleSyncGoogle = async () => {
    const res = await API.post("/integrations/google/sync");
    setGoogle(prev => ({ ...prev, lastSyncedAt: res.data.lastSyncedAt }));
  };

  const handleToggleAutoSyncGoogle = async (_, autoSync) => {
    const res = await API.patch("/integrations/google/preferences", { autoSync });
    setGoogle(prev => ({ ...prev, autoSync: res.data.autoSync }));
  };

  const handleConnectMs = async () => {
    try {
      const res = await API.get("/integrations/microsoft/connect");
      if (res?.data?.url) window.location.href = res.data.url;
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to start Microsoft connect flow.");
    }
  };

  const handleDisconnectMs = async () => {
    try {
      await API.post("/integrations/microsoft/disconnect");
      toast.success("Microsoft Outlook disconnected.");
      await refresh();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to disconnect Microsoft.");
    }
  };

  const handleSyncMs = async () => {
    const res = await API.post("/integrations/microsoft/sync");
    setMs(prev => ({ ...prev, lastSyncedAt: res.data.lastSyncedAt }));
  };

  const handleToggleAutoSyncMs = async (_, autoSync) => {
    const res = await API.patch("/integrations/microsoft/preferences", { autoSync });
    setMs(prev => ({ ...prev, autoSync: res.data.autoSync }));
  };

  return (
    <div className="page-shell">
      <div className="page-container fade-up">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Settings</h1>
          </div>
        </div>

        {error && !error.includes("Missing Microsoft OAuth env vars") && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <section>
            <h2 className="mb-4 text-lg font-bold text-slate-900">Integrations</h2>
            <div className="grid gap-5">
              <IntegrationCard
                id="microsoft"
                name="Microsoft Outlook"
                logoUrl="https://res-1.cdn.office.net/files/fabric-cdn-prod_20230815.002/assets/brand-icons/product/svg/outlook_48x1.svg"
                description="Connect your Microsoft Outlook calendar to schedule meetings and sync events automatically."
                connected={ms.connected}
                connectedAt={ms.connectedAt}
                accountEmail={ms.accountEmail}
                lastSyncedAt={ms.lastSyncedAt}
                autoSync={ms.autoSync}
                loading={loading}
                onConnect={handleConnectMs}
                onDisconnect={handleDisconnectMs}
                onSync={handleSyncMs}
                onToggleAutoSync={handleToggleAutoSyncMs}
              />

              {error && error.includes("Missing Microsoft OAuth env vars") && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <strong>Setup Required:</strong> To enable Microsoft integration, configure{" "}
                  <code>MS_CLIENT_ID</code>, <code>MS_CLIENT_SECRET</code>, and{" "}
                  <code>MS_REDIRECT_URI</code> in your <code>.env</code> file.
                </div>
              )}

              <IntegrationCard
                id="google"
                name="Google Calendar"
                logoUrl="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg"
                description="Connect your Google Calendar to schedule Google Meet meetings directly from MOM."
                connected={google.connected}
                connectedAt={google.connectedAt}
                accountEmail={google.accountEmail}
                lastSyncedAt={google.lastSyncedAt}
                autoSync={google.autoSync}
                loading={loading}
                onConnect={handleConnectGoogle}
                onDisconnect={handleDisconnectGoogle}
                onSync={handleSyncGoogle}
                onToggleAutoSync={handleToggleAutoSyncGoogle}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
