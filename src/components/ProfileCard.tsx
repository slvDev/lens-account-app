"use client";

interface ProfileCardProps {
  username?: string;
  address?: string;
  owner?: string;
  profileImage?: string;
}

export function ProfileCard({ username, address, owner, profileImage }: ProfileCardProps) {
  return (
    <div className="w-full aspect-square bg-card-background border border-border-subtle rounded-lg p-4 flex flex-col items-center justify-center gap-3">
      {/* Profile Image or Placeholder Silhouette */}
      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
        {profileImage ? (
          <img src={profileImage} alt={username || "Profile"} className="w-full h-full object-cover" />
        ) : (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-300">
            {/* User silhouette icon */}
            <circle cx="12" cy="8" r="4" fill="currentColor" />
            <path d="M20 19C20 15.6863 16.4183 13 12 13C7.58172 13 4 15.6863 4 19" fill="currentColor" />
          </svg>
        )}
      </div>

      {/* Username/Address */}
      <div className="text-center space-y-1 w-full">
        {username ? (
          <p className="text-sm font-medium text-text-primary truncate px-1">{username}</p>
        ) : address ? (
          <p className="text-xs font-mono text-text-secondary truncate px-1">
            {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        ) : (
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
        )}
      </div>
    </div>
  );
}
