"use client";

import React, { useState } from "react";
import { type Address } from "viem";
import { motion, AnimatePresence } from "framer-motion";
import { DocumentDuplicateIcon, CheckIcon, QrCodeIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { QrCodeModal } from "@/components/modals/QrCodeModal";

interface AddressDisplayProps {
  address: Address;
  showCopy?: boolean;
  showQr?: boolean;
  showExplorer?: boolean;
  explorerUrl?: string;
  className?: string;
  label?: string;
}

export function AddressDisplay({
  address,
  showCopy = true,
  showQr = true,
  showExplorer = true,
  explorerUrl,
  className = "",
  label,
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const defaultExplorerUrl = `https://explorer.lens.xyz/address/${address}`;
  const finalExplorerUrl = explorerUrl || defaultExplorerUrl;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  const handleOpenExplorer = () => {
    window.open(finalExplorerUrl, "_blank");
  };

  return (
    <>
      <motion.div
        className={`bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
      >
        {label && <p className="text-sm text-text-secondary mb-2">{label}</p>}

        <div className="flex items-center space-x-2">
          <p className="text-base font-mono text-foreground break-all flex-1 select-all">{address}</p>

          {/* Action buttons group */}
          <div className="flex items-center space-x-1">
            {showExplorer && (
              <motion.button
                onClick={handleOpenExplorer}
                title="View on Explorer"
                className="p-2.5 text-text-secondary hover:text-text-primary hover:bg-white rounded-lg transition-all duration-150 hover:shadow-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowTopRightOnSquareIcon className="w-5 h-5" />
              </motion.button>
            )}

            {showCopy && (
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.button
                    key="check"
                    title="Copied!"
                    className="p-2.5 text-green-600 bg-green-50 rounded-lg"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{
                      duration: 0.2,
                      type: "spring",
                      stiffness: 400,
                      damping: 15,
                    }}
                  >
                    <motion.div
                      initial={{ rotate: -180 }}
                      animate={{ rotate: 0 }}
                      transition={{
                        duration: 0.3,
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                      }}
                    >
                      <CheckIcon className="w-5 h-5" />
                    </motion.div>
                  </motion.button>
                ) : (
                  <motion.button
                    key="copy"
                    onClick={handleCopy}
                    title="Copy Address"
                    className="p-2.5 text-text-secondary hover:text-text-primary hover:bg-white rounded-lg transition-all duration-150 hover:shadow-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <DocumentDuplicateIcon className="w-5 h-5" />
                  </motion.button>
                )}
              </AnimatePresence>
            )}

            {showQr && (
              <motion.button
                onClick={() => setIsQrModalOpen(true)}
                title="Show QR Code"
                className="p-2.5 text-text-secondary hover:text-text-primary hover:bg-white rounded-lg transition-all duration-150 hover:shadow-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <QrCodeIcon className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* QR Modal */}
      {showQr && <QrCodeModal address={address} isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} />}
    </>
  );
}
