// src/components/LoginHeader.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";

export function LoginHeader() {
  return (
    <motion.div
      layout
      layoutId="header-container"
      className="flex flex-col items-center gap-8"
      transition={{
        layout: {
          duration: 0.4,
          type: "spring",
          stiffness: 300,
          damping: 30,
        },
      }}
    >
      <motion.div
        layout
        layoutId="logo"
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
        className="w-[107px] h-[69px] flex items-center justify-center"
      >
        <svg width="107" height="69" viewBox="0 0 107 69" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M86.52 13.8071C81.5327 13.8071 77.0576 15.7971 73.6474 19.0087L73.2969 18.8303C72.5152 8.30345 64.1042 0 53.5635 0C43.0228 0 34.6118 8.30345 33.83 18.8303L33.4796 19.0087C30.0693 15.7971 25.5943 13.8071 20.607 13.8071C9.54059 13.8071 0.563477 22.9477 0.563477 34.2294C0.563477 43.974 10.0663 52.3323 12.4251 54.2538C23.5185 63.2434 37.9681 68.5 53.5635 68.5C69.1588 68.5 83.6085 63.2434 94.7018 54.2538C97.0742 52.3323 106.563 43.9877 106.563 34.2294C106.563 22.9477 97.5864 13.8071 86.5065 13.8071H86.52Z"
            fill="currentColor"
          />
        </svg>
      </motion.div>
      <motion.h1
        layout
        layoutId="title"
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: {
            delay: 0.1,
            duration: 0.3,
            type: "spring",
            stiffness: 260,
            damping: 20,
          },
        }}
        className="text-4xl font-normal text-foreground tracking-tight"
      >
        Your account awaits.
      </motion.h1>
    </motion.div>
  );
}
