// src/components/OwnerInfoCard.tsx
"use client";

import React from "react";
import { type Address } from "viem";

interface OwnerInfoCardProps {
  ownerAddress: Address;
}

export function OwnerInfoCard({ ownerAddress }: OwnerInfoCardProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 space-y-3">
      <div className="space-y-1">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Expected Owner</span>
        <p className="text-xs font-mono text-text-primary break-all bg-white px-3 py-2 rounded border border-gray-100">{ownerAddress}</p>
      </div>
    </div>
  );
}
