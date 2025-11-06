"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon, ArrowPathIcon } from "@heroicons/react/24/solid";
import { type Hash } from "viem";

interface BaseTxModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode; // For backward compatibility
  content?: ReactNode; // Form content
  actions?: ReactNode; // Action buttons
  isLoading: boolean;
  isSuccess: boolean;
  error: Error | null;
  txHash?: Hash | null; // Optional transaction hash
  disableClose?: boolean; // Optional: prevent closing during transaction
}

export function BaseTxModal({
  isOpen,
  onClose,
  title,
  children,
  content,
  actions,
  isLoading,
  isSuccess,
  error,
  txHash,
  disableClose = false,
}: BaseTxModalProps) {
  const [countdown, setCountdown] = useState(5);

  // Auto-close after success
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // 5 seconds
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onClose]);

  // Countdown effect
  useEffect(() => {
    if (isSuccess && countdown > 0) {
      const interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isSuccess, countdown]);

  // Reset countdown when modal opens/closes
  useEffect(() => {
    setCountdown(5);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (!disableClose && !isLoading) {
      onClose();
    }
  };

  let statusMessage = null;
  if (isLoading) {
    statusMessage = (
      <div className="flex items-center justify-center text-text-secondary text-sm p-3 bg-gray-50 rounded-lg border border-border-subtle">
        <ArrowPathIcon className="w-4 h-4 mr-1.5 animate-spin" />
        Processing transaction... Check your wallet.
      </div>
    );
  } else if (isSuccess) {
    statusMessage = (
      <div className="flex items-center justify-center text-green-700 text-sm p-3 bg-green-50 rounded-lg border border-green-200">
        <CheckCircleIcon className="w-5 h-5 mr-1.5" />
        Transaction successful!
        {txHash && (
          <a
            href={`https://explorer.lens.xyz/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1.5 underline hover:text-green-800 font-medium"
          >
            View on Explorer
          </a>
        )}
        <span className="ml-2 text-text-secondary">(Closing in {countdown}s)</span>
      </div>
    );
  } else if (error) {
    statusMessage = (
      <div className="flex items-center justify-center text-red-700 text-sm p-3 bg-red-50 rounded-lg border border-red-200">
        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
        Error: {error.message?.split("(")?.[0]?.trim() || "Unknown error"} {/* Show concise error with fallback */}
      </div>
    );
  }

  // Determine what to render in the content area
  const contentToRender = content || children;
  const actionsToRender = actions; // Actions from props or null

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/60 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div
        className="bg-card-background p-8 rounded-lg border border-border-subtle relative max-w-xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          disabled={disableClose || isLoading}
          className={`absolute top-4 right-4 p-1 rounded-full ${disableClose || isLoading ? "text-gray-300 cursor-not-allowed" : "text-text-secondary hover:bg-gray-100 hover:text-text-primary"} transition-colors`}
          aria-label="Close modal"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <h3 className="text-2xl font-medium mb-6 text-text-primary pr-8">{title}</h3>

        {/* Modal Form Content */}
        <div className="space-y-5 mb-5">{contentToRender}</div>

        {/* Status Message Area */}
        <div className="mb-5">{statusMessage}</div>

        {/* Action Buttons */}
        {actionsToRender && <div>{actionsToRender}</div>}
      </div>
    </div>
  );
}
