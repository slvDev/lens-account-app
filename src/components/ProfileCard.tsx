"use client";

import { motion } from "framer-motion";

interface ProfileCardProps {
  username?: string;
  displayName?: string;
  avatar?: string;
}

export function ProfileCard({ username, displayName, avatar }: ProfileCardProps = {}) {
  // Determine if this is an authenticated card (has data) or anonymous
  const hasData = username || displayName || avatar;
  const isLarge = hasData;

  // Size classes based on whether we have data
  const sizeClasses = isLarge ? "w-[296px] h-[420px]" : "w-[215px] h-[305px]";

  // Avatar size classes
  const avatarSizeClasses = isLarge ? "w-64 h-64" : "w-48 h-48";

  return (
    <motion.div
      className={`${sizeClasses} bg-white border border-gray-200 rounded-4xl flex flex-col relative ${hasData ? "shadow-xl" : ""}`}
      initial={hasData ? { opacity: 0, scale: 0.9 } : undefined}
      animate={hasData ? { opacity: 1, scale: 1 } : undefined}
      transition={
        hasData
          ? {
              duration: 0.5,
              type: "spring",
              stiffness: 260,
              damping: 20,
            }
          : undefined
      }
    >
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-10 h-4 rounded-full bg-gray-50 border border-gray-200"></div>

      {/* Avatar */}
      <div className="flex-1 flex items-center justify-center pt-3">
        <div className={`${avatarSizeClasses} rounded-2xl overflow-hidden`}>
          {avatar ? (
            <img src={avatar} alt={displayName || username || "Profile"} className="w-full h-full object-cover" />
          ) : (
            <svg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="192" height="192" fill="#F9F9F9"></rect>
              <circle cx="96" cy="222.222" r="88.8889" fill="#E5E5E5"></circle>
              <circle cx="96" cy="78.2219" r="40.8889" fill="#E5E5E5"></circle>
            </svg>
          )}
        </div>
      </div>

      {/* User info or skeleton */}
      <div className="pb-6 flex flex-col items-center gap-2">
        {hasData ? (
          <>
            {username && (
              <div className="flex text-xl text-gray-900">
                <p className="text-gray-400">@</p>
                {username}
              </div>
            )}
            {displayName && <div className="text-xl text-gray-400">{displayName}</div>}
          </>
        ) : (
          <>
            <div className="h-3.5 bg-gray-100 rounded w-32"></div>
            <div className="h-3 bg-gray-100 rounded w-24"></div>
          </>
        )}
      </div>
    </motion.div>
  );
}
