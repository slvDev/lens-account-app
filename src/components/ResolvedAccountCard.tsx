// src/components/ResolvedAccountCard.tsx
"use client";

import React from "react";
import { type Address } from "viem";

interface ResolvedAccountCardProps {
  username?: string;
  address: Address;
}

export function ResolvedAccountCard({ username, address }: ResolvedAccountCardProps) {
  return (
    <div className="bg-gray-50 border border-green-200 rounded-lg p-5 space-y-3">
      {username && (
        <div className="space-y-1">
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Username</span>
          <p className="text-base font-semibold text-text-primary">{username}</p>
        </div>
      )}

      <div className="space-y-1">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Account Address</span>
        <p className="text-xs font-mono text-text-primary break-all bg-white px-3 py-2 rounded border border-border-subtle">{address}</p>
      </div>

      {!username && <p className="text-xs text-text-secondary italic">No username registered for this address</p>}
    </div>
  );
}
