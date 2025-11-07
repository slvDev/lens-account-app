// src/app/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { ConnectKitProvider } from "connectkit";
import { config } from "@/lib/wagmi";
import React, { useState } from "react";
import { LensAccountProvider } from "@/contexts/LensAccountContext";
import { WalletConnectProvider } from "@/contexts/WalletConnectProvider";

type Props = {
  children: React.ReactNode;
};

export function Providers({ children }: Props) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          <LensAccountProvider>
            <WalletConnectProvider>{children}</WalletConnectProvider>
          </LensAccountProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
