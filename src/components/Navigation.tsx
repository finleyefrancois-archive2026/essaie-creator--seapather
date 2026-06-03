/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Anchor, Compass, PenTool, Radio } from 'lucide-react';

interface NavigationProps {
  currentTab: 'dashboard' | 'analyst' | 'logbook';
  onChangeTab: (tab: 'dashboard' | 'analyst' | 'logbook') => void;
  activeAlertCount: number;
}

export default function Navigation({ currentTab, onChangeTab, activeAlertCount }: NavigationProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-bento-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        
        {/* Title Logo */}
        <div className="flex items-center space-x-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-bento-accent to-blue-600 shadow-md shadow-bento-accent/20">
            <Anchor className="h-5 w-5 text-bento-bg" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bento-accent opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-bento-accent animate-pulse"></span>
            </span>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white sm:text-base">
              Mascareignes Ocean
            </h1>
            <p className="text-[10px] font-medium text-bento-accent/80 tracking-widest uppercase">
              Surveillance Copernicus
            </p>
          </div>
        </div>

        {/* Global Stats / Status Badge */}
        <div className="hidden md:flex items-center space-x-2 rounded-full border border-bento-accent/20 bg-bento-accent/10 px-3.5 py-1 text-xs text-bento-accent font-semibold">
          <span className="h-2 w-2 rounded-full bg-bento-accent animate-pulse" />
          <span>AGENTS ACTIFS : GEMINI + COPERNICUS</span>
        </div>

        {/* Action Tabs for Navigation */}
        <nav className="flex space-x-1 p-1 bg-bento-card rounded-xl border border-white/5">
          <button
            id="nav-tab-dashboard"
            onClick={() => onChangeTab('dashboard')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              currentTab === 'dashboard'
                ? 'bg-bento-accent text-bento-bg shadow-sm shadow-bento-accent/30 font-bold'
                : 'text-bento-text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tableau de bord</span>
            <span className="sm:hidden">Moniteur</span>
          </button>

          <button
            id="nav-tab-analyst"
            onClick={() => onChangeTab('analyst')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              currentTab === 'analyst'
                ? 'bg-bento-accent text-bento-bg shadow-sm shadow-bento-accent/30 font-bold'
                : 'text-bento-text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Analyste IA</span>
          </button>

          <button
            id="nav-tab-logbook"
            onClick={() => onChangeTab('logbook')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              currentTab === 'logbook'
                ? 'bg-bento-accent text-bento-bg shadow-sm shadow-bento-accent/30 font-bold'
                : 'text-bento-text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <PenTool className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Journal côtier</span>
            <span className="sm:hidden">Journal</span>
          </button>
        </nav>

      </div>
    </header>
  );
}
