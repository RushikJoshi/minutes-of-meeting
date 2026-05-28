import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import API from "../api/api";
import IntegrationCard from "../components/IntegrationCard";

export default function Settings() {
  const [ms, setMs] = useState({ connected: false });
  const [google, setGoogle] = useState({ connected: false });
  const [apiKeys, setApiKeys] = useState([]);
  const [newKeyData, setNewKeyData] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const [msRes, googleRes, apiKeysRes] = await Promise.all([
        API.get("/integrations/microsoft/status"),
        API.get("/integrations/google/status"),
        API.get("/apikeys")
      ]);
      setMs(msRes.data || { connected: false });
      setGoogle(googleRes.data || { connected: false });
      setApiKeys(apiKeysRes.data?.data || []);
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

  const handleGenerateApiKey = async () => {
    if (!newKeyName.trim()) return;
    try {
      const res = await API.post("/apikeys", { name: newKeyName });
      setNewKeyData(res.data.data);
      toast.success("API Key generated!");
      setShowCreateModal(false);
      setNewKeyName("");
      refresh();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to generate API Key");
    }
  };

  const handleRevokeApiKey = async (id) => {
    if (!window.confirm("Are you sure you want to revoke this API Key? Apps using it will immediately lose access.")) return;
    try {
      await API.delete(`/apikeys/${id}`);
      toast.success("API Key revoked");
      refresh();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to revoke API Key");
    }
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

          {/* MASTER API SECTION */}
          <section className="mt-12 border-t border-slate-200 pt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Developer API Keys</h2>
                <p className="text-sm text-slate-500">Generate keys to connect third-party apps to your Minutes of Meeting account.</p>
              </div>
              <button onClick={() => setShowCreateModal(true)} className="btn-primary py-2 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition">
                + Generate New Key
              </button>
            </div>

            {newKeyData && (
              <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-6">
                <h3 className="text-lg font-bold text-green-900 mb-2">Save Your API Key Now</h3>
                <p className="text-sm text-green-800 mb-4">This is the only time your API key will be shown. Please copy it and store it safely.</p>
                <div className="flex items-center gap-4 bg-white p-3 rounded border border-green-200">
                  <code className="text-sm font-mono flex-1 select-all">{newKeyData.key}</code>
                  <button onClick={() => { navigator.clipboard.writeText(newKeyData.key); toast.success("Copied!"); }} className="text-sm text-blue-600 font-medium hover:underline">
                    Copy
                  </button>
                </div>
                <button onClick={() => setNewKeyData(null)} className="mt-4 text-sm text-green-700 hover:underline">I have saved it</button>
              </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-3 px-4 font-medium">Name</th>
                    <th className="py-3 px-4 font-medium">Created On</th>
                    <th className="py-3 px-4 font-medium">Last Used</th>
                    <th className="py-3 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {apiKeys.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-slate-500">No API Keys generated yet.</td>
                    </tr>
                  ) : (
                    apiKeys.map(key => (
                      <tr key={key._id}>
                        <td className="py-3 px-4 font-medium text-slate-900">{key.name}</td>
                        <td className="py-3 px-4 text-slate-500">{new Date(key.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-slate-500">{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"}</td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => handleRevokeApiKey(key._id)} className="text-red-600 hover:text-red-800 font-medium hover:underline">Revoke</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {/* CREATE API KEY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-xl font-bold text-slate-900">Generate API Key</h3>
            <p className="mb-4 text-sm text-slate-500">
              Enter a name to identify this API Key (e.g., 'HRMS System', 'Mobile App').
            </p>
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Enter key name..."
              className="mb-6 w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewKeyName("");
                }}
                className="rounded-lg px-4 py-2 text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateApiKey}
                disabled={!newKeyName.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Generate Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
