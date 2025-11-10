// contexts/LensAccountContext.tsx
"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";
import { type Address } from "viem";
import { type LensProfileMetadata } from "@/lib/lens/service";

interface LensAccountState {
  lensAccountAddress: Address | null;
  ownerAddress: Address | null;
  profileMetadata: LensProfileMetadata | null;
  setVerifiedAccount: (lensAddress: Address, ownerAddress: Address) => void;
  setProfileMetadata: (metadata: LensProfileMetadata | null) => void;
  clearAccount: () => void;
}

const LensAccountContext = createContext<LensAccountState | undefined>(undefined);

interface LensAccountProviderProps {
  children: ReactNode;
}

export function LensAccountProvider({ children }: LensAccountProviderProps) {
  const [lensAccountAddress, setLensAccountAddress] = useState<Address | null>(null);
  const [ownerAddress, setOwnerAddress] = useState<Address | null>(null);
  const [profileMetadata, setProfileMetadata] = useState<LensProfileMetadata | null>(null);

  const setVerifiedAccount = (lensAddress: Address, verifiedOwnerAddress: Address) => {
    setLensAccountAddress(lensAddress);
    setOwnerAddress(verifiedOwnerAddress);
    console.log("Context Updated: Lens Account Set ->", lensAddress);
    console.log("Context Updated: Owner Set ->", verifiedOwnerAddress);
  };

  const clearAccount = () => {
    setLensAccountAddress(null);
    setOwnerAddress(null);
    setProfileMetadata(null);
    console.log("Context Updated: Account Cleared");
  };

  const value = {
    lensAccountAddress,
    ownerAddress,
    profileMetadata,
    setVerifiedAccount,
    setProfileMetadata,
    clearAccount,
  };

  return <LensAccountContext.Provider value={value}>{children}</LensAccountContext.Provider>;
}

// Custom hook to use the context
export function useLensAccount() {
  const context = useContext(LensAccountContext);
  if (context === undefined) {
    throw new Error("useLensAccount must be used within a LensAccountProvider");
  }
  return context;
}
