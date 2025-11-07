// components/DiscoveryForm.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useReadContract } from "wagmi";
import { isAddress, type Address } from "viem";
import { useDebounce } from "@/hooks/useDebounce";
import { LENS_CHAIN_ID, LENS_GLOBAL_NAMESPACE_ADDRESS, LENS_GLOBAL_NAMESPACE_ABI } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { fadeOutUp, fadeInUpDelayed } from "@/lib/animations";

// Import icons from Heroicons
import { CheckCircleIcon, ExclamationTriangleIcon, ArrowPathIcon } from "@heroicons/react/24/solid";

interface DiscoveryFormProps {
  onAccountDetailsFound: (details: { address: Address | ""; username: string }) => void;
  onReset?: () => void;
  initialUsername?: string;
  initialAddress?: string;
}

export function DiscoveryForm({ onAccountDetailsFound, onReset, initialUsername = "", initialAddress = "" }: DiscoveryFormProps) {
  // Single input state
  const [input, setInput] = useState(initialUsername || initialAddress);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [resolvedUsername, setResolvedUsername] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState<Address | "">("");
  const [hideInput, setHideInput] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Track if we've initialized - prevents input from changing after user types
  const isInitialized = useRef(false);

  // Sync initial values ONLY on first mount (for session restoration)
  useEffect(() => {
    if (!isInitialized.current) {
      const initialValue = initialUsername || initialAddress;
      if (initialValue && initialValue !== input) {
        setInput(initialValue);
      }
      isInitialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUsername, initialAddress]);

  const debouncedInput = useDebounce(input, 500);

  // Auto-detect if input is an address or username
  const detectedType = debouncedInput.startsWith("0x") && isAddress(debouncedInput) ? "address" : debouncedInput ? "username" : null;

  const {
    data: addressFromUsername,
    isLoading: isLoadingAddress,
    error: addressError,
    refetch: refetchAddress,
  } = useReadContract({
    address: LENS_GLOBAL_NAMESPACE_ADDRESS,
    abi: LENS_GLOBAL_NAMESPACE_ABI,
    functionName: "accountOf",
    args: [detectedType === "username" ? debouncedInput : ""],
    chainId: LENS_CHAIN_ID,
    query: {
      enabled: false,
    },
  });

  const {
    data: usernameFromAddress,
    isLoading: isLoadingUsername,
    error: usernameError,
    refetch: refetchUsername,
  } = useReadContract({
    address: LENS_GLOBAL_NAMESPACE_ADDRESS,
    abi: LENS_GLOBAL_NAMESPACE_ABI,
    functionName: "usernameOf",
    args: [detectedType === "address" ? (debouncedInput as `0x${string}`) : ("0x0000000000000000000000000000000000000000" as `0x${string}`)],
    chainId: LENS_CHAIN_ID,
    query: {
      enabled: false,
    },
  });

  // Trigger lookup when input changes
  useEffect(() => {
    if (!debouncedInput) {
      setLookupError(null);
      setResolvedUsername("");
      setResolvedAddress("");
      onAccountDetailsFound({ address: "", username: "" });
      return;
    }

    setLookupError(null);

    if (detectedType === "username") {
      console.log(`Looking up address for username: ${debouncedInput}`);
      refetchAddress();
    } else if (detectedType === "address") {
      console.log(`Looking up username for address: ${debouncedInput}`);
      refetchUsername();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput, detectedType]);

  // Handle username lookup response
  useEffect(() => {
    if (addressFromUsername && isAddress(addressFromUsername) && detectedType === "username") {
      if (addressFromUsername === "0x0000000000000000000000000000000000000000") {
        setLookupError(`No account found for username "${debouncedInput}"`);
        setResolvedAddress("");
        onAccountDetailsFound({ address: "", username: debouncedInput || "" });
      } else {
        console.log(`Found address: ${addressFromUsername}`);
        setResolvedAddress(addressFromUsername);
        setResolvedUsername(debouncedInput);
        onAccountDetailsFound({ address: addressFromUsername, username: debouncedInput || "" });
        setLookupError(null);
      }
    } else if (addressError && detectedType === "username") {
      console.error("Error fetching address:", addressError);
      if (addressError.message.includes("0xb0ce7591") || addressError.message.includes("DoesNotExist")) {
        setLookupError(`Username "${debouncedInput}" does not exist`);
      } else {
        setLookupError("Error fetching address. Please try again.");
      }
      setResolvedAddress("");
      onAccountDetailsFound({ address: "", username: debouncedInput || "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressFromUsername, addressError, detectedType, debouncedInput]);

  // Handle address lookup response
  useEffect(() => {
    if (usernameFromAddress && detectedType === "address") {
      console.log(`Found username: ${usernameFromAddress}`);
      setResolvedUsername(usernameFromAddress);
      if (isAddress(debouncedInput)) {
        setResolvedAddress(debouncedInput as Address);
        onAccountDetailsFound({ address: debouncedInput as Address, username: usernameFromAddress });
      }
      setLookupError(null);
    } else if (usernameError && detectedType === "address") {
      console.log("No primary username found for address or error:", usernameError.message);
      setResolvedUsername("");
      if (isAddress(debouncedInput)) {
        setResolvedAddress(debouncedInput as Address);
        onAccountDetailsFound({ address: debouncedInput as Address, username: "" });
      }
      setLookupError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usernameFromAddress, usernameError, detectedType, debouncedInput]);

  const isLoading = isLoadingAddress || isLoadingUsername;

  // Debug: Log hideInput state changes
  useEffect(() => {
    console.log("[DiscoveryForm] hideInput state changed:", hideInput);
  }, [hideInput]);

  // Debug: Log resolved data changes
  useEffect(() => {
    console.log("[DiscoveryForm] Resolved data:", {
      resolvedUsername,
      resolvedAddress,
      lookupError,
      isLoading,
    });
  }, [resolvedUsername, resolvedAddress, lookupError, isLoading]);

  // Track previous values to detect clear
  const prevValues = useRef({ initialUsername, initialAddress });

  // Reset form when parent clears data
  useEffect(() => {
    const hadValues = prevValues.current.initialUsername || prevValues.current.initialAddress;
    const nowEmpty = !initialUsername && !initialAddress;

    if (hadValues && nowEmpty) {
      console.log("[DiscoveryForm] Clear detected - starting clear sequence");
      setIsClearing(true);
      setInput("");
      setResolvedUsername("");
      setResolvedAddress("");
      setLookupError(null);

      // Delay showing input until cards have exited (300ms exit animation)
      console.log("[DiscoveryForm] Waiting 300ms for cards to exit...");
      const timer = setTimeout(() => {
        console.log("[DiscoveryForm] Cards exited - showing input field");
        setHideInput(false);
        setIsClearing(false);
      }, 300);

      return () => {
        console.log("[DiscoveryForm] Cleanup: clearing timer");
        clearTimeout(timer);
      };
    }

    // Update ref for next comparison
    prevValues.current = { initialUsername, initialAddress };
  }, [initialUsername, initialAddress]);

  // Trigger hide animation when account is found (no delay - simultaneous with card appearing)
  useEffect(() => {
    // Don't change hideInput state during clear sequence
    if (isClearing) {
      console.log("[DiscoveryForm] Clearing in progress - ignoring hideInput state changes");
      return;
    }

    if (!isLoading && !lookupError && resolvedAddress && isAddress(resolvedAddress)) {
      console.log("[DiscoveryForm] Account found - hiding input, showing cards");
      setHideInput(true);
    } else if (!resolvedAddress) {
      console.log("[DiscoveryForm] No resolved address - showing input");
      setHideInput(false);
    }
  }, [isLoading, lookupError, resolvedAddress, isClearing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanValue = e.target.value.replace(/\s+/g, "");
    setInput(cleanValue);
    setLookupError(null);
    setResolvedUsername("");
    setResolvedAddress("");
    setHideInput(false);
    onAccountDetailsFound({ address: "", username: "" });
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <AnimatePresence>
        {!hideInput && (
          <motion.div key="input-field" {...fadeOutUp}>
            <label htmlFor="lens-input" className="block text-sm font-medium text-text-primary mb-2">
              Lens Username or Address
            </label>
            <div className="relative">
              <input
                id="lens-input"
                name="lens-input"
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="e.g. stani or 0x..."
                className={`w-full px-4 py-3 pr-12 bg-gray-50 border rounded-lg focus:outline-none focus:ring-1 focus:ring-text-primary focus:border-text-primary focus:bg-white transition duration-200 ${
                  !lookupError && resolvedAddress && isAddress(resolvedAddress)
                    ? "border-green-500"
                    : lookupError
                      ? "border-red-500"
                      : "border-border-subtle"
                }`}
                aria-describedby="lens-input-status"
              />

              {/* Inline status icons */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                {isLoading && <ArrowPathIcon className="w-5 h-5 animate-spin text-text-secondary" />}
                {!isLoading && !lookupError && resolvedAddress && isAddress(resolvedAddress) && (
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                )}
                {!isLoading && lookupError && <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />}
              </div>
            </div>

            {/* Error message below input */}
            {lookupError && <p className="text-sm text-red-600 mt-2">{lookupError}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resolved Information Display - Without redundant header */}
      <AnimatePresence>
        {!isLoading && !lookupError && resolvedAddress && isAddress(resolvedAddress) && (
          <motion.div key="resolved-info" {...fadeInUpDelayed} className="bg-gray-50 border border-green-200 rounded-lg p-5 space-y-3">
            {resolvedUsername && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Username</span>
                <p className="text-base font-semibold text-text-primary">{resolvedUsername}</p>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Account Address</span>
              <p className="text-xs font-mono text-text-primary break-all bg-white px-3 py-2 rounded border border-border-subtle">
                {resolvedAddress}
              </p>
            </div>

            {detectedType === "address" && !resolvedUsername && (
              <p className="text-xs text-text-secondary italic">No username registered for this address</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
