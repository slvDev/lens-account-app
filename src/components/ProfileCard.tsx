"use client";

// interface ProfileCardProps {
//   username?: string;
//   address?: string;
//   owner?: string;
//   displayName?: string;
// }

export function ProfileCard() {
  // export function ProfileCard({ username, address, owner, displayName }: ProfileCardProps) {
  return (
    <div className="w-[215px] h-[305px] bg-white border border-gray-200 rounded-4xl flex flex-col relative">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-10 h-4 rounded-full bg-gray-50 border border-gray-200"></div>

      {/* Avatar */}
      <div className="flex-1 flex items-center justify-center pt-3">
        <div className="w-48 h-48 rounded-2xl overflow-hidden">
          <svg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="192" height="192" fill="#F9F9F9"></rect>
            <circle cx="96" cy="222.222" r="88.8889" fill="#E5E5E5"></circle>
            <circle cx="96" cy="78.2219" r="40.8889" fill="#E5E5E5"></circle>
          </svg>
        </div>
      </div>

      {/* Skeleton loaders */}
      <div className="pb-4 flex flex-col items-center gap-2">
        <div className="h-3.5 bg-gray-100 rounded w-32"></div>
        <div className="h-3 bg-gray-100 rounded w-24"></div>
      </div>
    </div>
  );
}
