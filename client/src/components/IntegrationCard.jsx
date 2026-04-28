import React, { useState } from "react";
import { toast } from "react-hot-toast";

export default function IntegrationCard({
  id,
  name,
  logoUrl,
  description,
  connected,
  connectedAt,
  accountEmail,
  lastSyncedAt,
  autoSync,
  loading,
  onConnect,
  onDisconnect,
  onSync,
  onToggleAutoSync,
}) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    if (!onSync) return;
    setSyncing(true);
    try {
      await onSync(id);
      toast.success(`${name} synced successfully.`);
    } catch (error) {
      toast.error(`Failed to sync ${name}.`);
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleAutoSync = async (e) => {
    if (!onToggleAutoSync) return;
    const newValue = e.target.checked;
    try {
      await onToggleAutoSync(id, newValue);
      if (newValue) {
        toast.success(`${name} auto-sync enabled.`);
      } else {
        toast.success(`${name} auto-sync disabled.`);
      }
    } catch (error) {
      toast.error(`Failed to update ${name} auto-sync.`);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
            {logoUrl ? (
              <img src={logoUrl} alt={`${name} logo`} className="h-8 w-8 object-contain" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-slate-200" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">{name}</h3>
              {connected ? (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                  <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-red-500"></span>
                  Disconnected
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">{description}</p>

            {connected && accountEmail && (
              <p className="mt-2 text-sm font-medium text-slate-700">
                Connected as: <span className="font-semibold text-slate-900">{accountEmail}</span>
              </p>
            )}

            {connected && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                {connectedAt && (
                  <span>Connected on {new Date(connectedAt).toLocaleDateString()}</span>
                )}
                {lastSyncedAt && (
                  <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    Last synced: {new Date(lastSyncedAt).toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 sm:flex-shrink-0">
          {connected ? (
            <button
              onClick={onDisconnect}
              disabled={loading}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 w-full sm:w-auto"
            >
              {loading ? "Disconnecting..." : "Disconnect"}
            </button>
          ) : (
            <button
              onClick={onConnect}
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 w-full sm:w-auto"
            >
              {loading ? "Connecting..." : "Connect"}
            </button>
          )}
        </div>
      </div>

      {connected && (
        <div className="mt-5 border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
              checked={autoSync}
              onChange={handleToggleAutoSync}
            />
            <span className="text-sm font-medium text-slate-700">Auto-sync calendar events</span>
          </label>

          <button
            onClick={handleSync}
            disabled={syncing || loading}
            className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? "Syncing..." : "Sync Now"}
          </button>
        </div>
      )}
    </div>
  );
}
