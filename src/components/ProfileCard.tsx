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
    <div className="w-[215px] h-[305px] bg-white border border-gray-200 rounded-4xl shadow-sm flex flex-col relative">
      {/* Pill-shaped rectangle at the top */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 w-12 h-3 rounded-full bg-gray-200 border border-gray-300"></div>

      {/* Avatar */}
      <div className="flex-1 flex items-center justify-center pt-3">
        <div className="w-48 h-48 rounded-2xl overflow-hidden">
          <svg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="192" height="192" fill="#F9F9F9"></rect>
            <g
              stroke="color(display-p3 0.1725 0.1765 0.1882)"
              strokeMiterlimit="10"
              clipPath="url(#clip0_16190_6133)"
              opacity="0.1"
              style={{ mixBlendMode: "color-burn" }}
            >
              <path d="M419.214 114.219C305.16 75.205 253.988 67.321 228.413 48.325 201.791 29.8 200.733.19 162.334-71.667"></path>
              <path d="M90.614-79.307C124.668-34.83 145.033-.909 158.037 21.76c13.316 23.04 19.271 34.828 31.806 43.797 12.413 9.007 31.406 15.195 67.879 28.282 35.884 12.82 89.247 32.538 157.165 62.409"></path>
              <path d="M410.71 198.307c-72.842-40.289-136.52-70.821-176.467-88.567-41.275-18.516-58.819-24.245-70.242-32.62-11.607-8.292-17.07-19.176-38.335-46.205C105.361 4.805 69.223-37.454 18.613-87.283"></path>
              <path d="M406.652 240.55c-67.743-44.933-142.798-90.43-186.45-115.382-46.37-26.754-61.34-32.945-72.161-40.899-11.004-7.887-17.777-17.477-51.747-49.352C64.704 4.997 5.916-47.209-54.176-95.65M402.767 283.033c-50.259-36.689-140.208-102.496-188.497-137.818-53.357-39.059-65.048-47.667-76.693-56.167-11.698-8.54-23.266-16.93-76.508-55.687C12.899-1.693-76.914-67.128-127.963-104.393M329.704 275.012c-59.981-48.395-119.045-101.038-150.835-131.304-34.169-32.202-41.034-42.041-52.004-49.976-10.813-8.02-25.68-14.082-71.955-40.621C11.353 28.374-63.616-16.825-131.897-61.951"></path>
              <path d="M257.01 267.133c-50.816-50.106-87.228-92.82-107.703-119.272-21.463-27.391-26.957-38.533-38.557-46.893C99.336 92.51 81.905 86.826 40.7 68.471.828 50.87-62.79 20.581-135.926-19.687"></path>
              <path d="M184.567 259.383c-34.307-44.862-54.891-79.215-68.006-102.218-13.457-23.379-19.416-35.406-31.91-44.489-12.371-9.122-31.248-15.298-67.613-28.288-35.806-12.727-89.071-32.265-157.119-62.013"></path>
              <path d="M-144.442 64.4c114.05 38.774 164.858 46.483 190.32 65.723 26.48 18.75 27.589 48.994 66.346 121.639"></path>
              <path d="M39.815 244.203c-29.348-98.188-28.417-98.107-186.617-137.262"></path>
            </g>
            <defs>
              <clipPath id="clip0_16190_6133">
                <path fill="#fff" d="m-162.439 223.627 34.53-328.526 565.206 59.405-34.53 328.527z"></path>
              </clipPath>
            </defs>
            <circle cx="96" cy="222.222" r="88.8889" fill="#E5E5E5"></circle>
            <circle cx="96" cy="78.2219" r="40.8889" fill="#E5E5E5"></circle>
          </svg>
        </div>
      </div>

      {/* Skeleton loaders */}
      <div className="pb-5 flex flex-col items-center gap-2">
        <div className="h-3 bg-gray-200 rounded w-24"></div>
        <div className="h-2.5 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  );
}
