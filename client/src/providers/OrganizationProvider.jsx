import { createContext, useEffect, useMemo, useState } from "react";
import API, { setOrganizationId } from "../api/api";
import { useAuth } from "../hooks/useAuth";

export const OrganizationContext = createContext(null);

const LS_KEY = "mom.organizationId";

export default function OrganizationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [activeOrganizationId, setActiveOrganizationId] = useState(
    () => localStorage.getItem(LS_KEY) || ""
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setOrganizationId(activeOrganizationId);
  }, [activeOrganizationId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isAuthenticated) {
        setOrganizations([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await API.get("/organizations");
        const items = Array.isArray(res.data) ? res.data : [];
        if (cancelled) return;
        setOrganizations(items);
        const firstId = items?.[0]?.organization?._id || "";
        const currentOk = activeOrganizationId && items.some((w) => w?.organization?._id === activeOrganizationId);
        const nextId = currentOk ? activeOrganizationId : firstId;
        setActiveOrganizationId(nextId);
        if (nextId) localStorage.setItem(LS_KEY, nextId);
      } catch {
        if (!cancelled) setOrganizations([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const value = useMemo(
    () => ({
      organizations,
      activeOrganizationId,
      setActiveOrganizationId,
      loading,
      async createOrganization(name) {
        const res = await API.post("/organizations", { name });
        const created = res.data;
        setOrganizations((prev) => [created, ...prev]);
        const id = created?.organization?._id;
        if (id) setActiveOrganizationId(id);
        return created;
      },
    }),
    [organizations, activeOrganizationId, loading]
  );

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

