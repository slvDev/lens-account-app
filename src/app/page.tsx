// src/app/page.tsx
"use client";

import { DiscoveryForm } from "@/components/DiscoveryForm";
import { ConnectOwnerButton } from "@/components/ConnectOwnerButton";
import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useRouter } from "next/navigation";
import { type Address, isAddress } from "viem";
import { useLensAccount } from "@/contexts/LensAccountContext";
import { LENS_ACCOUNT_ABI, LENS_CHAIN_ID, LOCAL_STORAGE_KEYS } from "@/lib/constants";
import { ArrowPathIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

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

  return (
    <main className="flex min-h-screen bg-background">
      {/* Left Column - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen p-6 md:p-12 lg:p-16">
        {/* Content wrapper with auto margins for vertical centering */}
        <div className="flex flex-col justify-center flex-1">
          <div className="max-w-lg mx-auto w-full space-y-8">
            {/* Header with logo and title */}
            <div className="flex flex-col items-center gap-8">
              <div className="w-[107px] h-[69px] flex items-center justify-center">
                <svg width="107" height="69" viewBox="0 0 107 69" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M86.52 13.8071C81.5327 13.8071 77.0576 15.7971 73.6474 19.0087L73.2969 18.8303C72.5152 8.30345 64.1042 0 53.5635 0C43.0228 0 34.6118 8.30345 33.83 18.8303L33.4796 19.0087C30.0693 15.7971 25.5943 13.8071 20.607 13.8071C9.54059 13.8071 0.563477 22.9477 0.563477 34.2294C0.563477 43.974 10.0663 52.3323 12.4251 54.2538C23.5185 63.2434 37.9681 68.5 53.5635 68.5C69.1588 68.5 83.6085 63.2434 94.7018 54.2538C97.0742 52.3323 106.563 43.9877 106.563 34.2294C106.563 22.9477 97.5864 13.8071 86.5065 13.8071H86.52Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <h1 className="text-4xl font-normal text-foreground tracking-tight">Your account awaits.</h1>
            </div>

            {/* Form Card */}
            <div className="w-full p-8 space-y-8 bg-card-background rounded-lg border border-border-subtle">
              <DiscoveryForm
                onAccountDetailsFound={handleAccountDetailsFound}
                initialAddress={lensAccountAddress || ""}
                initialUsername={lensUsername || ""}
              />

              <div className="space-y-4">
                {isAddress(lensAccountAddress) && isLoadingOwner && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-text-secondary">
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    <span>Fetching owner...</span>
                  </div>
                )}

                {ownerFetchError && !isLoadingOwner && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                    <ExclamationTriangleIcon className="w-5 h-5" />
                    <span>{ownerFetchError}</span>
                  </div>
                )}

                {expectedOwner && !isLoadingOwner && !ownerFetchError && (
                  <div className="p-5 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm font-semibold text-text-primary mb-1">Identified Account Owner:</p>
                    <p className="text-xs text-text-secondary break-words font-mono">{expectedOwner}</p>
                    {!isConnected && <p className="text-xs text-text-secondary mt-2">Connect this wallet to proceed.</p>}
                  </div>
                )}

                {verificationError && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                    <ExclamationTriangleIcon className="w-5 h-5" />
                    <span>{verificationError}</span>
                  </div>
                )}

                {showConnectButton && (
                  <div className="flex flex-col items-center gap-3 mt-2">
                    <ConnectOwnerButton />
                    {isConnected && connectedChainId !== LENS_CHAIN_ID && (
                      <p className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-md border border-orange-200">
                        Waiting for network switch...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-border-subtle">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-secondary max-w-lg mx-auto w-full">
            <div className="flex items-center gap-4">
              <span>© 2025 Lens Labs</span>
              <a href="https://www.lens.xyz/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition-colors">
                Privacy
              </a>
              <a href="https://www.lens.xyz/terms" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition-colors">
                Terms
              </a>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/vicnaum/lens-account-app"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text-primary transition-colors"
              >
                Developers
              </a>
              <a href="https://fkng.social" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition-colors">
                FKNG.SOCIAL
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* Right Column - Placeholder Content */}
      <div className="hidden lg:flex w-1/2 bg-gray-50 items-center justify-center p-16">
        <div className="max-w-xl text-center space-y-6">
          <h2 className="text-3xl font-medium text-text-primary">Welcome to Lens</h2>
          <p className="text-lg text-text-secondary leading-relaxed">
            Lens is an open social network where users own their content and connections, and developers can build apps on the network.
          </p>
          <p className="text-base text-text-secondary">Connect your Lens account to manage your identity, tokens, and dApp connections.</p>
        </div>
      </div>
    </main>
  );
}
