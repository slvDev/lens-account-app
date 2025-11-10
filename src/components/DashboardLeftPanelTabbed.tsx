// src/components/DashboardLeftPanelTabbed.tsx
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
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { UserCircleIcon, CurrencyDollarIcon, LinkIcon } from "@heroicons/react/24/outline";
type TabId = "manage" | "balances" | "dapps";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: Tab[] = [
  { id: "manage", label: "Manage", icon: UserCircleIcon },
  { id: "balances", label: "Balances", icon: CurrencyDollarIcon },
  { id: "dapps", label: "dApps", icon: LinkIcon },
];

export function DashboardLeftPanelTabbed({ onLogout }: { onLogout: () => void }) {
  const { lensAccountAddress, ownerAddress } = useLensAccount();
  const { isConnected } = useAccount();
  const [lensUsername, setLensUsername] = useState<string | null>(null);
  const { activeSessions } = useWalletConnect();
  const [activeTab, setActiveTab] = useState<TabId>("manage");

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

  return (
    <motion.div className="h-full flex flex-col gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <DashboardHeader onLogout={onLogout} />

      {/* Tab Navigation */}
      <nav className="w-full flex justify-center flex-shrink-0">
        <ul className="flex items-center" role="tablist">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <li key={tab.id} role="presentation" className="flex items-center">
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-1 text-sm font-medium cursor-pointer
                    transition-all duration-150
                    ${isActive ? "text-foreground" : "text-gray-400 hover:text-gray-600"}
                  `}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.id}`}
                >
                  <div
                    className={`
                    w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150
                    ${isActive ? "bg-primary" : "bg-gray-100"}
                  `}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : null}`} />
                  </div>
                  <span>{tab.label}</span>
                </button>

                {/* Divider */}
                {index < tabs.length - 1 && <div className="mx-4 h-4 w-px bg-gray-300" />}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Tab Content */}
      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {activeTab === "manage" && (
            <LayoutGroup>
              <motion.div
                key="manage"
                role="tabpanel"
                id="tabpanel-manage"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 260, damping: 20 }}
                className="w-full flex flex-col items-center justify-center gap-6"
              >
                {/* Account Identity */}
                <motion.div layout className="w-[60%]">
                  <AccountIdentityPanel />
                </motion.div>

                {/* Owner Panel */}
                <motion.div layout className="w-[60%]">
                  <OwnerPanel ownerAddress={ownerAddress} />
                </motion.div>
              </motion.div>
            </LayoutGroup>
          )}

          {activeTab === "balances" && (
            <motion.div
              key="balances"
              role="tabpanel"
              id="tabpanel-balances"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 260, damping: 20 }}
              className="w-full flex flex-col justify-center"
            >
              <AccountTokensDisplay />
            </motion.div>
          )}

          {activeTab === "dapps" && (
            <LayoutGroup>
              <motion.div
                key="dapps"
                role="tabpanel"
                id="tabpanel-dapps"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 260, damping: 20 }}
                className="w-full flex flex-col items-center justify-center gap-4"
              >
                <motion.div layout className="w-[70%]">
                  <WcConnect />
                </motion.div>
                {hasActiveSessions && (
                  <motion.div layout className="w-[70%]">
                    <WcRequestDisplay />
                  </motion.div>
                )}
              </motion.div>
            </LayoutGroup>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
