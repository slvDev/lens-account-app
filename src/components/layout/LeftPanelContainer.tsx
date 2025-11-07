// src/components/layout/LeftPanelContainer.tsx
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LeftPanelFooter } from "./LeftPanelFooter";

interface LeftPanelContainerProps {
  children: React.ReactNode;
  variant?: "login" | "dashboard";
  animationKey?: string;
  onAnimationComplete?: () => void;
}

export function LeftPanelContainer({ children, variant = "login", animationKey, onAnimationComplete }: LeftPanelContainerProps) {
  return (
    <div className="w-full lg:w-1/2 flex flex-col min-h-screen bg-white z-10 border-r border-gray-200 shadow-lg">
      <AnimatePresence mode="wait">
        <motion.div
          key={animationKey || variant}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          onAnimationComplete={onAnimationComplete}
          className="flex flex-col min-h-screen w-full"
        >
          {variant === "login" ? (
            <>
              {/* Login variant: centered content */}
              <div className="flex-1 px-6 md:px-12 lg:px-16 flex items-center justify-center">
                <div className="max-w-lg w-full space-y-8">{children}</div>
              </div>
              <LeftPanelFooter />
            </>
          ) : (
            <>
              {/* Dashboard variant: scrollable content */}
              <div className="flex-1 overflow-y-auto px-6 md:px-12 lg:px-16 py-10">{children}</div>
              <LeftPanelFooter />
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
