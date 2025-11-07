// components/ConnectOwnerButton.tsx
"use client";

import { ConnectKitButton } from "connectkit";
import { Button } from "./Button";

export function ConnectOwnerButton() {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, show, truncatedAddress, ensName }) => {
        return (
          <Button onClick={show} variant="primary" size="md" wide={false}>
            {isConnected ? (ensName ?? truncatedAddress) : "Connect Wallet"}
          </Button>
        );
      }}
    </ConnectKitButton.Custom>
  );
}
