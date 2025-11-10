"use client";

import { DocumentDuplicateIcon, QrCodeIcon, CheckIcon } from "@heroicons/react/24/outline";
import { ArrowTopRightOnSquareIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { QrCodeModal } from "@/components/modals/QrCodeModal";
import { motion, AnimatePresence } from "framer-motion";
import { shortAddress } from "@/lib";
import { useLensAccount } from "@/contexts/LensAccountContext";

export function AccountIdentityPanel() {
  const { lensAccountAddress, profileMetadata } = useLensAccount();
  const [copied, setCopied] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const handleCopy = async () => {
    try {
      if (!lensAccountAddress) return;
      await navigator.clipboard.writeText(lensAccountAddress);
      setCopied(true);
      console.log("Address copied to clipboard:", lensAccountAddress);
      // Reset icon after a short delay
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address: ", err);
      alert("Failed to copy address."); // Simple error feedback
    }
  };

  const handleShowQr = () => {
    setIsQrModalOpen(true);
    console.log("Showing QR code modal for:", lensAccountAddress);
  };

  const handleCloseQr = () => {
    setIsQrModalOpen(false);
  };

  const handleOpenExplorer = () => {
    window.open(`https://explorer.lens.xyz/address/${lensAccountAddress}`, "_blank");
  };

  if (!lensAccountAddress) return null;

  return (
    <div className="bg-gray-50 w-full rounded-3xl p-3">
      <motion.div
        className="flex items-center gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0, duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Avatar/Image */}
        <div className="flex-shrink-0">
          {profileMetadata?.avatar ? (
            <img src={profileMetadata.avatar} alt={profileMetadata.handle || "Account"} className="w-18 h-18 rounded-xl object-cover" />
          ) : (
            <UserCircleIcon className="w-12 h-12 text-gray-400" />
          )}
        </div>

        {/* Address column */}
        <div className="flex-1 flex flex-col">
          <p className="text-xs text-text-secondary">Lens account</p>
          <p className="text-base font-mono text-foreground select-all">{shortAddress(lensAccountAddress)}</p>
        </div>

        {/* Action buttons group */}
        <div className="flex items-center gap-1 mt-1">
          <motion.button
            onClick={handleOpenExplorer}
            title="View on Explorer"
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-white rounded-lg transition-all duration-150 hover:shadow-sm cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          </motion.button>

          <AnimatePresence mode="wait">
            {copied ? (
              <motion.button
                key="check"
                title="Copied!"
                className="p-2 text-green-600 bg-green-50 rounded-lg cursor-pointer"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2, type: "spring", stiffness: 400, damping: 15 }}
              >
                <motion.div
                  initial={{ rotate: -180 }}
                  animate={{ rotate: 0 }}
                  transition={{ duration: 0.3, type: "spring", stiffness: 260, damping: 20 }}
                >
                  <CheckIcon className="w-4 h-4" />
                </motion.div>
              </motion.button>
            ) : (
              <motion.button
                key="copy"
                onClick={handleCopy}
                title="Copy Address"
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-white rounded-lg transition-all duration-150 hover:shadow-sm cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <DocumentDuplicateIcon className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>

          <motion.button
            onClick={handleShowQr}
            title="Show QR Code"
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-white rounded-lg transition-all duration-150 hover:shadow-sm cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <QrCodeIcon className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* Render the QR modal */}
      <QrCodeModal address={lensAccountAddress} isOpen={isQrModalOpen} onClose={handleCloseQr} />
    </div>
  );
}
