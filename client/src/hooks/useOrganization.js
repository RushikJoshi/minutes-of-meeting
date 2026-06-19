import { useContext } from "react";
import { OrganizationContext } from "../providers/OrganizationProvider";

export function useOrganization() {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error("useOrganization must be used within OrganizationProvider");
  return ctx;
}

