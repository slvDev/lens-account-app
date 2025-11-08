// src/lib/lens/client.ts
import { PublicClient, mainnet } from "@lens-protocol/client";

// Create client without custom fragments - use SDK's built-in fragments
export const client = PublicClient.create({
  environment: mainnet,
  // Add origin for browser environments
  origin: typeof window !== "undefined" ? window.location.origin : "https://lens-account-app.vercel.app",
});
