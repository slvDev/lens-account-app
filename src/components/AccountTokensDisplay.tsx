// components/AccountTokensDisplay.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useReadContract, useBalance } from "wagmi";
import { formatUnits, type Address } from "viem";
import { useLensAccount } from "@/contexts/LensAccountContext";
import { ERC20_ABI, WGHO_TOKEN_ADDRESS, BONSAI_TOKEN_ADDRESS, LENS_CHAIN_ID, lensChain, NATIVE_GHO_ADDRESS } from "@/lib/constants";
import { SendModal } from "@/components/modals/SendModal";
import { ApproveModal } from "@/components/modals/ApproveModal";
import { WrapModal } from "@/components/modals/WrapModal";
import { UnwrapModal } from "@/components/modals/UnwrapModal";
import { motion } from "framer-motion";

// Import necessary icons from Heroicons
import { PaperAirplaneIcon, CircleStackIcon, ArrowDownOnSquareIcon, ArrowUpOnSquareIcon } from "@heroicons/react/24/outline";

// Token icon size constant
const TOKEN_ICON_SIZE = 48;

// Define color variants for buttons
type ButtonVariant = "send" | "approve" | "wrap" | "unwrap";

// Update ActionButtonProps to include an optional icon and variant
interface ActionButtonProps {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
}

