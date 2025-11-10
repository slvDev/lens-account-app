"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useDisconnect } from "wagmi";
import { useLensAccount } from "@/contexts/LensAccountContext";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";

interface DashboardHeaderProps {
  onLogout: () => void;
}

export function DashboardHeader({ onLogout }: DashboardHeaderProps) {
  const { disconnect: disconnectOwnerWallet } = useDisconnect();
  const { clearAccount } = useLensAccount();

  const handleLogout = () => {
    disconnectOwnerWallet();
    clearAccount();

    // Clear localStorage on explicit logout
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.LENS_ACCOUNT_ADDRESS);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.EXPECTED_OWNER_ADDRESS);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.LENS_USERNAME);
    } catch (error) {
      console.error("Failed to clear localStorage on logout:", error);
    }

    onLogout();
  };
  const iconVariants = {
    initial: { x: 0 },
    hover: { x: -5 },
  };

  return (
    <motion.header
      className="px-6 py-4 border-b border-gray-200"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
    >
      <motion.button
        onClick={handleLogout}
        className="flex items-center gap-2 text-gray-400 text-sm font-medium rounded-lg hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-text-primary transition-all duration-150 cursor-pointer"
        initial="initial"
        whileHover="hover"
      >
        <motion.div className="w-4 h-4" variants={iconVariants} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
          <ArrowLeftIcon className="w-4 h-4" />
        </motion.div>
        Logout
      </motion.button>
    </motion.header>
  );
}
