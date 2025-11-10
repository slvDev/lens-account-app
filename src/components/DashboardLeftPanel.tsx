// src/components/DashboardLeftPanel.tsx
"use client";

import { useLensAccount } from "@/contexts/LensAccountContext";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { AccountTokensDisplay } from "@/components/AccountTokensDisplay";
import { WcConnect } from "@/components/WcConnect";
import { WcRequestDisplay } from "@/components/WcRequestDisplay";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import { AccountIdentityPanel } from "@/components/dashboard/AccountIdentityPanel";
import { OwnerPanel } from "@/components/dashboard/OwnerPanel";
import { useWalletConnect } from "@/contexts/WalletConnectProvider";
import { motion } from "framer-motion";
import { DashboardHeader } from "./dashboard/DashboardHeader";

export function DashboardLeftPanel({ onLogout }: { onLogout: () => void }) {
  const { lensAccountAddress, ownerAddress } = useLensAccount();
  const { isConnected } = useAccount();
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

  if (!isConnected || !lensAccountAddress || !ownerAddress) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-secondary">Loading or redirecting...</p>
      </div>
    );
  }

  // Animation variants for staggered fade-in
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        type: "spring",
        stiffness: 260,
        damping: 20,
      },
    },
  };

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <DashboardHeader onLogout={onLogout} />
      {/* Panel 1: Account Identity */}
      <motion.div
        className="bg-white p-8 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-200"
        variants={itemVariants}
      >
        <AccountIdentityPanel username={lensUsername} address={lensAccountAddress} />
      </motion.div>

      {/* Panel 2: Owner Info */}
      <motion.div
        className="bg-white p-8 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-200"
        variants={itemVariants}
      >
        <OwnerPanel ownerAddress={ownerAddress} />
      </motion.div>

      {/* Panel 3: Balances */}
      <motion.div
        className="bg-white p-8 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-200"
        variants={itemVariants}
      >
        <h2 className="text-xl font-medium mb-6 text-text-primary">Account Balances</h2>
        <AccountTokensDisplay />
      </motion.div>

      {/* Panel 4: WalletConnect Connect */}
      <motion.div
        className="bg-white p-8 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-200"
        variants={itemVariants}
      >
        <WcConnect />
      </motion.div>

      {/* Panel 5: WalletConnect Requests - Only show when sessions exist */}
      {hasActiveSessions && (
        <motion.div
          className="bg-white p-0 rounded-2xl border border-gray-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200"
          variants={itemVariants}
        >
          <WcRequestDisplay />
        </motion.div>
      )}
    </motion.div>
  );
}