// ActionButton component with text labels
function ActionButton({ label, icon: Icon, onClick, disabled = false, variant = "send" }: ActionButtonProps) {
  // Define color schemes for each variant
  const getColorClasses = () => {
    switch (variant) {
      case "send":
        return "text-gray-600 hover:text-green-600 hover:text-green-700";
      case "approve":
        return "text-gray-600 hover:text-blue-600 hover:text-blue-700";
      case "wrap":
        return "text-gray-600 hover:text-purple-600 hover:text-purple-700";
      case "unwrap":
        return "text-gray-600 hover:text-orange-600 hover:text-orange-700";
      default:
        return "text-gray-600 hover:text-gray-700 hover:bg-gray-50";
    }
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-3 py-1 text-xs font-medium rounded-lg transition-colors duration-150 cursor-pointer
        flex items-center gap-1
        ${getColorClasses()}
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none
      `}
    >
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </motion.button>
  );
}

// Define Modal State Type
type ModalType = "send" | "approve" | "wrap" | "unwrap";
interface ModalState {
  type: ModalType | null;
  tokenSymbol: string;
  tokenAddress?: Address;
  decimals: number;
  balance?: bigint;
}

export function AccountTokensDisplay() {
  const { lensAccountAddress } = useLensAccount();
  const [modalState, setModalState] = useState<ModalState>({
    type: null,
    tokenSymbol: "",
    decimals: 18,
  });

  const { data: nativeBalanceData, isLoading: isLoadingNative } = useBalance({
    address: lensAccountAddress as Address | undefined,
    chainId: LENS_CHAIN_ID,
    query: {
      enabled: !!lensAccountAddress,
      refetchInterval: 5000,
      refetchOnWindowFocus: true,
    },
  });

  const { data: wghoBalanceData, isLoading: isLoadingWgho } = useReadContract({
    address: WGHO_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: lensAccountAddress ? [lensAccountAddress] : undefined,
    chainId: LENS_CHAIN_ID,
    query: {
      enabled: !!lensAccountAddress,
      refetchInterval: 5000,
      refetchOnWindowFocus: true,
    },
  });

  const { data: bonsaiBalanceData, isLoading: isLoadingBonsai } = useReadContract({
    address: BONSAI_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: lensAccountAddress ? [lensAccountAddress] : undefined,
    chainId: LENS_CHAIN_ID,
    query: {
      enabled: !!lensAccountAddress,
      refetchInterval: 5000,
      refetchOnWindowFocus: true,
    },
  });

  const isLoadingBalances = isLoadingNative || isLoadingWgho || isLoadingBonsai;

  const formattedNativeBalance = nativeBalanceData ? formatUnits(nativeBalanceData.value, nativeBalanceData.decimals) : "0";
  const formattedWghoBalance = wghoBalanceData ? formatUnits(wghoBalanceData, 18) : "0";
  const formattedBonsaiBalance = bonsaiBalanceData ? formatUnits(bonsaiBalanceData, 18) : "0";

  const handleActionClick = (actionType: ModalType, symbol: string, address?: Address, decimals = 18, balance?: bigint) => {
    console.log(`Opening ${actionType} modal for ${symbol}`, { address, decimals, balance });
    setModalState({ type: actionType, tokenSymbol: symbol, tokenAddress: address, decimals, balance });
  };

  const closeModal = () => {
    setModalState({ type: null, tokenSymbol: "", decimals: 18 });
  };

  if (!lensAccountAddress) {
    return <p className="text-text-secondary">Connect your wallet to view account balances.</p>;
  }

  // Animation variants for staggered appearance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        type: "spring" as const,
        stiffness: 260,
        damping: 20,
      },
    },
  };

  return (
    <motion.div className="w-[70%] space-y-4 mx-auto" variants={containerVariants} initial="hidden" animate="visible">
      {isLoadingBalances && (
        <motion.p className="text-text-secondary text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          Loading balances...
        </motion.p>
      )}

      {/* --- Native GHO Row --- */}
      <motion.div className="bg-gray-50 w-full rounded-3xl p-3" variants={rowVariants}>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <motion.a
              href={`https://explorer.lens.xyz/address/${NATIVE_GHO_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              title="View native GHO token on Lens Chain Explorer"
              className="block"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Image
                src="/tokens/gho.svg"
                alt="GHO icon"
                width={TOKEN_ICON_SIZE}
                height={TOKEN_ICON_SIZE}
                className="rounded pointer-events-none"
                unoptimized
              />
            </motion.a>
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <p className="text-xs text-text-secondary">{lensChain.nativeCurrency.symbol}</p>
            <p className="text-base font-mono text-foreground">{formattedNativeBalance}</p>
          </div>

          <div className="flex items-center gap-1">
            <ActionButton
              label="Wrap"
              icon={ArrowDownOnSquareIcon}
              variant="wrap"
              onClick={() =>
                handleActionClick("wrap", lensChain.nativeCurrency.symbol, undefined, lensChain.nativeCurrency.decimals, nativeBalanceData?.value)
              }
            />
            <ActionButton
              label="Send"
              icon={PaperAirplaneIcon}
              variant="send"
              onClick={() =>
                handleActionClick("send", lensChain.nativeCurrency.symbol, undefined, lensChain.nativeCurrency.decimals, nativeBalanceData?.value)
              }
            />
          </div>
        </div>
      </motion.div>

      {/* --- WGHO Row --- */}
      <motion.div className="bg-gray-50 w-full rounded-3xl p-3" variants={rowVariants}>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <motion.a
              href={`https://explorer.lens.xyz/address/${WGHO_TOKEN_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              title="View WGHO token on Lens Chain Explorer"
              className="block"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Image
                src="/tokens/wgho.svg"
                alt="WGHO icon"
                width={TOKEN_ICON_SIZE}
                height={TOKEN_ICON_SIZE}
                className="rounded pointer-events-none"
                unoptimized
              />
            </motion.a>
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <p className="text-xs text-text-secondary">WGHO</p>
            <p className="text-base font-mono text-foreground">{formattedWghoBalance}</p>
          </div>

          <div className="flex items-center gap-1">
            <ActionButton
              label="Unwrap"
              icon={ArrowUpOnSquareIcon}
              variant="unwrap"
              onClick={() => handleActionClick("unwrap", "WGHO", WGHO_TOKEN_ADDRESS as Address, 18, wghoBalanceData)}
            />
            <ActionButton
              label="Approve"
              icon={CircleStackIcon}
              variant="approve"
              onClick={() => handleActionClick("approve", "WGHO", WGHO_TOKEN_ADDRESS as Address, 18, wghoBalanceData)}
            />
            <ActionButton
              label="Send"
              icon={PaperAirplaneIcon}
              variant="send"
              onClick={() => handleActionClick("send", "WGHO", WGHO_TOKEN_ADDRESS as Address, 18, wghoBalanceData)}
            />
          </div>
        </div>
      </motion.div>

      {/* --- BONSAI Row --- */}
      <motion.div className="bg-gray-50 w-full rounded-3xl p-3" variants={rowVariants}>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <motion.a
              href={`https://explorer.lens.xyz/address/${BONSAI_TOKEN_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              title="View BONSAI token on Lens Chain Explorer"
              className="block"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Image
                src="/tokens/bonsai.svg"
                alt="BONSAI icon"
                width={TOKEN_ICON_SIZE}
                height={TOKEN_ICON_SIZE}
                className="rounded object-cover pointer-events-none"
                unoptimized
              />
            </motion.a>
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <p className="text-xs text-text-secondary">BONSAI</p>
            <p className="text-base font-mono text-foreground">{formattedBonsaiBalance}</p>
          </div>

          <div className="flex items-center gap-1">
            <ActionButton
              label="Approve"
              icon={CircleStackIcon}
              variant="approve"
              onClick={() => handleActionClick("approve", "BONSAI", BONSAI_TOKEN_ADDRESS as Address, 18, bonsaiBalanceData)}
            />
            <ActionButton
              label="Send"
              icon={PaperAirplaneIcon}
              variant="send"
              onClick={() => handleActionClick("send", "BONSAI", BONSAI_TOKEN_ADDRESS as Address, 18, bonsaiBalanceData)}
            />
          </div>
        </div>
      </motion.div>

      {/* --- Render Modals (remain the same) --- */}
      {modalState.type === "send" && (
        <SendModal
          isOpen={true}
          onClose={closeModal}
          tokenSymbol={modalState.tokenSymbol}
          tokenAddress={modalState.tokenAddress}
          decimals={modalState.decimals}
          balance={modalState.balance}
        />
      )}
      {modalState.type === "approve" && modalState.tokenAddress && (
        <ApproveModal
          isOpen={true}
          onClose={closeModal}
          tokenSymbol={modalState.tokenSymbol}
          tokenAddress={modalState.tokenAddress}
          decimals={modalState.decimals}
        />
      )}
      {modalState.type === "wrap" && <WrapModal isOpen={true} onClose={closeModal} balance={modalState.balance} />}
      {modalState.type === "unwrap" && <UnwrapModal isOpen={true} onClose={closeModal} balance={modalState.balance} />}
    </motion.div>
  );
}
