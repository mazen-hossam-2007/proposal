// ============================================================
// SECRET PASSWORD-PROTECTED ADMIN CONFIGURATION:
// ============================================================
export const ADMIN_CONFIG = {
  // Session token storage key
  tokenStorageKey: "admin_auth_token",

  // Local storage key for offline client backup
  storageKey: "jana_confirmed_date_ticket",

  // Secret URL triggers
  secretHash: "#admin",
  secretQueryParam: "admin",
};
