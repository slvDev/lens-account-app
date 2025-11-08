// src/lib/lens/service.ts
import { type Address } from "viem";
import { fetchAccount } from "@lens-protocol/client/actions";
import { client } from "./client";

// Profile metadata structure - only what we actually use
export interface LensProfileMetadata {
  id: string;
  handle?: string;
  name?: string;
  avatar?: string;
}

/**
 * Fetches profile metadata from Lens using address (owner or account address)
 * @param address - The address (can be owner wallet or Lens account address)
 * @returns Profile metadata or null if not found
 */
export async function fetchLensProfile(address: Address): Promise<LensProfileMetadata | null> {
  try {
    // Fetch account using the address
    const result = await fetchAccount(client, {
      address,
    });

    // Check if result is an error
    if (result.isErr()) {
      console.error("❌ [Lens SDK] Error:", result.error);
      return null;
    }

    // Unwrap the successful result
    const account = result.value;

    if (!account) {
      return null;
    }

    // Transform the SDK response into our metadata structure
    const metadata: LensProfileMetadata = {
      id: account.address?.toString() || address,
      handle: account.username?.localName,
      name: account.metadata?.name || undefined,
      avatar: account.metadata?.picture || undefined,
    };

    return metadata;
  } catch (error) {
    console.error("❌ [Lens SDK] Unexpected error:", error);
    return null;
  }
}
