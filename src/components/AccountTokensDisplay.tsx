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

// Import necessary icons from Heroicons
import { PaperAirplaneIcon, CircleStackIcon, ArrowDownOnSquareIcon, ArrowUpOnSquareIcon } from "@heroicons/react/24/outline";

// Define color variants for buttons
type ButtonVariant = "green" | "yellow" | "blue" | "purple" | "default";

// Update ActionButtonProps to include an optional icon and variant
interface ActionButtonProps {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
}

// Modify ActionButton component for icon-top layout with color variants
function ActionButton({ label, icon: Icon, onClick, disabled = false, variant = "default" }: ActionButtonProps) {
  // Simplified minimal color classes
  const getColorClasses = (): {
    bg: string;
    hoverBg: string;
    iconColor: string;
    textColor: string;
    border: string;
  } => {
    // All variants now use the same minimal gray style for consistency
    return {
      bg: "bg-gray-50",
      hoverBg: "bg-gray-100",
      iconColor: "text-text-secondary group-hover:text-text-primary",
      textColor: "text-text-secondary group-hover:text-text-primary",
      border: "border-border-subtle",
    };
  };

  const colors = getColorClasses();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center p-2
        text-center rounded-lg w-[70px] h-[60px]
        ${colors.bg} hover:${colors.hoverBg}
        border ${colors.border}
        transition-all duration-150 ease-in-out
        disabled:opacity-50 disabled:cursor-not-allowed
        disabled:hover:scale-100
        disabled:hover:bg-gray-50 disabled:hover:border-border-subtle
        group
      `}
    >
      <Icon className={`w-5 h-5 mb-1 ${colors.iconColor} transition-colors`} />
      <span className={`text-[11px] font-medium ${colors.textColor} transition-colors`}>{label}</span>
    </button>
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

  return (
    <div className="space-y-4">
      {isLoadingBalances && <p className="text-text-secondary text-sm">Loading balances...</p>}

      {/* --- Native GHO Row --- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <a
            href={`https://explorer.lens.xyz/address/${NATIVE_GHO_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            title="View native GHO token on Lens Chain Explorer"
            className="block hover:opacity-80 transition-opacity"
          >
            <Image src="/tokens/gho.svg" alt="GHO icon" width={40} height={40} className="rounded-full" unoptimized />
          </a>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-text-primary leading-tight">{formattedNativeBalance}</p>
            <p className="text-2xl font-normal text-text-secondary leading-tight ml-2">{lensChain.nativeCurrency.symbol}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <ActionButton
            label="Wrap"
            icon={ArrowDownOnSquareIcon}
            variant="purple"
            onClick={() =>
              handleActionClick("wrap", lensChain.nativeCurrency.symbol, undefined, lensChain.nativeCurrency.decimals, nativeBalanceData?.value)
            }
          />
          <ActionButton
            label="Send"
            icon={PaperAirplaneIcon}
            variant="green"
            onClick={() =>
              handleActionClick("send", lensChain.nativeCurrency.symbol, undefined, lensChain.nativeCurrency.decimals, nativeBalanceData?.value)
            }
          />
        </div>
      </div>

      {/* --- WGHO Row --- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <a
            href={`https://explorer.lens.xyz/address/${WGHO_TOKEN_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            title="View WGHO token on Lens Chain Explorer"
            className="block hover:opacity-80 transition-opacity"
          >
            <Image src="/tokens/wgho.svg" alt="WGHO icon" width={40} height={40} className="rounded-full" unoptimized />
          </a>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-text-primary leading-tight">{formattedWghoBalance}</p>
            <p className="text-2xl font-normal text-text-secondary leading-tight ml-2">WGHO</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <ActionButton
            label="Unwrap"
            icon={ArrowUpOnSquareIcon}
            variant="blue"
            onClick={() => handleActionClick("unwrap", "WGHO", WGHO_TOKEN_ADDRESS as Address, 18, wghoBalanceData)}
          />
          <ActionButton
            label="Approve"
            icon={CircleStackIcon}
            variant="yellow"
            onClick={() => handleActionClick("approve", "WGHO", WGHO_TOKEN_ADDRESS as Address, 18, wghoBalanceData)}
          />
          <ActionButton
            label="Send"
            icon={PaperAirplaneIcon}
            variant="green"
            onClick={() => handleActionClick("send", "WGHO", WGHO_TOKEN_ADDRESS as Address, 18, wghoBalanceData)}
          />
        </div>
      </div>

      {/* --- BONSAI Row --- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <a
            href={`https://explorer.lens.xyz/address/${BONSAI_TOKEN_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            title="View BONSAI token on Lens Chain Explorer"
            className="block hover:opacity-80 transition-opacity"
          >
            <Image src="/tokens/bonsai.svg" alt="BONSAI icon" width={40} height={40} className="rounded-full object-cover" unoptimized />
          </a>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-text-primary leading-tight">{formattedBonsaiBalance}</p>
            <p className="text-2xl font-normal text-text-secondary leading-tight ml-2">BONSAI</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <ActionButton
            label="Approve"
            icon={CircleStackIcon}
            variant="yellow"
            onClick={() => handleActionClick("approve", "BONSAI", BONSAI_TOKEN_ADDRESS as Address, 18, bonsaiBalanceData)}
          />
          <ActionButton
            label="Send"
            icon={PaperAirplaneIcon}
            variant="green"
            onClick={() => handleActionClick("send", "BONSAI", BONSAI_TOKEN_ADDRESS as Address, 18, bonsaiBalanceData)}
          />
        </div>
      </div>

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
    </div>
  );
}
