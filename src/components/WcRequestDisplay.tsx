// src/components/WcRequestDisplay.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useWalletConnect } from "@/contexts/WalletConnectProvider";
import { useLensAccount } from "@/contexts/LensAccountContext";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits, type Hash } from "viem";
import { getSdkError } from "@walletconnect/utils";
import { formatJsonRpcError, formatJsonRpcResult, JsonRpcResponse } from "@walletconnect/jsonrpc-utils";
import { LENS_ACCOUNT_ABI, LENS_CHAIN_ID, lensChain } from "@/lib/constants";
import { motion } from "framer-motion";

// dApp icon size constant
const DAPP_ICON_SIZE = 48;

// Basic Fallback Icon Component
const FallbackIcon = () => (
  <div
    style={{ width: `${DAPP_ICON_SIZE}px`, height: `${DAPP_ICON_SIZE}px` }}
    className="rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs flex-shrink-0"
  >
    ?
  </div>
);

// Animation variants matching the pattern
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

export function WcRequestDisplay() {
  const { pendingRequest, respondRequest, error: wcError, isLoading: isWcLoading } = useWalletConnect();
  const { lensAccountAddress } = useLensAccount();
  const { address: ownerAddress, chainId: ownerChainId } = useAccount();

  const { data: hash, error: writeError, isPending: isWritePending, writeContractAsync, reset: resetWriteContract } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
    data: receipt,
  } = useWaitForTransactionReceipt({ hash, chainId: LENS_CHAIN_ID });

  const [localError, setLocalError] = useState<string | null>(null);
  const [localLoadingMessage, setLocalLoadingMessage] = useState<string | null>(null);
  const processingRequestId = useRef<number | null>(null);
  const processingRequestHash = useRef<Hash | null>(null);

  console.log(
    `%cWcRequestDisplay Render: pendingReqId=${pendingRequest?.id ?? "null"}, currentProcessingId=${processingRequestId.current}, currentProcessingHash=${processingRequestHash.current ?? "null"}, hookHash=${hash ?? "null"}, isWritePending=${isWritePending}, isConfirming=${isConfirming}, isConfirmed=${isConfirmed}, receiptHash=${receipt?.transactionHash ?? "null"}, writeError=${!!writeError}, receiptError=${!!receiptError}`,
    "color: magenta",
  );

  useEffect(() => {
    const incomingRequestId = pendingRequest?.id ?? null;
    const currentProcessing = processingRequestId.current;

    console.log(
      `%cWcRequestDisplay ResetEffect: Running. Incoming ID: ${incomingRequestId}, Current Processing ID: ${currentProcessing}`,
      "color: teal",
    );

    if (incomingRequestId !== null) {
      if (currentProcessing !== incomingRequestId) {
        console.log(`%cWcRequestDisplay ResetEffect: New request ${incomingRequestId} detected. Resetting state.`, "color: teal");
        resetWriteContract();
        setLocalError(null);
        setLocalLoadingMessage(null);
        processingRequestId.current = incomingRequestId;
        processingRequestHash.current = null;
      } else {
        console.log(
          `%cWcRequestDisplay ResetEffect: Incoming ID ${incomingRequestId} matches current Processing ID. No reset needed.`,
          "color: teal",
        );
      }
    } else {
      if (currentProcessing !== null) {
        console.log(`%cWcRequestDisplay ResetEffect: No pending request. Resetting state.`, "color: teal");
        resetWriteContract();
        setLocalError(null);
        setLocalLoadingMessage(null);
        processingRequestId.current = null;
        processingRequestHash.current = null;
      } else {
        console.log(`%cWcRequestDisplay ResetEffect: No pending request and nothing processing. No reset needed.`, "color: teal");
      }
    }
  }, [pendingRequest, resetWriteContract]);

  useEffect(() => {
    if (hash && processingRequestId.current && !processingRequestHash.current) {
      console.log(`%cWcRequestDisplay HashTrackEffect: Associating hash ${hash} with request ID ${processingRequestId.current}`, "color: purple");
      processingRequestHash.current = hash;
    }
  }, [hash, processingRequestId]);

  const handleRespond = useCallback(
    (response: JsonRpcResponse) => {
      const currentId = processingRequestId.current;
      if (currentId !== null && currentId === response.id) {
        console.log(`%cWcRequestDisplay handleRespond: Responding for request ID: ${response.id}`, "color: darkmagenta", response);
        respondRequest(response);
        processingRequestId.current = null;
        processingRequestHash.current = null;
        setLocalLoadingMessage(null);
        resetWriteContract();
      } else {
        console.warn(
          `%cWcRequestDisplay handleRespond: Ignoring response attempt for stale/mismatched request ID: ${response.id} (Current Processing: ${currentId})`,
          "color: orange",
        );
      }
    },
    [respondRequest, resetWriteContract],
  );

  useEffect(() => {
    const currentProcessingId = processingRequestId.current;
    const currentReqHash = processingRequestHash.current;

    console.log(
      `%cWcRequestDisplay ReceiptEffect: Running. CurrentProcessingId=${currentProcessingId}, CurrentReqHash=${currentReqHash ?? "null"}, HookHash=${hash ?? "null"}, isConfirming=${isConfirming}, isConfirmed=${isConfirmed}, receiptHash=${receipt?.transactionHash ?? "null"}, receiptError=${!!receiptError}`,
      "color: #2ECC71",
    );

    if (!currentProcessingId || !currentReqHash || isConfirming || hash !== currentReqHash) {
      console.log(
        `%cWcRequestDisplay ReceiptEffect: Bailing out (ProcessingID: ${currentProcessingId}, CurrentReqHash: ${currentReqHash}, HookHash: ${hash}, Confirming: ${isConfirming})`,
        "color: gray",
      );
      return;
    }

    if (receipt && receipt.transactionHash === currentReqHash) {
      console.log(`%cWcRequestDisplay ReceiptEffect: Receipt received for current hash ${currentReqHash}`, "color: #2ECC71");
      setLocalLoadingMessage(null);
      if (receipt.status === "success") {
        console.log(
          `%cWcRequestDisplay ReceiptEffect: Transaction successful, calling handleRespond for ID ${currentProcessingId}`,
          "color: #2ECC71",
        );
        handleRespond(formatJsonRpcResult(currentProcessingId, receipt.transactionHash));
      } else {
        console.error(
          `%cWcRequestDisplay ReceiptEffect: Transaction reverted, calling handleRespond for ID ${currentProcessingId}`,
          "color: red",
          receipt,
        );
        setLocalError("Transaction reverted on chain.");
        handleRespond(formatJsonRpcError(currentProcessingId, { code: -32000, message: "Transaction reverted" }));
      }
    } else if (receiptError) {
      console.error(
        `%cWcRequestDisplay ReceiptEffect: Transaction Receipt Error for hash ${currentReqHash}, calling handleRespond for ID ${currentProcessingId}`,
        "color: red",
        receiptError,
      );
      setLocalError(`Transaction failed: ${receiptError.message}`);
      handleRespond(formatJsonRpcError(currentProcessingId, { code: -32000, message: "Transaction Failed on chain" }));
    } else if (isConfirmed && !receipt) {
      console.warn(
        `%cWcRequestDisplay ReceiptEffect: isConfirmed is true but receipt is still null/undefined for hash ${currentReqHash}. Waiting.`,
        "color: orange",
      );
    } else {
      console.log(`%cWcRequestDisplay ReceiptEffect: No definitive action taken for hash ${currentReqHash}`, "color: gray");
    }
  }, [isConfirming, isConfirmed, receiptError, receipt, hash, handleRespond]);

  useEffect(() => {
    const currentProcessingId = processingRequestId.current;
    console.log(`%cWcRequestDisplay WriteErrorEffect: Running. writeError=${!!writeError}, currentProcessingId=${currentProcessingId}`, "color: red");
    if (writeError && currentProcessingId) {
      console.error("WcRequestDisplay WriteErrorEffect: Write Contract Error detected:", writeError);
      setLocalError(`Transaction rejected or failed to send: ${writeError.message}`);
      handleRespond(formatJsonRpcError(currentProcessingId, getSdkError("USER_REJECTED")));
    }
  }, [writeError, handleRespond]);

  const handleApprove = async () => {
    if (!pendingRequest) return setLocalError("No request to approve.");
    if (!lensAccountAddress) return setLocalError("Lens Account address missing.");
    if (!ownerAddress) return setLocalError("Owner wallet not connected.");
    if (!writeContractAsync) return setLocalError("Transaction function not ready.");
    if (ownerChainId !== LENS_CHAIN_ID) return setLocalError("Owner wallet not on Lens Chain.");

    console.log(`%cWcRequestDisplay handleApprove: Resetting state before write for request ID: ${pendingRequest.id}`, "color: blueviolet");
    resetWriteContract();
    processingRequestId.current = pendingRequest.id;
    processingRequestHash.current = null;
    setLocalError(null);
    setLocalLoadingMessage("Please confirm in your wallet...");

    const { method, params } = pendingRequest.params.request;
    if (method !== "eth_sendTransaction") {
      const errorMsg = `Unsupported method: ${method}`;
      setLocalError(errorMsg);
      handleRespond(formatJsonRpcError(pendingRequest.id, { code: 4200, message: "Method not supported" }));
      return;
    }

    const tx = params[0] as { to?: `0x${string}`; value?: string; data?: `0x${string}` };
    const targetAddress = tx.to;
    const value = tx.value ? BigInt(tx.value) : 0n;
    const data = tx.data || "0x";

    if (!targetAddress) {
      const errorMsg = "Transaction 'to' address is missing.";
      setLocalError(errorMsg);
      handleRespond(formatJsonRpcError(pendingRequest.id, { code: -32602, message: "Invalid parameters: missing 'to' address" }));
      return;
    }

    try {
      console.log("%cWcRequestDisplay handleApprove: Calling writeContractAsync...", "color: blueviolet");
      await writeContractAsync({
        address: lensAccountAddress,
        abi: LENS_ACCOUNT_ABI,
        functionName: "executeTransaction",
        args: [targetAddress, value, data],
        account: ownerAddress,
        chainId: LENS_CHAIN_ID,
      });
      console.log("%cWcRequestDisplay handleApprove: writeContractAsync call submitted.", "color: blueviolet");
    } catch (error) {
      console.error("WcRequestDisplay handleApprove: Error calling writeContractAsync:", error);
      if (!writeError && processingRequestId.current) {
        const errorMsg = `Failed to initiate transaction: ${(error as Error).message}`;
        setLocalError(errorMsg);
        handleRespond(formatJsonRpcError(processingRequestId.current, getSdkError("USER_REJECTED")));
      }
    }
  };

  const handleReject = () => {
    if (!pendingRequest) return;
    processingRequestId.current = pendingRequest.id;
    setLocalError(null);
    setLocalLoadingMessage(null);
    console.log("WcRequestDisplay handleReject: Rejecting request:", pendingRequest.id);
    handleRespond(formatJsonRpcError(pendingRequest.id, getSdkError("USER_REJECTED")));
  };

  if (!pendingRequest) {
    return null;
  }

  const { request, chainId } = pendingRequest.params;
  const txDetails = request.params?.[0] as { to?: string; value?: string; data?: string } | undefined;
  const dAppName = pendingRequest.verifyContext?.verified.origin || "Unknown dApp";
  const formattedValue = txDetails?.value
    ? `${formatUnits(BigInt(txDetails.value), lensChain.nativeCurrency.decimals)} ${lensChain.nativeCurrency.symbol}`
    : `0 ${lensChain.nativeCurrency.symbol}`;
  const isLoading = isWritePending || isConfirming || isWcLoading;

  return (
    <motion.div layout className="w-full" variants={cardVariants} initial="hidden" animate="visible">
      <motion.div layout className="bg-gray-50 w-full rounded-3xl p-3 border-2 border-blue-200">
        {/* Header Row */}
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <FallbackIcon />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <p className="text-xs text-blue-600 font-medium">Transaction Request</p>
            <p className="text-base font-medium text-foreground">{dAppName}</p>
            <p className="text-xs text-gray-600">
              {request.method} • {formattedValue}
            </p>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
          <div className="flex items-start gap-2 text-xs">
            <span className="text-gray-600 font-medium flex-shrink-0">Chain:</span>
            <span className="font-mono bg-gray-100 px-1 rounded">{chainId}</span>
          </div>
          <div className="flex items-start gap-2 text-xs">
            <span className="text-gray-600 font-medium flex-shrink-0">Target:</span>
            <span className="font-mono text-[10px] break-all">{txDetails?.to ?? "N/A"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-600 font-medium">Data:</span>
            <textarea
              readOnly
              value={txDetails?.data ?? "0x"}
              className="w-full h-16 p-2 border border-gray-200 rounded-lg text-[10px] font-mono bg-white focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Status Messages */}
        {localLoadingMessage && (
          <div className="mt-2">
            <p className="text-xs text-center text-blue-600 animate-pulse">{localLoadingMessage}</p>
          </div>
        )}
        {localError && (
          <div className="mt-2">
            <p className="text-xs text-center text-red-600">{localError}</p>
          </div>
        )}
        {wcError && !localError && (
          <div className="mt-2">
            <p className="text-xs text-center text-red-600">WC Error: {wcError}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleApprove}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {isWritePending ? "Check Wallet..." : isConfirming ? "Confirming..." : "Approve & Send"}
          </button>
          <button
            onClick={handleReject}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            Reject
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
