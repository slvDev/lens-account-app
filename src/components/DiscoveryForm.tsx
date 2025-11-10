// components/DiscoveryForm.tsx
"use client";

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReadContract } from "wagmi";
import { isAddress, type Address } from "viem";
import { useDebounce } from "@/hooks/useDebounce";
import { LENS_CHAIN_ID, LENS_GLOBAL_NAMESPACE_ADDRESS, LENS_GLOBAL_NAMESPACE_ABI } from "@/lib/constants";

// Import icons from Heroicons
import { CheckCircleIcon, ExclamationTriangleIcon, ArrowPathIcon } from "@heroicons/react/24/solid";

interface DiscoveryFormProps {
  onAccountDetailsFound: (details: { address: Address | ""; username: string }) => void;
  initialUsername?: string;
  initialAddress?: string;
}

export interface DiscoveryFormRef {
  reset: () => void;
}

export const DiscoveryForm = forwardRef<DiscoveryFormRef, DiscoveryFormProps>(
  ({ onAccountDetailsFound, initialUsername = "", initialAddress = "" }, ref) => {
    // Single input state
    const [input, setInput] = useState(initialUsername || initialAddress);
    const [lookupError, setLookupError] = useState<string | null>(null);
    const [resolvedAddress, setResolvedAddress] = useState<Address | "">("");

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

    // Expose reset method to parent
    useImperativeHandle(
      ref,
      () => ({
        reset: () => {
          setInput("");
          setResolvedAddress("");
          setLookupError(null);
          onAccountDetailsFound({ address: "", username: "" });
        },
      }),
      [onAccountDetailsFound],
    );

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
        if (isAddress(debouncedInput)) {
          setResolvedAddress(debouncedInput as Address);
          onAccountDetailsFound({ address: debouncedInput as Address, username: usernameFromAddress });
        }
        setLookupError(null);
      } else if (usernameError && detectedType === "address") {
        console.log("No primary username found for address or error:", usernameError.message);
        if (isAddress(debouncedInput)) {
          setResolvedAddress(debouncedInput as Address);
          onAccountDetailsFound({ address: debouncedInput as Address, username: "" });
        }
        setLookupError(null);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [usernameFromAddress, usernameError, detectedType, debouncedInput]);

    const isLoading = isLoadingAddress || isLoadingUsername;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const cleanValue = e.target.value.replace(/\s+/g, "");
      setInput(cleanValue);
      setLookupError(null);
      setResolvedAddress("");
      onAccountDetailsFound({ address: "", username: "" });
    };

    return (
      <div className="w-full max-w-md mx-auto">
        <motion.div
          layoutId="discovery-form"
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
              {!isLoading && !lookupError && resolvedAddress && isAddress(resolvedAddress) && <CheckCircleIcon className="w-5 h-5 text-green-600" />}
              {!isLoading && lookupError && <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />}
            </div>
          </div>
        </motion.div>

        {/* Error message outside of motion div - no layout animation */}
        <AnimatePresence mode="wait">
          {lookupError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <p className="text-sm text-red-600 mt-2">{lookupError}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

DiscoveryForm.displayName = "DiscoveryForm";
