'use client';

import React from 'react';
import { SITE_CONFIG } from '@/config/site';

export default function Footer() {
  return (
    <footer className="bg-[#161324] border-t-4 border-black text-gray-400 mt-16 py-8 select-none">
      <div className="max-w-[1600px] mx-auto px-4 flex flex-col items-center justify-center gap-3 text-center">
        {/* Little Keychain Mini Logo */}
        <div className="flex items-center gap-2">
          <img
            src="/images/logo-transparent.png"
            alt="Cartuchos Zone"
            className="h-9 w-auto object-contain opacity-80"
          />
          <span className="font-pixel text-[10px] text-amber-400">
            {SITE_CONFIG.name} {SITE_CONFIG.highlightName}
          </span>
        </div>

        <p className="font-silkscreen text-xs text-gray-400">
          ★ THANK YOU FOR PLAYING! • COLEÇÃO RETRÔ 16-BIT SUPER NINTENDO ★
        </p>

        <p className="font-pixel text-[8px] text-gray-500">
          © 2026 {SITE_CONFIG.name} {SITE_CONFIG.highlightName}. TODOS OS DIREITOS RESERVADOS.
        </p>
      </div>
    </footer>
  );
}
