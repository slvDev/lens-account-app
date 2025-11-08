// src/components/OwnerVerificationSection.tsx
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type Address, isAddress } from "viem";
import { ArrowPathIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { OwnerInfoCard } from "./OwnerInfoCard";
import { ConnectionControls } from "./ConnectionControls";

interface OwnerVerificationSectionProps {
  lensAccountAddress: Address | "";
  expectedOwner: Address | null;
  isLoadingOwner: boolean;
  ownerFetchError: string | null;
  verificationError: string | null;
  isConnected: boolean;
  connectedChainId: number | undefined;
  lensChainId: number;
  onClear: () => void;
}

export function OwnerVerificationSection({
  lensAccountAddress,
  expectedOwner,
  isLoadingOwner,
  ownerFetchError,
  verificationError,
  isConnected,
  connectedChainId,
  lensChainId,
  onClear,
}: OwnerVerificationSectionProps) {
  return (
    <AnimatePresence mode="wait">
      {isAddress(lensAccountAddress) && (
        <div className="space-y-6">
          {/* Loading State */}
          {isLoadingOwner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 text-sm font-medium text-text-secondary py-4"
            >
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
              <span>Fetching account owner...</span>
            </motion.div>
          )}

          {/* Error State */}
          {ownerFetchError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-sm text-red-600 mt-2"
            >
              <ExclamationTriangleIcon className="w-4 h-4" />
              <span>{ownerFetchError}</span>
            </motion.div>
          )}

          {/* Success State - Owner Info and Controls */}
          {expectedOwner && !isLoadingOwner && !ownerFetchError && (
            <>
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    delay: 0.1,
                    duration: 0.3,
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                  },
                }}
              >
                <OwnerInfoCard ownerAddress={expectedOwner} />
              </motion.div>

              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    delay: 0.2,
                    duration: 0.3,
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                  },
                }}
              >
                <ConnectionControls isConnected={isConnected} connectedChainId={connectedChainId} expectedChainId={lensChainId} onClear={onClear} />
              </motion.div>
            </>
          )}

          {/* Verification Error */}
          {verificationError && (
            <div className="text-sm text-orange-600 px-3 py-2 bg-orange-50 border border-orange-200 rounded">
              <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" />
              {verificationError}
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
