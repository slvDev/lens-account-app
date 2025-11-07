// src/components/layout/LeftPanelFooter.tsx
"use client";

import React from "react";

export function LeftPanelFooter() {
  return (
    <footer className="mt-auto p-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-secondary w-full">
        <div className="flex items-center gap-4">
          <span>© 2025 Lens Labs</span>
          <a href="https://www.lens.xyz/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition-colors">
            Privacy
          </a>
          <a href="https://www.lens.xyz/terms" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition-colors">
            Terms
          </a>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/vicnaum/lens-account-app"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-primary transition-colors"
          >
            Developers
          </a>
          <a href="https://fkng.social" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition-colors">
            FKNG.SOCIAL
          </a>
        </div>
      </div>
    </footer>
  );
}
