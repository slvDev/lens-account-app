// src/app/dashboard/layout.tsx
"use client"; // Context providers require client components

// This layout wraps the content of `/dashboard/page.tsx` and any other
// potential pages under the /dashboard route (e.g., /dashboard/settings).

// Add the default export
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // All providers are now handled at the root level in src/app/providers.tsx
  // including WalletConnectProvider, so we just pass through the children
  return <>{children}</>;
}
