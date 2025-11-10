"use client";

import { type Address, isAddress } from "viem";
import { useState } from "react";
import { ExclamationTriangleIcon, CheckCircleIcon, ArrowPathIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/solid";
import { DocumentDuplicateIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useLensAccount } from "@/contexts/LensAccountContext";
import { LENS_ACCOUNT_ABI, LENS_CHAIN_ID } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { shortAddress } from "@/lib";

interface OwnerPanelProps {
  ownerAddress: Address;
}

export function OwnerPanel({ ownerAddress }: OwnerPanelProps) {
  const [isChangingOwner, setIsChangingOwner] = useState(false);
  const [newOwner, setNewOwner] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Wagmi hooks
  const { address: connectedOwnerAddress, chainId } = useAccount();
  const { lensAccountAddress } = useLensAccount();
  const { data: hash, error: writeError, isPending: isWritePending, writeContract, reset } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
    chainId: LENS_CHAIN_ID,
  });

  const isLoading = isWritePending || isConfirming;
  const txError = writeError || receiptError;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ownerAddress);
      setCopied(true);
      console.log("Address copied to clipboard:", ownerAddress);
      // Reset icon after a short delay
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
      alert("Failed to copy address."); // Simple error feedback
    }
  };

  const handleOpenExplorer = () => {
    window.open(`https://explorer.lens.xyz/address/${ownerAddress}`, "_blank");
  };

  const handleToggleChangeOwner = () => {
    setIsChangingOwner(!isChangingOwner);
    setNewOwner("");
    setInputError(null);
    reset(); // Reset wagmi state on toggle
  };

  const handleNewOwnerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setNewOwner(value);
    if (value && !isAddress(value)) {
      setInputError("Invalid address format");
    } else {
      setInputError(null);
    }
  };

  const handleConfirmChangeOwner = () => {
    if (!isAddress(newOwner) || !lensAccountAddress || !connectedOwnerAddress) {
      setInputError("A valid new owner address is required and wallet must be connected.");
      return;
    }
    if (newOwner.toLowerCase() === ownerAddress.toLowerCase()) {
      setInputError("New owner cannot be the same as the current owner.");
      return;
    }
    // Ensure the connected wallet IS the current owner
    if (connectedOwnerAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
      setInputError("Only the current owner can initiate this transfer.");
      return;
    }
    // Ensure connected to the correct chain
    if (chainId !== LENS_CHAIN_ID) {
      setInputError(`Please switch your wallet to Lens Chain (ID: ${LENS_CHAIN_ID}) to proceed.`);
      return;
    }

    console.log(`Initiating ownership transfer to ${newOwner} for account ${lensAccountAddress}`);
    writeContract({
      address: lensAccountAddress,
      abi: LENS_ACCOUNT_ABI,
      functionName: "transferOwnership",
      args: [newOwner as Address],
      account: connectedOwnerAddress,
      chainId: LENS_CHAIN_ID,
    });
  };

  // Display Success/Error messages after transaction attempt
  let statusMessage = null;
  if (isLoading) {
    statusMessage = (
      <div className="flex items-center text-text-secondary text-sm mt-2">
        <ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" />
        {isWritePending ? "Waiting for confirmation..." : "Processing transaction..."}
      </div>
    );
  } else if (isConfirmed) {
    statusMessage = (
      <div className="flex items-center text-green-600 text-sm mt-2">
        <CheckCircleIcon className="w-4 h-4 mr-1" />
        Ownership transferred successfully! Please login with the new owner account.
      </div>
    );
  } else if (txError) {
    statusMessage = (
      <div className="flex items-center text-red-600 text-sm mt-2">
        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
        Error: {txError.message.split(":")[0]} {/* Show concise error */}
      </div>
    );
  }

  return (
    <motion.div layout className="bg-gray-50 w-full rounded-3xl p-3">
      <motion.div
        layout
        className="flex items-center gap-4 h-14"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.1,
          duration: 0.4,
          type: "spring",
          stiffness: 260,
          damping: 20,
          layout: {
            duration: 0.4,
            type: "spring",
            stiffness: 200,
            damping: 25,
          },
        }}
      >
        {/* Address column */}
        <div className="flex-1 flex flex-col pl-2">
          <p className="text-xs text-text-secondary">Owner</p>
          <p className="text-base font-mono text-foreground select-all">{shortAddress(ownerAddress)}</p>
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
            onClick={handleToggleChangeOwner}
            title="Change Owner"
            className="px-3 py-1 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-all duration-150 hover:shadow-sm cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isChangingOwner ? "Cancel" : "Change"}
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence mode="popLayout">
        {isChangingOwner && (
          <motion.div
            layout
            className="mt-3 p-4 border border-orange-200 rounded-2xl bg-orange-50 space-y-3 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.2,
              layout: {
                duration: 0.4,
                type: "spring",
                stiffness: 200,
                damping: 25,
              },
            }}
          >
            <div className="flex items-center text-orange-700">
              <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-orange-600" />
              <p className="text-xs font-semibold">Transfer Ownership - Irreversible Action</p>
            </div>

            <p className="text-xs text-orange-600">Warning: Transferring ownership is permanent. Ensure the new address is correct and accessible.</p>

            <div>
              <label htmlFor="new-owner" className="block text-xs font-medium text-text-primary mb-1">
                New Owner Address
              </label>
              <input
                id="new-owner"
                name="new-owner"
                type="text"
                value={newOwner}
                onChange={handleNewOwnerChange}
                placeholder="0x..."
                className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:ring-1 transition duration-200 ${
                  inputError
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-200 focus:border-text-primary focus:ring-text-primary focus:bg-white"
                }`}
              />
              <AnimatePresence>
                {inputError && (
                  <motion.p
                    className="mt-1 text-xs text-red-600"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    {inputError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleConfirmChangeOwner}
                disabled={!isAddress(newOwner) || newOwner.toLowerCase() === ownerAddress.toLowerCase() || isLoading || isConfirmed}
                className="flex-1 px-4 py-2 bg-orange-600 text-white text-xs font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
              >
                {isLoading ? "Processing..." : isConfirmed ? "Transferred" : "Confirm Transfer"}
              </button>
              <button
                onClick={handleToggleChangeOwner}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-white text-text-secondary border border-gray-200 text-xs font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-text-primary disabled:opacity-50 transition-all duration-150"
              >
                Cancel
              </button>
            </div>

            {/* Display status message */}
            {statusMessage && <div>{statusMessage}</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
