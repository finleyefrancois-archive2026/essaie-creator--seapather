/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { OceanCell, FieldLog } from './types';
import { generateOceanGrid, isUpwelling } from './data';
import Navigation from './components/Navigation';
import OceanGrid from './components/OceanGrid';
import UnderWaterChart from './components/UnderWaterChart';
import AnalystChat from './components/AnalystChat';
import UpwellingAlerts from './components/UpwellingAlerts';
import Logbook from './components/Logbook';
import { Anchor, Waves, AlertCircle, Compass, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'analyst' | 'logbook'>('dashboard');
  
  // Grid simulation offset - allows simulating daily changes in data maps
  const [dayOffset, setDayOffset] = useState<number>(0);
  
  // State for loaded grid data based on selected dayOffset
  const gridData = useMemo(() => {
    return generateOceanGrid(dayOffset);
  }, [dayOffset]);

  // Selected coordinate cell (defaults to Le Morne Upwelling area)
  const [selectedCell, setSelectedCell] = useState<OceanCell>(() => {
    const defaultCell = generateOceanGrid(0).find(c => c.name?.includes("Morne")) 
      || generateOceanGrid(0)[0];
    return defaultCell;
  });

  // Since gridData updates dynamically when sliding days, we must keep selectedCell synced
  const activeSelectedCell = useMemo(() => {
    return gridData.find(c => Math.abs(c.lat - selectedCell.lat) < 0.01 && Math.abs(c.lon - selectedCell.lon) < 0.01) || selectedCell;
  }, [gridData, selectedCell]);

  // Saved Logs (local storage)
  const [logs, setLogs] = useState<FieldLog[]>([]);

  useEffect(() => {
    const data = localStorage.getItem('mascareignes_coastal_logs');
    if (data) {
      try {
        setLogs(JSON.parse(data));
      } catch (err) {
        console.error("Failed to parse field logs:", err);
      }
    }
  }, []);

  const handleSaveLog = (newLog: Omit<FieldLog, 'id' | 'timestamp'>) => {
    const fullLog: FieldLog = {
      ...newLog,
      id: Math.random().toString(),
      timestamp: new Date().toISOString()
    };
    const updated = [fullLog, ...logs];
    setLogs(updated);
    localStorage.setItem('mascareignes_coastal_logs', JSON.stringify(updated));
    
    // Auto trigger tab switch to Logbook so user knows it succeeded!
    setCurrentTab('logbook');
  };

  const handleDeleteLog = (id: string) => {
    const filtered = logs.filter(l => l.id !== id);
    setLogs(filtered);
    localStorage.setItem('mascareignes_coastal_logs', JSON.stringify(filtered));
  };

  const handleFocusCellFromLog = (lat: number, lon: number) => {
    const cell = gridData.find(c => Math.abs(c.lat - lat) < 0.01 && Math.abs(c.lon - lon) < 0.01);
    if (cell) {
      setSelectedCell(cell);
      setCurrentTab('dashboard');
    }
  };

  // Compile general grid diagnostics to display in quick mobile status headers
  const gridStats = useMemo(() => {
    const activeUpwellings = gridData.filter(isUpwelling).length;
    let sumSST = 0;
    let maxChloro = 0;
    gridData.forEach(c => {
      sumSST += c.sst;
      if (c.chlorophyll > maxChloro) maxChloro = c.chlorophyll;
    });
    const avgSST = sumSST / gridData.length;

    return {
      activeUpwellings,
      avgSST: Number(avgSST.toFixed(1)),
      maxChloro: Number(maxChloro.toFixed(2))
    };
  }, [gridData]);

  return (
    <div className="min-h-screen bg-bento-bg text-bento-text flex flex-col font-sans transition-color selection:bg-bento-accent selection:text-bento-bg pb-16">
      
      {/* Upper Navigation Header */}
      <Navigation 
        currentTab={currentTab} 
        onChangeTab={setCurrentTab} 
        activeAlertCount={gridStats.activeUpwellings} 
      />

      {/* Main Container Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 sm:px-6 sm:py-6 space-y-4">
        
        {/* Mobile Quick-Consultation Stat HUD Banner (Saves time & screen estate) */}
        <div id="stat-hud-banner" className="grid grid-cols-3 gap-2 bg-bento-card p-3.5 rounded-2xl border border-white/5 text-center shadow-lg">
          
          <div className="border-r border-white/5 pr-1.5 flex flex-col justify-center">
            <span className="text-[9.5px] font-bold text-bento-text-muted uppercase tracking-wider block">Zone SST Moyenne</span>
            <span className="text-sm sm:text-base font-black text-white font-mono mt-0.5">{gridStats.avgSST}°C</span>
            <span className="text-[8.5px] text-bento-text-muted/60 hidden sm:inline">Normales saisonnières</span>
          </div>

          <div className="border-r border-white/5 px-1.5 flex flex-col justify-center">
            <span className="text-[9.5px] font-bold text-bento-accent-alt uppercase tracking-wider block">Upwellings Actifs</span>
            <span className="text-sm sm:text-base font-black text-bento-accent-alt font-mono mt-0.5 flex items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-bento-accent-alt animate-pulse mr-1" />
              {gridStats.activeUpwellings}
            </span>
            <span className="text-[8.5px] text-bento-text-muted/60 hidden sm:inline">SST anomalies</span>
          </div>

          <div className="pl-1.5 flex flex-col justify-center">
            <span className="text-[9.5px] font-bold text-bento-accent uppercase tracking-wider block">Chlorophylle Max</span>
            <span className="text-sm sm:text-base font-black text-bento-accent font-mono mt-0.5">{gridStats.maxChloro} <span className="text-[8.5px] font-normal text-bento-text-muted/80">mg/m³</span></span>
            <span className="text-[8.5px] text-bento-text-muted/60 hidden sm:inline">Nutriments de fond</span>
          </div>

        </div>

        {/* Dynamic Timeline Slider Selector (Ex: Simulate time changes/Copernicus historical drift) */}
        <div className="bg-bento-card border border-white/5 px-4 py-3 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 shadow-lg">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-bento-accent" />
            <div>
              <p className="text-xs font-bold text-white">Archives & Historique Copernicus • Bento Grid</p>
              <p className="text-[9.5px] text-bento-text-muted">Glissement temporel sur les 30 derniers jours</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5 flex-1 max-w-sm ml-0 sm:ml-4">
            <span className="text-[10px] font-mono text-bento-text-muted/70">J-30</span>
            <input
              id="time-drift-slider"
              type="range"
              min="0"
              max="29"
              value={dayOffset}
              onChange={(e) => setDayOffset(Number(e.target.value))}
              className="flex-1 h-1 bg-bento-bg rounded-lg appearance-none cursor-pointer accent-bento-accent"
            />
            <span className="text-[10.5px] font-mono font-bold text-bento-accent animate-pulse">
              {dayOffset === 29 ? "Aujourd'hui" : `J-${29 - dayOffset}`}
            </span>
          </div>
        </div>

        {/* Tab Routing content panels */}
        <div id="tab-router-container">
          
          {/* TAB 1: Tableau de Bord (Main interactive map) */}
          {currentTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Left Column: Grid Visualizer */}
              <div className="lg:col-span-8 space-y-4">
                <OceanGrid 
                  grid={gridData}
                  selectedCell={activeSelectedCell}
                  onSelectCell={setSelectedCell}
                />
              </div>

              {/* Right Column: Alerts Monitor & Instant charts */}
              <div className="lg:col-span-4 space-y-4">
                
                <UpwellingAlerts 
                  grid={gridData}
                  selectedCell={activeSelectedCell}
                  onSelectCell={setSelectedCell}
                />

                <UnderWaterChart 
                  lat={activeSelectedCell.lat} 
                  lon={activeSelectedCell.lon} 
                />

                {/* Instant prompt button targeting the AI Analyst */}
                <div className="bg-gradient-to-r from-bento-card/30 to-bento-accent/10 border border-bento-accent/10 p-4 rounded-2xl flex items-center justify-between shadow-md">
                  <div className="space-y-1 pr-4">
                    <p className="text-xs font-bold text-white flex items-center">
                      <Sparkles className="h-3.5 w-3.5 text-bento-accent mr-1.5" />
                      Rapport Océanologique Approfondi
                    </p>
                    <p className="text-[10px] text-bento-text-muted/80 leading-snug">
                      Générez une expertise IA du point sélectionné auprès de Gemini 1.5 Flash.
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentTab('analyst')}
                    className="flex-none px-4 py-2.5 rounded-xl bg-bento-accent hover:bg-bento-accent/80 text-bento-bg text-xs font-black select-none cursor-pointer shadow-md shadow-bento-accent/10 transition-all font-mono"
                  >
                    SONDER
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: Analyst Chat (Direct full page interface) */}
          {currentTab === 'analyst' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Left Column: Quick reminder coordinates specs */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-bento-card p-4 rounded-2xl border border-white/5 shadow-md">
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider mb-2.5">
                    Coordonnée active envoyée
                  </h3>
                  
                  <div className="space-y-2 font-mono text-[11px] bg-bento-bg p-3 rounded-xl border border-white/5 text-bento-text-muted">
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span>Latitude :</span>
                      <strong className="text-white">{Math.abs(activeSelectedCell.lat).toFixed(2)}°S</strong>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span>Longitude :</span>
                      <strong className="text-white">{activeSelectedCell.lon.toFixed(2)}°E</strong>
                    </div>
                    {activeSelectedCell.name && (
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span>Zone locale :</span>
                        <strong className="text-bento-accent truncate max-w-[120px]">{activeSelectedCell.name}</strong>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span>Temp de surface (SST) :</span>
                      <strong className="text-white">{activeSelectedCell.sst}°C</strong>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span>Nutrient Chlorophylle :</span>
                      <strong className="text-emerald-400">{activeSelectedCell.chlorophyll} mg/m³</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Courants actuels :</span>
                      <strong className="text-white">{activeSelectedCell.currentSpeed} m/s</strong>
                    </div>
                  </div>

                  <p className="text-[10px] text-bento-text-muted/60 leading-snug mt-3">
                    Cette télémétrie alimente directement les capacités d'analyse de l'ingénieur IA pour concevoir des conseils personnalisés aux pêcheurs de Maurice.
                  </p>
                </div>

                <div className="bg-bento-card/40 border border-white/5 p-4 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-bento-text-muted flex items-center">
                    <HelpCircle className="h-3.5 w-3.5 text-bento-accent mr-2" />
                    Exemples de questions à poser :
                  </h4>
                  <ul className="text-[10px] text-bento-text-muted/70 space-y-1.5 pl-1">
                    <li className="hover:text-white cursor-pointer italic">"Est-ce prudent de sortir en pirogue avec ces courants ?"</li>
                    <li className="hover:text-white cursor-pointer italic">"Pourquoi la forte teneur en chlorophylle attire le pélagique ?"</li>
                    <li className="hover:text-white cursor-pointer italic">"Qu'est-ce que l'anomalie saisonnière observée au Morne ?"</li>
                  </ul>
                </div>
              </div>

              {/* Right Column: Chat layout */}
              <div className="lg:col-span-8">
                <AnalystChat 
                  selectedCell={activeSelectedCell}
                  onSaveLog={handleSaveLog}
                />
              </div>

            </div>
          )}

          {/* TAB 3: Coastal Logbook (Local storage observations log) */}
          {currentTab === 'logbook' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Left Column: Persistent observations list */}
              <div>
                <Logbook 
                  logs={logs}
                  onDeleteLog={handleDeleteLog}
                  onFocusCell={handleFocusCellFromLog}
                  grid={gridData}
                />
              </div>

              {/* Right Column: Educational dynamic scientific facts & guides */}
              <div className="bg-gradient-to-br from-bento-card to-bento-bg p-5 rounded-2xl border border-white/5 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="h-10 w-10 rounded-xl bg-bento-bg border border-white/10 flex items-center justify-center mb-4 text-bento-accent">
                    <Anchor className="h-5 w-5" />
                  </div>

                  <h3 className="text-sm font-bold text-white mb-2">Guide d'Interprétation Mascareignes</h3>
                  <p className="text-xs text-bento-text-muted/80 leading-relaxed space-y-2 mb-4">
                    Le Mascareignes Ocean Dashboard compile quotidiennement les données spatiales Copernicus pour l'océanographie physique et biogéochimique. 
                  </p>

                  <div className="space-y-3.5 text-[11px] text-bento-text-muted">
                    
                    <div className="p-3 rounded-lg bg-bento-bg border border-white/5">
                      <p className="font-bold text-emerald-400">⚡ Comment repérer la Bonite et le Thon Blanc ?</p>
                      <p className="text-bento-text-muted/60 text-[10.5px] mt-1">
                        Ces grands migrateurs suivent les fronts thermiques (gradients où l'eau tiède côtière de 25.8°C côtoie les upwellings froids riches en nutriments à 24.1°C). Sillonnez ces contours !
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-bento-bg border border-white/5">
                      <p className="font-bold text-bento-accent">🌀 L'impact du Courant Équatorial Sud</p>
                      <p className="text-bento-text-muted/60 text-[10.5px] mt-1">
                        Le flux dominant se heurte au plateau sous-marin Est de l'île Maurice face au Banc de Soudan. Cette collision remonte les nutriments, créant des puits biologiques exceptionnels.
                      </p>
                    </div>

                  </div>
                </div>

                <div className="text-[9.5px] text-bento-text-muted/40 font-mono text-center pt-4 border-t border-white/5 mt-4">
                  Généré en conformité avec Copernicus Marine Service Data 2026.
                </div>
              </div>

            </div>
          )}

        </div>

      </main>
    </div>
  );
}

// Icon Helper
function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}
