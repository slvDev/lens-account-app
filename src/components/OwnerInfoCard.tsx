// src/components/OwnerInfoCard.tsx
"use client";

import React from "react";
import { type Address } from "viem";

interface OwnerInfoCardProps {
  ownerAddress: Address;
}

export function OwnerInfoCard({ ownerAddress }: OwnerInfoCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-900">Owner</p>
          <p className="text-xs text-gray-500 mt-1">Connect with this wallet to manage your Lens account</p>
        </div>

        <div>
          <code className="text-xs font-mono text-gray-700 bg-gray-50 px-3 py-2 rounded-lg block break-all">{ownerAddress}</code>
        </div>
      </div>
    </div>
  );
}
