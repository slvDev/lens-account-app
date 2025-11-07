// src/app/page.tsx
"use client";

import { DiscoveryForm } from "@/components/DiscoveryForm";
import { ConnectOwnerButton } from "@/components/ConnectOwnerButton";
import { ProfileCard } from "@/components/ProfileCard";
import { Button } from "@/components/Button";
import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useRouter } from "next/navigation";
import { type Address, isAddress } from "viem";
import { useLensAccount } from "@/contexts/LensAccountContext";
import { LENS_ACCOUNT_ABI, LENS_CHAIN_ID, LOCAL_STORAGE_KEYS } from "@/lib/constants";
import { ArrowPathIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUpWithDelay, fadeInUpStagger } from "@/lib/animations";

export default function Home() {
  // Initialize state with empty defaults (server-renderable)
  const [lensAccountAddress, setLensAccountAddress] = useState<Address | "">("");
  const [lensUsername, setLensUsername] = useState<string>("");

  const [expectedOwner, setExpectedOwner] = useState<Address | null>(null);
  const [ownerFetchError, setOwnerFetchError] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const { address: connectedAddress, chainId: connectedChainId, isConnected, isConnecting, isReconnecting, status } = useAccount();
  const router = useRouter();
  const { setVerifiedAccount, clearAccount: clearContext } = useLensAccount();

  // New useEffect to load from localStorage after component mount
  useEffect(() => {
    // This code only runs on the client after the initial render
    try {
      const storedAddress = localStorage.getItem(LOCAL_STORAGE_KEYS.LENS_ACCOUNT_ADDRESS);
      if (storedAddress && isAddress(storedAddress)) {
        setLensAccountAddress(storedAddress);
      }

      const storedUsername = localStorage.getItem(LOCAL_STORAGE_KEYS.LENS_USERNAME);
      if (storedUsername) {
        setLensUsername(storedUsername);
      }
    } catch (error) {
      console.error("Failed to read session from localStorage on mount:", error);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Updated handler for DiscoveryForm callback
  const handleAccountDetailsFound = (details: { address: Address | ""; username: string }) => {
    console.log("Account Details Updated in Parent:", details);
    setLensAccountAddress(details.address);
    setLensUsername(details.username);
    setExpectedOwner(null);
    setOwnerFetchError(null);
    setVerificationError(null);
    clearContext();
  };

  const {
    data: ownerData,
    error: ownerError,
    isLoading: isLoadingOwner,
  } = useReadContract({
    address: lensAccountAddress || undefined,
    abi: LENS_ACCOUNT_ABI,
    functionName: "owner",
    chainId: LENS_CHAIN_ID,
    query: {
      enabled: isAddress(lensAccountAddress),
    },
  });

  // Effect to update expectedOwner state
  useEffect(() => {
    if (ownerData) {
      setExpectedOwner(ownerData);
      setOwnerFetchError(null);
      console.log("Fetched Expected Owner:", ownerData);
    }
  }, [ownerData]);

  // Effect to handle owner fetch errors
  useEffect(() => {
    if (ownerError) {
      console.error("Error fetching owner:", ownerError);
      setOwnerFetchError("Could not fetch account owner. Ensure the address is correct and on Lens Chain.");
      setExpectedOwner(null);
    } else if (isAddress(lensAccountAddress)) {
      setOwnerFetchError(null);
    }
  }, [ownerError, lensAccountAddress]);

  // Session Restore Effect
  useEffect(() => {
    console.log("Session Restore Check Effect: Running...");
    // Prevent restore logic while connection is initializing/reconnecting
    if (isConnecting || isReconnecting || status !== "connected") {
      console.log("Session Restore Check Effect: Waiting for connection to settle...");
      return;
    }

    // Only attempt restore if the wallet is definitively connected
    if (!connectedAddress) {
      console.log("Session Restore Check Effect: Wallet not connected, skipping restore.");
      // Ensure local storage is cleared if wallet is disconnected but data exists
      try {
        if (localStorage.getItem(LOCAL_STORAGE_KEYS.LENS_ACCOUNT_ADDRESS)) {
          console.log("Session Restore Check Effect: Clearing stale localStorage data as wallet is disconnected.");
          localStorage.removeItem(LOCAL_STORAGE_KEYS.LENS_ACCOUNT_ADDRESS);
          localStorage.removeItem(LOCAL_STORAGE_KEYS.EXPECTED_OWNER_ADDRESS);
          localStorage.removeItem(LOCAL_STORAGE_KEYS.LENS_USERNAME);
        }
      } catch (error) {
        console.error("Failed to clear stale session from localStorage:", error);
      }
      return;
    }

    let storedLensAddress: Address | null = null;
    let storedOwner: Address | null = null;
    let storedUsername: string | null = null;

    try {
      storedLensAddress = localStorage.getItem(LOCAL_STORAGE_KEYS.LENS_ACCOUNT_ADDRESS) as Address | null;
      storedOwner = localStorage.getItem(LOCAL_STORAGE_KEYS.EXPECTED_OWNER_ADDRESS) as Address | null;
      storedUsername = localStorage.getItem(LOCAL_STORAGE_KEYS.LENS_USERNAME);
      console.log("Session Restore Check Effect: Found stored data:", { storedLensAddress, storedOwner, storedUsername });
    } catch (error) {
      console.error("Session Restore Check Effect: Failed to read session from localStorage:", error);
      return;
    }

    // Check if essential data exists and is valid, and matches the connected wallet
    if (
      storedLensAddress &&
      isAddress(storedLensAddress) &&
      storedOwner &&
      isAddress(storedOwner) &&
      connectedAddress.toLowerCase() === storedOwner.toLowerCase()
    ) {
      // Check chain ID
      if (connectedChainId !== LENS_CHAIN_ID) {
        console.log("Session Restore Check Effect: Wallet connected but on wrong chain. Waiting for switch.");
        setVerificationError("Previous session found. Please switch to the Lens Chain.");
        setLensAccountAddress(storedLensAddress);
        setLensUsername(storedUsername || "");
        setExpectedOwner(storedOwner);
        return;
      }

      console.log("Session Restore Check Effect: Valid session found, wallet connected correctly. Restoring session and redirecting...");
      setVerifiedAccount(storedLensAddress, connectedAddress);
      setLensAccountAddress(storedLensAddress);
      setLensUsername(storedUsername || "");
      setExpectedOwner(storedOwner);
      setVerificationError(null);

      router.replace("/dashboard");
    } else {
      console.log("Session Restore Check Effect: No valid stored session found or owner mismatch.");
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.LENS_ACCOUNT_ADDRESS);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.EXPECTED_OWNER_ADDRESS);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.LENS_USERNAME);
      } catch (error) {
        console.error("Failed to clear invalid session data from localStorage:", error);
      }
    }
  }, [status, connectedAddress, connectedChainId, isConnecting, isReconnecting, router, setVerifiedAccount, clearContext]);

  // Effect for Owner Verification and Navigation
  useEffect(() => {
    if (!isConnected || !connectedAddress || !expectedOwner || !isAddress(lensAccountAddress)) {
      return;
    }

    if (connectedChainId !== LENS_CHAIN_ID) {
      setVerificationError("Please switch to the Lens Chain in your wallet.");
      clearContext();
      return;
    }

    if (connectedAddress.toLowerCase() === expectedOwner.toLowerCase()) {
      console.log("Owner verified! Storing session and navigating...");
      setVerificationError(null);

      try {
        localStorage.setItem(LOCAL_STORAGE_KEYS.LENS_ACCOUNT_ADDRESS, lensAccountAddress);
        localStorage.setItem(LOCAL_STORAGE_KEYS.EXPECTED_OWNER_ADDRESS, expectedOwner);
        localStorage.setItem(LOCAL_STORAGE_KEYS.LENS_USERNAME, lensUsername || "");
        console.log("Session data stored in localStorage");
      } catch (error) {
        console.error("Failed to write session to localStorage:", error);
      }

      setVerifiedAccount(lensAccountAddress, connectedAddress);
      router.push("/dashboard");
    } else {
      console.log("Owner mismatch:", { connected: connectedAddress, expected: expectedOwner });
      setVerificationError(`Incorrect owner connected. Please connect with wallet: ${expectedOwner}`);
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.LENS_ACCOUNT_ADDRESS);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.EXPECTED_OWNER_ADDRESS);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.LENS_USERNAME);
      } catch (error) {
        console.error("Failed to clear session from localStorage during mismatch:", error);
      }
      clearContext();
    }
  }, [connectedAddress, connectedChainId, expectedOwner, lensAccountAddress, lensUsername, isConnected, router, setVerifiedAccount, clearContext]);

  const showConnectButton = expectedOwner && !isLoadingOwner && !ownerFetchError;

  // Debug: Log when cards should show/hide
  useEffect(() => {
    console.log("[Page] Animation state:", {
      lensAccountAddress,
      isAddress: isAddress(lensAccountAddress),
      expectedOwner,
      shouldShowCards: isAddress(lensAccountAddress),
    });
  }, [lensAccountAddress, expectedOwner]);

  const handleClear = () => {
    console.log("[Page] Clear button clicked - starting clear sequence");

    // Clear all state
    console.log("[Page] Clearing state: lensAccountAddress, lensUsername, expectedOwner");
    setLensAccountAddress("");
    setLensUsername("");
    setExpectedOwner(null);
    setOwnerFetchError(null);
    setVerificationError(null);

    // Clear localStorage
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.LENS_ACCOUNT_ADDRESS);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.EXPECTED_OWNER_ADDRESS);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.LENS_USERNAME);
      console.log("[Page] localStorage cleared");
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }

    console.log("[Page] Clear complete - AnimatePresence should trigger card exit animations");
  };

  return (
    <main className="flex h-screen bg-background overflow-y-auto">
      {/* Left Column - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen bg-white z-10 border-r border-gray-200 shadow-lg">
        {/* Content wrapper */}
        <div className="flex-1 px-6 md:px-12 lg:px-16 flex items-center justify-center">
          <div className="max-w-lg w-full space-y-8">
            {/* Header with logo and title */}
            <motion.div layout className="flex flex-col items-center gap-8">
              <motion.div layout {...fadeInUpStagger(0)} className="w-[107px] h-[69px] flex items-center justify-center">
                <svg width="107" height="69" viewBox="0 0 107 69" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M86.52 13.8071C81.5327 13.8071 77.0576 15.7971 73.6474 19.0087L73.2969 18.8303C72.5152 8.30345 64.1042 0 53.5635 0C43.0228 0 34.6118 8.30345 33.83 18.8303L33.4796 19.0087C30.0693 15.7971 25.5943 13.8071 20.607 13.8071C9.54059 13.8071 0.563477 22.9477 0.563477 34.2294C0.563477 43.974 10.0663 52.3323 12.4251 54.2538C23.5185 63.2434 37.9681 68.5 53.5635 68.5C69.1588 68.5 83.6085 63.2434 94.7018 54.2538C97.0742 52.3323 106.563 43.9877 106.563 34.2294C106.563 22.9477 97.5864 13.8071 86.5065 13.8071H86.52Z"
                    fill="currentColor"
                  />
                </svg>
              </motion.div>
              <motion.h1 layout {...fadeInUpStagger(0.1)} className="text-4xl font-normal text-foreground tracking-tight">
                Your account awaits.
              </motion.h1>
            </motion.div>

            {/* Form Section */}
            <motion.div layout {...fadeInUpStagger(0.2)} className="w-full space-y-6">
              <DiscoveryForm
                onAccountDetailsFound={handleAccountDetailsFound}
                initialAddress={lensAccountAddress || ""}
                initialUsername={lensUsername || ""}
              />

              {/* Owner Section - Only shows after account is found */}
              <AnimatePresence mode="wait">
                {isAddress(lensAccountAddress) && (
                  <div className="space-y-6">
                    {isLoadingOwner && (
                      <div className="flex items-center justify-center gap-2 text-sm font-medium text-text-secondary py-4">
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        <span>Fetching account owner...</span>
                      </div>
                    )}

                    {ownerFetchError && !isLoadingOwner && (
                      <div className="flex items-center justify-center gap-2 text-sm font-medium text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                        <ExclamationTriangleIcon className="w-5 h-5" />
                        <span>{ownerFetchError}</span>
                      </div>
                    )}

                    {expectedOwner && !isLoadingOwner && !ownerFetchError && (
                      <div className="space-y-6">
                        {/* Owner Info */}
                        <motion.div
                          key="owner-info"
                          {...fadeInUpWithDelay(0.7)}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-5 space-y-3"
                        >
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Account Owner</span>
                            <p className="text-xs font-mono text-text-primary break-all bg-white px-3 py-2 rounded border border-border-subtle">
                              {expectedOwner}
                            </p>
                          </div>
                          <p className="text-xs text-text-secondary">Connect with this wallet to access your account</p>
                        </motion.div>

                        {/* Button Section */}
                        <motion.div key="buttons" {...fadeInUpWithDelay(0.9)} className="flex items-center justify-center gap-3 py-2">
                          <Button onClick={handleClear} variant="secondary" size="md">
                            Clear
                          </Button>
                          {!isConnected && <ConnectOwnerButton />}
                          {isConnected && (
                            <Button variant="primary" size="md" disabled>
                              Connected
                            </Button>
                          )}
                        </motion.div>

                        {isConnected && connectedChainId !== LENS_CHAIN_ID && (
                          <div className="text-center py-2">
                            <p className="text-xs text-orange-600 bg-orange-50 px-4 py-3 rounded-lg border border-orange-200 inline-block">
                              ⚠️ Please switch to Lens Chain in your wallet
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {verificationError && (
                      <div className="flex items-center justify-center gap-2 text-sm font-medium text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                        <ExclamationTriangleIcon className="w-5 h-5" />
                        <span>{verificationError}</span>
                      </div>
                    )}
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-auto p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400 font-light w-full">
            <p className="flex items-center gap-4">
              <span>© 2025 Lens Labs</span>
              <a href="https://www.lens.xyz/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline">
                Privacy
              </a>
              <a
                href="https://www.lens.xyz/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                style={{ marginLeft: "17px" }}
              >
                Terms
              </a>
            </p>
            <p className="flex items-center gap-4">
              <a href="https://onboarding.lens.xyz/docs" target="_blank" rel="noopener noreferrer" className="hover:underline">
                Developers
              </a>
              <a href="https://twitter.com/lensprotocol" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="14.473" fill="none" viewBox="0 0 17 15">
                  <path
                    fill="currentColor"
                    d="M13.1.244h2.454l-5.36 6.126 6.306 8.337h-4.937L7.696 9.65 3.27 14.707H.816l5.733-6.553L.5.244h5.063l3.495 4.621zm-.86 12.994h1.36L4.823 1.636H3.365z"
                  ></path>
                </svg>
              </a>
            </p>
          </div>
        </footer>
      </div>

      {/* Right Column - Profile Cards Grid */}
      <div className="hidden lg:flex w-1/2 h-screen bg-gray-50 fixed right-0 top-0 scale-75">
        <div className="w-full h-full relative">
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "fit-content",
              height: "fit-content",
              display: "flex",
              flexDirection: "column",
              gap: "2rem",
            }}
          >
            {/* Generate 7 rows, each with 7 cards and alternating animations */}
            {Array.from({ length: 7 }).map((_, rowIndex) => (
              <motion.div
                key={rowIndex}
                initial={{ x: rowIndex % 2 === 0 ? -400 : 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 3, ease: [0.16, 1, 0.15, 1] }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: "2rem",
                }}
              >
                {Array.from({ length: 7 }).map((_, cardIndex) => (
                  <ProfileCard key={cardIndex} />
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
