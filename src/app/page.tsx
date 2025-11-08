// src/app/page.tsx
"use client";

import { DiscoveryForm, type DiscoveryFormRef } from "@/components/DiscoveryForm";
import { ProfileCard } from "@/components/ProfileCard";
import { DashboardLeftPanel } from "@/components/DashboardLeftPanel";
import { LeftPanelContainer } from "@/components/layout/LeftPanelContainer";
import { LoginHeader } from "@/components/LoginHeader";
import { OwnerVerificationSection } from "@/components/OwnerVerificationSection";
import { ResolvedAccountCard } from "@/components/ResolvedAccountCard";
import { useState, useEffect, useRef } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useRouter } from "next/navigation";
import { type Address, isAddress } from "viem";
import { useLensAccount } from "@/contexts/LensAccountContext";
import { LENS_ACCOUNT_ABI, LENS_CHAIN_ID, LOCAL_STORAGE_KEYS } from "@/lib/constants";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

export default function Home() {
  // Initialize state with empty defaults (server-renderable)
  const [lensAccountAddress, setLensAccountAddress] = useState<Address | "">("");
  const [lensUsername, setLensUsername] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const [expectedOwner, setExpectedOwner] = useState<Address | null>(null);
  const [ownerFetchError, setOwnerFetchError] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const discoveryFormRef = useRef<DiscoveryFormRef>(null);

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
    setIsAuthenticated(false); // Reset authentication when account changes
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

      console.log("Session Restore Check Effect: Valid session found, wallet connected correctly. Restoring session...");
      setVerifiedAccount(storedLensAddress, connectedAddress);
      setLensAccountAddress(storedLensAddress);
      setLensUsername(storedUsername || "");
      setExpectedOwner(storedOwner);
      setVerificationError(null);

      setIsAuthenticated(true); // Set authenticated instead of routing
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
      console.log("Owner verified! Storing session...");
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
      setIsAuthenticated(true); // Set authenticated instead of routing
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
    setIsAuthenticated(false); // Reset authentication

    // Clear the form input
    if (discoveryFormRef.current) {
      discoveryFormRef.current.reset();
    }

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

  const handleLogout = () => {
    console.log("[Page] Logout triggered from dashboard");
    setIsAuthenticated(false);
    // Clear all state
    setLensAccountAddress("");
    setLensUsername("");
    setExpectedOwner(null);
    setOwnerFetchError(null);
    setVerificationError(null);
    // Note: localStorage clearing is handled by DashboardLeftPanel component
  };

  return (
    <main className="flex h-screen bg-background overflow-y-auto">
      {/* Left Column - Login Form or Dashboard */}
      {!isAuthenticated ? (
        <LeftPanelContainer variant="login" animationKey="login">
          <LayoutGroup>
            <motion.div
              layout
              className="w-full space-y-8"
              transition={{
                layout: {
                  duration: 0.4,
                  type: "spring",
                  stiffness: 200,
                  damping: 25,
                },
              }}
            >
              <LoginHeader />

              {/* Form Section with layout animation */}
              <motion.div
                layout
                layoutId="form-container"
                className="w-full space-y-6"
                transition={{
                  layout: {
                    duration: 0.4,
                    type: "spring",
                    stiffness: 200,
                    damping: 25,
                  },
                }}
              >
                <DiscoveryForm
                  ref={discoveryFormRef}
                  onAccountDetailsFound={handleAccountDetailsFound}
                  initialAddress={lensAccountAddress || ""}
                  initialUsername={lensUsername || ""}
                />

                {/* Cards with AnimatePresence for smooth entry/exit */}
                <AnimatePresence mode="popLayout">
                  {/* Resolved Account Card */}
                  {lensAccountAddress && isAddress(lensAccountAddress) && !isLoadingOwner && !ownerFetchError && (
                    <motion.div
                      key="resolved-card"
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: 0.3,
                          type: "spring",
                          stiffness: 260,
                          damping: 20,
                        },
                      }}
                      exit={{
                        opacity: 0,
                        y: -10,
                        transition: {
                          duration: 0.2,
                        },
                      }}
                    >
                      <ResolvedAccountCard username={lensUsername} address={lensAccountAddress} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Owner Verification Section - outside AnimatePresence for individual card animations */}
                {lensAccountAddress && isAddress(lensAccountAddress) && (
                  <OwnerVerificationSection
                    lensAccountAddress={lensAccountAddress}
                    expectedOwner={expectedOwner}
                    isLoadingOwner={isLoadingOwner}
                    ownerFetchError={ownerFetchError}
                    verificationError={verificationError}
                    isConnected={isConnected}
                    connectedChainId={connectedChainId}
                    lensChainId={LENS_CHAIN_ID}
                    onClear={handleClear}
                  />
                )}
              </motion.div>
            </motion.div>
          </LayoutGroup>
        </LeftPanelContainer>
      ) : (
        <LeftPanelContainer variant="dashboard" animationKey="dashboard">
          <DashboardLeftPanel onLogout={handleLogout} />
        </LeftPanelContainer>
      )}

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
