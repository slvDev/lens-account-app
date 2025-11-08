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
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="space-y-4">
        {username ? (
          <>
            <div>
              <p className="text-2xl font-medium text-gray-900">@{username}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Account address</p>
              <code className="text-xs font-mono text-gray-700 bg-gray-50 px-3 py-2 rounded-lg block truncate">{address}</code>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-sm font-medium text-gray-900">Lens Account</p>
              <p className="text-xs text-gray-500 mt-1">No username set</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Account address</p>
              <code className="text-xs font-mono text-gray-700 bg-gray-50 px-3 py-2 rounded-lg block truncate">{address}</code>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
