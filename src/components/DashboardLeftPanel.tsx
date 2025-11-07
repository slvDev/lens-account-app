// src/components/DashboardLeftPanel.tsx
"use client";

import { useLensAccount } from "@/contexts/LensAccountContext";
import { useAccount, useDisconnect } from "wagmi";
import { useEffect, useState } from "react";
import { AccountTokensDisplay } from "@/components/AccountTokensDisplay";
import { WcConnect } from "@/components/WcConnect";
import { WcRequestDisplay } from "@/components/WcRequestDisplay";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import { AccountIdentityPanel } from "@/components/dashboard/AccountIdentityPanel";
import { OwnerPanel } from "@/components/dashboard/OwnerPanel";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { useWalletConnect } from "@/contexts/WalletConnectProvider";

interface DashboardLeftPanelProps {
  onLogout: () => void;
}

export function DashboardLeftPanel({ onLogout }: DashboardLeftPanelProps) {
  const { lensAccountAddress, ownerAddress, clearAccount } = useLensAccount();
  const { isConnected } = useAccount();
  const { disconnect: disconnectOwnerWallet } = useDisconnect();
  const [lensUsername, setLensUsername] = useState<string | null>(null);
  const { activeSessions } = useWalletConnect();

  const hasActiveSessions = Object.keys(activeSessions).length > 0;

  useEffect(() => {
    try {
      const storedUsername = localStorage.getItem(LOCAL_STORAGE_KEYS.LENS_USERNAME);
      setLensUsername(storedUsername);
    } catch (error) {
      console.error("Failed to read username from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    if (!isConnected || !lensAccountAddress || !ownerAddress) {
      clearAccount();
      onLogout();
    }
  }, [isConnected, lensAccountAddress, ownerAddress, clearAccount, onLogout]);

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
    onLogout();
  };

  if (!isConnected || !lensAccountAddress || !ownerAddress) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-secondary">Loading or redirecting...</p>
      </div>
    );
  }

  return (
    <>
      {/* Header Area */}
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-normal text-foreground tracking-tight">Lens Account Dashboard</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-card-background border border-border-subtle text-text-primary text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-text-primary transition-colors"
        >
          <ArrowRightStartOnRectangleIcon className="w-4 h-4 text-text-secondary" />
          Logout
        </button>
      </div>

      {/* Panels in vertical stack */}
      <div className="space-y-6">
        {/* Panel 1: Account Identity */}
        <div className="bg-card-background p-6 md:p-8 rounded-lg border border-border-subtle">
          <AccountIdentityPanel username={lensUsername} address={lensAccountAddress} />
        </div>

        {/* Panel 2: Owner Info */}
        <div className="bg-card-background p-6 md:p-8 rounded-lg border border-border-subtle">
          <OwnerPanel ownerAddress={ownerAddress} />
        </div>

        {/* Panel 3: Balances */}
        <div className="bg-card-background p-6 md:p-8 rounded-lg border border-border-subtle">
          <h2 className="text-xl font-medium mb-6 text-text-primary">Account Balances</h2>
          <AccountTokensDisplay />
        </div>

        {/* Panel 4: WalletConnect Connect */}
        <div className="bg-card-background p-6 md:p-8 rounded-lg border border-border-subtle">
          <WcConnect />
        </div>

        {/* Panel 5: WalletConnect Requests - Only show when sessions exist */}
        {hasActiveSessions && (
          <div className="bg-card-background p-0 rounded-lg border border-border-subtle overflow-hidden">
            <WcRequestDisplay />
          </div>
        )}
      </div>
    </>
  );
}
