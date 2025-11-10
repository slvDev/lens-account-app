// src/components/WcConnect.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useWalletConnect } from "@/contexts/WalletConnectProvider";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { StatusCard } from "@/components/shared/StatusCard";
import { LinkIcon } from "@heroicons/react/24/outline";

// Token/dApp icon size constant
const DAPP_ICON_SIZE = 48;

// Default/Fallback Icon
const FallbackIcon = () => (
  <div
    className="rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs"
    style={{ width: `${DAPP_ICON_SIZE}px`, height: `${DAPP_ICON_SIZE}px` }}
  >
    ?
  </div>
);

// Helper function to resolve icon URL
const resolveIconUrl = (iconPath: string | null | undefined, baseUrl: string | null | undefined): string | undefined => {
  if (!iconPath) return undefined;

  try {
    // Handle absolute URLs
    if (iconPath.startsWith("http://") || iconPath.startsWith("https://")) {
      return iconPath;
    }
    // Handle root-relative paths if base URL exists
    if (iconPath.startsWith("/") && baseUrl) {
      const origin = new URL(baseUrl).origin;
      return `${origin}${iconPath}`;
    }
    console.warn("Invalid icon URL format:", iconPath);
    return undefined;
  } catch (e) {
    console.warn("Error resolving icon URL:", e);
    return undefined;
  }
};

// Icon component with error handling
const DAppIcon = ({ iconUrl, name }: { iconUrl?: string; name: string }) => {
  const [hasError, setHasError] = useState(false);

  if (!iconUrl || hasError) return <FallbackIcon />;

  return (
    <Image
      src={iconUrl}
      alt={`${name} icon`}
      width={DAPP_ICON_SIZE}
      height={DAPP_ICON_SIZE}
      className="rounded-full pointer-events-none"
      unoptimized
      onError={() => {
        console.warn("Failed to load icon:", iconUrl);
        setHasError(true);
      }}
    />
  );
};

// Animation variants for individual cards
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      type: "spring" as const,
      stiffness: 260,
      damping: 20,
    },
  },
};

export function WcConnect() {
  const {
    activeSessions,
    pair,
    disconnect,
    isLoading,
    isPairing,
    error,
    isInitialized,
    pendingProposal,
    approveSession,
    rejectSession,
    isInitializing,
  } = useWalletConnect();
  const [uri, setUri] = useState("");

  const activeSessionTopic = Object.keys(activeSessions)[0];
  const connectedSession = activeSessionTopic ? activeSessions[activeSessionTopic] : null;

  useEffect(() => {
    if (!connectedSession) {
      setUri("");
    }
  }, [connectedSession]);

  const handleConnect = () => {
    if (!uri || !isInitialized || isLoading) return;
    pair(uri);
  };

  const handleDisconnect = () => {
    if (connectedSession && isInitialized && !isLoading) {
      disconnect(connectedSession.topic);
    }
  };

  const handleApprove = () => {
    if (pendingProposal && !isLoading) {
      approveSession();
    }
  };

  const handleReject = () => {
    if (pendingProposal && !isLoading) {
      rejectSession();
    }
  };

  const connectButtonText = isPairing ? "Pairing..." : isLoading ? "Working..." : "Connect";
  const disconnectButtonText = isLoading ? "Working..." : "Disconnect";
  const approveButtonText = isLoading ? "Working..." : "Approve";
  const rejectButtonText = isLoading ? "Working..." : "Reject";

  // Resolve icon URLs
  const connectedDAppIconUrl = connectedSession
    ? resolveIconUrl(connectedSession.peer.metadata.icons?.[0] ?? undefined, connectedSession.peer.metadata.url ?? undefined)
    : undefined;

  const proposalIconUrl = pendingProposal
    ? resolveIconUrl(pendingProposal.params.proposer.metadata.icons?.[0] ?? undefined, pendingProposal.params.proposer.metadata.url ?? undefined)
    : undefined;

  return (
    <motion.div layout className="w-full space-y-4">
      <AnimatePresence mode="wait">
        {/* --- Session Proposal Card --- */}
        {pendingProposal && (
          <motion.div
            key="proposal"
            layout
            className="bg-gray-50 w-full rounded-3xl p-3 border-2 border-orange-200"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <DAppIcon iconUrl={proposalIconUrl} name={pendingProposal.params.proposer.metadata.name} />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <p className="text-xs text-orange-600 font-medium">Connection Request</p>
                <p className="text-base font-medium text-foreground">{pendingProposal.params.proposer.metadata.name}</p>
                {pendingProposal.params.proposer.metadata.description && (
                  <p className="text-xs text-gray-600">{pendingProposal.params.proposer.metadata.description}</p>
                )}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleApprove}
                disabled={isLoading || !isInitialized}
                className="flex-1 px-4 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              >
                {approveButtonText}
              </button>
              <button
                onClick={handleReject}
                disabled={isLoading || !isInitialized}
                className="flex-1 px-4 py-2 bg-white text-text-secondary border border-gray-200 text-xs font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-text-primary disabled:opacity-50 transition-colors duration-150"
              >
                {rejectButtonText}
              </button>
            </div>
          </motion.div>
        )}

        {/* --- Connected Session Card --- */}
        {connectedSession && !pendingProposal && (
          <motion.div
            key="connected"
            layout
            className="bg-gray-50 w-full rounded-3xl p-3 border-2 border-green-200"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <DAppIcon iconUrl={connectedDAppIconUrl} name={connectedSession.peer.metadata.name} />
                </motion.div>
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <p className="text-xs text-green-600 font-medium">Connected to</p>
                <p className="text-base font-medium text-foreground">{connectedSession.peer.metadata.name}</p>
                <p className="text-xs text-gray-600 truncate">{connectedSession.peer.metadata.url}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDisconnect}
                  disabled={isLoading || !isInitialized}
                  className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {disconnectButtonText}
                </button>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Topic: <span className="font-mono text-[10px] break-all">{connectedSession.topic}</span>
              </p>
            </div>
          </motion.div>
        )}

        {/* --- Connection Form Card --- */}
        {!connectedSession && !pendingProposal && (
          <motion.div
            key="form"
            layout
            className="bg-gray-50 w-full rounded-3xl p-3"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <LinkIcon className="w-12 h-12 text-gray-400" />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <p className="text-xs text-text-secondary">dApp Connection</p>
                <p className="text-base text-foreground">No active session</p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <input
                id="wc-uri"
                name="wc-uri"
                type="text"
                value={uri}
                onChange={(e) => setUri(e.target.value)}
                placeholder="Paste WalletConnect URI (wc:...)"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:ring-1 focus:ring-text-primary focus:border-text-primary transition duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={isLoading || !isInitialized}
              />
              <button
                onClick={handleConnect}
                disabled={!uri || isLoading || !isInitialized}
                className="w-full px-4 py-2 bg-button-primary-bg text-button-primary-text text-sm font-medium rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              >
                {connectButtonText}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Status/Error Messages using StatusCard --- */}
      <AnimatePresence>
        {error && !isLoading && <StatusCard variant="error" message={`Error: ${error}`} />}
        {isPairing && <StatusCard variant="loading" message="Pairing initiated, check dApp/wallet if needed..." />}
        {!isInitialized && !isInitializing && !error && <StatusCard variant="warning" message="WalletConnect service not ready." />}
        {isInitializing && <StatusCard variant="loading" message="Initializing WalletConnect..." />}
      </AnimatePresence>
    </motion.div>
  );
}
