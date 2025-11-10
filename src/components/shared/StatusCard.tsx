"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/solid";

export type StatusCardVariant = "success" | "error" | "warning" | "info" | "loading";

interface StatusCardProps {
  variant: StatusCardVariant;
  message: string;
  children?: React.ReactNode;
  className?: string;
}

export function StatusCard({ variant, message, children, className = "" }: StatusCardProps) {
  const getStyles = () => {
    switch (variant) {
      case "success":
        return {
          bg: "bg-green-50",
          border: "border-green-200",
          text: "text-green-700",
          icon: <CheckCircleIcon className="w-5 h-5 text-green-600" />,
        };
      case "error":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          text: "text-red-700",
          icon: <XCircleIcon className="w-5 h-5 text-red-600" />,
        };
      case "warning":
        return {
          bg: "bg-orange-50",
          border: "border-orange-200",
          text: "text-orange-700",
          icon: <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />,
        };
      case "info":
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-700",
          icon: <InformationCircleIcon className="w-5 h-5 text-blue-600" />,
        };
      case "loading":
        return {
          bg: "bg-gray-50",
          border: "border-gray-200",
          text: "text-gray-700",
          icon: <ArrowPathIcon className="w-5 h-5 text-gray-600 animate-spin" />,
        };
      default:
        return {
          bg: "bg-gray-50",
          border: "border-gray-200",
          text: "text-gray-700",
          icon: null,
        };
    }
  };

  const styles = getStyles();

  return (
    <motion.div
      className={`flex items-center p-4 rounded-xl border ${styles.bg} ${styles.border} ${styles.text} ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        duration: 0.2,
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
    >
      {styles.icon && <div className="mr-3 flex-shrink-0">{styles.icon}</div>}
      <div className="flex-1">
        <p className="font-medium">{message}</p>
        {children && <div className="mt-2">{children}</div>}
      </div>
    </motion.div>
  );
}
