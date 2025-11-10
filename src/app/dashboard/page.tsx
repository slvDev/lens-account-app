// src/app/dashboard/page.tsx
"use client";

import { useLensAccount } from "@/contexts/LensAccountContext";
import { useAccount, useDisconnect } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AccountTokensDisplay } from "@/components/AccountTokensDisplay";
import { WcConnect } from "@/components/WcConnect";
import { WcRequestDisplay } from "@/components/WcRequestDisplay";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import { AccountIdentityPanel } from "@/components/dashboard/AccountIdentityPanel";
import { OwnerPanel } from "@/components/dashboard/OwnerPanel";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline"; // For logout icon
import { useWalletConnect } from "@/contexts/WalletConnectProvider";

export default function Dashboard() {
  const { lensAccountAddress, ownerAddress, clearAccount } = useLensAccount();
  const { isConnected } = useAccount();
  const { disconnect: disconnectOwnerWallet } = useDisconnect();
  const router = useRouter();
  const { activeSessions } = useWalletConnect();

  const hasActiveSessions = Object.keys(activeSessions).length > 0;

  useEffect(() => {
    if (!isConnected || !lensAccountAddress || !ownerAddress) {
      clearAccount();
      router.push("/");
    }
  }, [isConnected, lensAccountAddress, ownerAddress, router, clearAccount]);

  const handleLogout = () => {
    disconnectOwnerWallet();
    clearAccount();
    // Clear localStorage on explicit logout
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.LENS_ACCOUNT_ADDRESS);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.EXPECTED_OWNER_ADDRESS);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.LENS_USERNAME);
      console.log("Cleared localStorage on logout.");
    } catch (error) {
      console.error("Failed to clear localStorage on logout:", error);
    }
    router.push("/");
  };

  if (!isConnected || !lensAccountAddress || !ownerAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-text-secondary">Loading or redirecting...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6 md:p-10 flex flex-col">
      {/* Header Area */}
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center w-full">
        <h1 className="text-3xl md:text-4xl font-normal text-foreground tracking-tight">Lens Account Dashboard</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-card-background border border-border-subtle text-text-primary text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-text-primary transition-colors"
        >
          <ArrowRightStartOnRectangleIcon className="w-4 h-4 text-text-secondary" />
          Logout
        </button>
      </div>

      {/* Main Grid for Panels */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Panel 1: Account Identity */}
        <div className="col-span-1 md:col-span-2 bg-card-background p-8 rounded-lg border border-border-subtle">
          <AccountIdentityPanel />
        </div>

        {/* Panel 2: Owner Info */}
        <div className="col-span-1 bg-card-background p-8 rounded-lg border border-border-subtle">
          <OwnerPanel ownerAddress={ownerAddress} />
        </div>

        {/* Panel 3: Balances */}
        <div className="col-span-1 bg-card-background p-8 rounded-lg border border-border-subtle">
          <h2 className="text-xl font-medium mb-6 text-text-primary">Account Balances</h2>
          <AccountTokensDisplay />
        </div>

        {/* Panel 4: WalletConnect Connect */}
        <div className="col-span-1 md:col-span-2 bg-card-background p-8 rounded-lg border border-border-subtle">
          <WcConnect />
        </div>

        {/* Panel 5: WalletConnect Requests - Only show when sessions exist */}
        {hasActiveSessions && (
          <div className="col-span-1 md:col-span-2 bg-card-background p-0 rounded-lg border border-border-subtle overflow-hidden">
            <WcRequestDisplay />
          </div>
        )}
      </div>

      {/* Footer matching Lens ref style */}
      <footer className="max-w-7xl w-full mx-auto mt-16 mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-secondary">
          <div className="flex items-center gap-4">
            <span>© 2025 Lens Labs</span>
            <a href="https://www.lens.xyz/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition-colors">
              Privacy
            </a>
            <a href="https://www.lens.xyz/terms" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition-colors">
              Terms
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/vicnaum/lens-account-app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text-primary transition-colors"
            >
              Developers
            </a>
            <a href="https://fkng.social" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition-colors">
              FKNG.SOCIAL
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
