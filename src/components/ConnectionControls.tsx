// src/components/ConnectionControls.tsx
"use client";

import React from "react";
import { Button } from "@/components/Button";
import { ConnectOwnerButton } from "@/components/ConnectOwnerButton";

interface ConnectionControlsProps {
  isConnected: boolean;
  connectedChainId: number | undefined;
  expectedChainId: number;
  onClear: () => void;
}

export function ConnectionControls({ isConnected, connectedChainId, expectedChainId, onClear }: ConnectionControlsProps) {
  const isWrongChain = isConnected && connectedChainId !== expectedChainId;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button onClick={onClear} variant="secondary" size="md" wide={false}>
          Clear
        </Button>
        <div className="flex-1">
          {isConnected ? (
            <Button variant="primary" size="md" wide disabled>
              Wallet Connected
            </Button>
          ) : (
            <ConnectOwnerButton />
          )}
        </div>
      </div>

      {isWrongChain && (
        <div className="text-xs text-orange-600 px-3 py-2 bg-orange-50 border border-orange-200 rounded">Please switch to the Lens Chain</div>
      )}
    </div>
  );
}
