"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon, ArrowPathIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
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

  // Determine what to render in the content area
  const contentToRender = content || children;
  const actionsToRender = actions; // Actions from props or null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 backdrop-blur-md bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="bg-white p-8 rounded-2xl border border-gray-200 shadow-2xl relative max-w-xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
          >
            <motion.button
              onClick={handleClose}
              disabled={disableClose || isLoading}
              className={`absolute top-6 right-6 p-2 rounded-lg ${
                disableClose || isLoading ? "text-gray-300 cursor-not-allowed" : "text-text-secondary hover:bg-gray-100 hover:text-text-primary"
              } transition-all duration-150`}
              aria-label="Close modal"
              whileHover={!disableClose && !isLoading ? { scale: 1.1 } : {}}
              whileTap={!disableClose && !isLoading ? { scale: 0.95 } : {}}
            >
              <XMarkIcon className="w-5 h-5" />
            </motion.button>

            <h3 className="text-2xl font-medium mb-6 text-foreground pr-8">{title}</h3>

            {/* Modal Form Content */}
            <div className="space-y-5 mb-5">{contentToRender}</div>

            {/* Status Message Area with animations */}
            <AnimatePresence mode="wait">
              {isLoading && (
                <motion.div
                  key="loading"
                  className="flex items-center justify-center text-text-secondary text-sm p-4 bg-gray-50 rounded-xl border border-gray-200 mb-5"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin text-text-secondary" />
                  <span className="font-medium">Processing transaction... Check your wallet.</span>
                </motion.div>
              )}

              {isSuccess && (
                <motion.div
                  key="success"
                  className="flex items-center justify-center text-green-700 text-sm p-4 bg-green-50 rounded-xl border border-green-200 mb-5"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 20,
                  }}
                >
                  <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600" />
                  <span className="font-medium">Transaction successful!</span>
                  {txHash && (
                    <a
                      href={`https://explorer.lens.xyz/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 underline underline-offset-2 hover:text-green-800 font-medium"
                    >
                      View on Explorer
                    </a>
                  )}
                  <span className="ml-2 text-gray-500">(Closing in {countdown}s)</span>
                </motion.div>
              )}

              {error && (
                <motion.div
                  key="error"
                  className="flex items-center justify-center text-red-700 text-sm p-4 bg-red-50 rounded-xl border border-red-200 mb-5"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-red-600" />
                  <span className="font-medium">Error: {error.message?.split("(")?.[0]?.trim() || "Unknown error"}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            {actionsToRender && <div>{actionsToRender}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
