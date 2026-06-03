/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OceanGrid.tsx
 * Overhauled to deliver a highly gamified, intuitive, video-game style 
 * Tactical Radar Sonar, Nautical GPS Navigator, and Pioneer Mission Board.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { OceanCell, OceanSpot } from '../types';
import { oceanHotspots, isUpwelling } from '../data';
import { 
  AlertCircle, 
  ArrowUp, 
  Compass, 
  Waves, 
  Droplet, 
  Layers,
  Radar, 
  Shield, 
  Trophy, 
  Award, 
  Target, 
  Play, 
  Zap, 
  CheckCircle2, 
  RotateCcw, 
  AlertTriangle, 
  Crosshair, 
  Map, 
  Navigation2, 
  Check, 
  Info,
  Ship,
  Search,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OceanGridProps {
  grid: OceanCell[];
  selectedCell: OceanCell;
  onSelectCell: (cell: OceanCell) => void;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  badge: string;
  xpReward: number;
  conditionDescription: string;
  check: (cell: OceanCell) => boolean;
}

export default function OceanGrid({ grid, selectedCell, onSelectCell }: OceanGridProps) {
  const [viewMode, setViewMode] = useState<'sst' | 'chlorophyll' | 'depth' | 'currents'>('sst');
  const [superimposeCurrents, setSuperimposeCurrents] = useState<boolean>(true);
  const [mapFrame, setMapFrame] = useState<'radar' | 'sensor'>('radar');

  // Coordinates list to build standard grid structure
  const lats = [-19.8, -19.9, -20.0, -20.1, -20.2, -20.3, -20.4, -20.5, -20.6]; // top to bottom
  const lons = [57.0, 57.15, 57.3, 57.45, 57.6, 57.75, 57.9, 58.05, 58.2, 58.35, 58.5]; // left to right

  // --- GAMIFICATION / XP STATE ENGINE ---
  const [xp, setXp] = useState<number>(() => {
    const saved = localStorage.getItem('mascareignes_player_xp');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [level, setLevel] = useState<number>(() => {
    const saved = localStorage.getItem('mascareignes_player_level');
    return saved ? parseInt(saved, 10) : 1;
  });

  const [exploredCells, setExploredCells] = useState<string[]>(() => {
    const saved = localStorage.getItem('mascareignes_explored_cells');
    return saved ? JSON.parse(saved) : [];
  });

  const [completedQuests, setCompletedQuests] = useState<string[]>(() => {
    const saved = localStorage.getItem('mascareignes_completed_quests');
    return saved ? JSON.parse(saved) : [];
  });

  // Floating notifications state
  const [floatingXps, setFloatingXps] = useState<{ id: number; amount: number; x: number; y: number }[]>([]);

  // Scan simulation states
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanLines, setScanLines] = useState<string>('INITIATING PING...');

  // Persist Gamified Metrics
  useEffect(() => {
    localStorage.setItem('mascareignes_player_xp', xp.toString());
  }, [xp]);

  useEffect(() => {
    localStorage.setItem('mascareignes_player_level', level.toString());
  }, [level]);

  useEffect(() => {
    localStorage.setItem('mascareignes_explored_cells', JSON.stringify(exploredCells));
  }, [exploredCells]);

  useEffect(() => {
    localStorage.setItem('mascareignes_completed_quests', JSON.stringify(completedQuests));
  }, [completedQuests]);

  // Quests definitions
  const questsList = useMemo<Quest[]>(() => [
    {
      id: "quest_abyssal",
      title: "Exploration Abyssale",
      description: "Sondez et verrouillez des abysses marins profonds.",
      badge: "Abysse",
      xpReward: 100,
      conditionDescription: "Cible à plus de 3200m",
      check: (cell) => cell.depth >= 3200
    },
    {
      id: "quest_upwelling",
      title: "Chasseur d'Upwellings",
      description: "Localisez une remontée hydrodynamique d'eau froide.",
      badge: "Thermal",
      xpReward: 120,
      conditionDescription: "Upwelling actif (>1.0°S anomalie)",
      check: (cell) => isUpwelling(cell)
    },
    {
      id: "quest_current",
      title: "Vents & Mascareignes",
      description: "Trouvez un flux de courant intense lié aux Alizés.",
      badge: "Courant",
      xpReward: 150,
      conditionDescription: "Courant > 0.70 m/s",
      check: (cell) => cell.currentSpeed >= 0.70
    },
    {
      id: "quest_nutrient",
      title: "Puits Biologique MODIS",
      description: "Identifiez une haute densité nutritive de chlorophylle.",
      badge: "Phyto",
      xpReward: 130,
      conditionDescription: "Chlorophylle > 1.8 mg/m³",
      check: (cell) => cell.chlorophyll >= 1.8
    }
  ], []);

  // Level Up check
  const xpToNextLevel = level * 200;
  useEffect(() => {
    if (xp >= xpToNextLevel) {
      setLevel(prev => prev + 1);
      setXp(prev => prev - xpToNextLevel);
      
      // Visual notification
      const id = Date.now();
      setFloatingXps(prev => [...prev, { id, amount: 200, x: 120, y: 150 }]);
      setTimeout(() => {
        setFloatingXps(prev => prev.filter(b => b.id !== id));
      }, 1500);
    }
  }, [xp, xpToNextLevel, level]);

  const playerRank = useMemo(() => {
    if (level >= 5) return { title: "Grand Amiral de Flotte", color: "text-bento-accent-alt" };
    if (level === 4) return { title: "Commandant de Sonar", color: "text-amber-400" };
    if (level === 3) return { title: "Navigateur Océanographe", color: "text-emerald-400" };
    if (level === 2) return { title: "Sondeur Principal", color: "text-bento-accent" };
    return { title: "Aspirant Éco-Marin", color: "text-bento-text-muted" };
  }, [level]);

  // Find cell by lat, lon
  const getCell = (lat: number, lon: number): OceanCell | undefined => {
    return grid.find(c => Math.abs(c.lat - lat) < 0.01 && Math.abs(c.lon - lon) < 0.01);
  };

  // Nautical Computations from Port Louis Command Deck
  const originLat = -20.165;
  const originLon = 57.500;

  const navigationStats = useMemo(() => {
    const dy = selectedCell.lat - originLat;
    const dx = (selectedCell.lon - originLon) * Math.cos(originLat * Math.PI / 180);
    const distanceNM = Math.sqrt(dx * dx + dy * dy) * 60; // Degrees to nautical miles
    
    // Bearing math (clockwise from North)
    let angleRad = Math.atan2(selectedCell.lon - originLon, selectedCell.lat - originLat);
    let bearingDeg = angleRad * 180 / Math.PI;
    
    // Invert because latitudes are negative towards the South
    let bearing = Math.round((bearingDeg + 180) % 360);

    return {
      distanceNM: Number(distanceNM.toFixed(1)),
      bearing,
      cardinal: getCardinal(bearing)
    };
  }, [selectedCell]);

  function getCardinal(deg: number) {
    const directions = [
      { label: 'N (Nord)', r: [337.5, 360], r2: [0, 22.5] },
      { label: 'NE (Nord-Est)', r: [22.5, 67.5] },
      { label: 'E (Est)', r: [67.5, 112.5] },
      { label: 'SE (Sud-Est)', r: [112.5, 157.5] },
      { label: 'S (Sud)', r: [157.5, 202.5] },
      { label: 'SO (Sud-Ouest)', r: [202.5, 247.5] },
      { label: 'O (Ouest)', r: [247.5, 292.5] },
      { label: 'NO (Nord-Ouest)', r: [292.5, 337.5] }
    ];
    for (const dir of directions) {
      if (dir.r2) {
        if ((deg >= dir.r[0] && deg <= dir.r[1]) || (deg >= dir.r2[0] && deg <= dir.r2[1])) {
          return dir.label;
        }
      } else {
        if (deg >= dir.r[0] && deg <= dir.r[1]) {
          return dir.label;
        }
      }
    }
    return 'N';
  }

  // Handle cell selection and trigger gamified XP flows
  const handleCellSelect = (cell: OceanCell, e: React.MouseEvent) => {
    onSelectCell(cell);
    
    const coordKey = `${cell.lat.toFixed(2)}-${cell.lon.toFixed(2)}`;
    const isNew = !exploredCells.includes(coordKey);
    let xpAdded = 0;

    // Reset scan state on clicking a new cell to invite scanning
    setScanProgress(0);
    setScanState('idle');

    if (isNew) {
      const updatedExplored = [...exploredCells, coordKey];
      setExploredCells(updatedExplored);
      xpAdded += 20;

      // Evaluate Quests matching this node immediately
      const completedNow: string[] = [];
      questsList.forEach(q => {
        if (!completedQuests.includes(q.id) && q.check(cell)) {
          completedNow.push(q.id);
          xpAdded += q.xpReward;
        }
      });

      if (completedNow.length > 0) {
        setCompletedQuests(prev => [...prev, ...completedNow]);
      }

      setXp(prev => prev + xpAdded);

      // Trigger floating XP indicator bubbles
      const clickX = e.nativeEvent?.offsetX || 150;
      const clickY = e.nativeEvent?.offsetY || 100;
      const bubbleId = Date.now();
      setFloatingXps(prev => [...prev, { id: bubbleId, amount: xpAdded, x: clickX, y: clickY }]);
      setTimeout(() => {
        setFloatingXps(prev => prev.filter(b => b.id !== bubbleId));
      }, 1200);
    }
  };

  // Sonar Trigger Sequence Simulation
  const triggerSonarScan = () => {
    if (scanState === 'scanning' || scanState === 'success') return;
    
    setScanState('scanning');
    setScanProgress(0);
    setScanLines('PROJECTING SONAR IMPULSE...');

    const statuses = [
      'EMITTING ACOUSTIC WAVE...',
      'INTERMEDIATE SHELF BOUNCING...',
      'CAPTURING COPERNICUS COHERENCE...',
      'ANALYZING WATER DENSITY...',
      'TELEMETRY DATA LOCK: VERIFIED!'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep += 1;
      setScanProgress(currentStep * 20);
      setScanLines(statuses[Math.min(currentStep, statuses.length - 1)]);

      if (currentStep >= 5) {
        clearInterval(interval);
        setScanState('success');
        
        // Grant Scan Bonus XP!
        setXp(prev => prev + 35);
        const bubbleId = Date.now();
        setFloatingXps(prev => [...prev, { id: bubbleId, amount: 35, x: 200, y: 150 }]);
        setTimeout(() => {
          setFloatingXps(prev => prev.filter(b => b.id !== bubbleId));
        }, 1200);
      }
    }, 250);
  };

  const handleHotspotSelect = (spot: OceanSpot) => {
    const targetCell = grid.reduce((prev, curr) => {
      const prevD = Math.sqrt(Math.pow(prev.lat - spot.lat, 2) + Math.pow(prev.lon - spot.lon, 2));
      const currD = Math.sqrt(Math.pow(curr.lat - spot.lat, 2) + Math.pow(curr.lon - spot.lon, 2));
      return currD < prevD ? curr : prev;
    });
    onSelectCell(targetCell);
  };

  const activeUpwellingCount = grid.filter(isUpwelling).length;

  // Render SVG Map coords and paths
  const getSvgCoords = (cellLat: number, cellLon: number) => {
    const paddingX = 40;
    const paddingY = 40;
    const mapWidth = 560; // fits clean 640 viewBox
    const mapHeight = 310; // fits clean 390 viewBox
    
    // lon range: 57.0 (left) to 58.5 (right)
    const x = paddingX + ((cellLon - 57.0) / 1.5) * mapWidth;
    // lat range: -19.8 (top) to -20.6 (bottom)
    const y = paddingY + ((cellLat - (-19.8)) / (-0.8)) * mapHeight;
    
    return { x, y };
  };

  const centerPortLouis = getSvgCoords(originLat, originLon);
  const selectedSvgCoords = getSvgCoords(selectedCell.lat, selectedCell.lon);

  // Mauritius Vector Path Points (High-fidelity geometric modeling)
  const mauritiusIslandPoints = [
    { lat: -19.98, lon: 57.62 }, // Cap Malheureux
    { lat: -20.02, lon: 57.58 }, // Grand Baie
    { lat: -20.07, lon: 57.53 }, // Trou aux Biches
    { lat: -20.14, lon: 57.48 }, // Port Louis Port
    { lat: -20.22, lon: 57.44 }, // Albion Coast
    { lat: -20.29, lon: 57.36 }, // Flic en Flac
    { lat: -20.36, lon: 57.32 }, // Tamarin Bay
    { lat: -20.44, lon: 57.30 }, // Le Morne Brabant
    { lat: -20.48, lon: 57.36 }, // Baie du Cap
    { lat: -20.51, lon: 57.46 }, // Souillac Coast
    { lat: -20.49, lon: 57.56 }, // Riambel
    { lat: -20.42, lon: 57.70 }, // Mahebourg Delta
    { lat: -20.33, lon: 57.75 }, // Pointe d'Esny
    { lat: -20.26, lon: 57.79 }, // Île aux Cerfs East
    { lat: -20.20, lon: 57.78 }, // Trou d'Eau Douce
    { lat: -20.15, lon: 57.74 }, // Belle Mare Reef
    { lat: -20.08, lon: 57.68 }, // Roches Noires
    { lat: -20.02, lon: 57.65 }, // Grand Gaube
  ];

  const mauritiusPathD = useMemo(() => {
    return mauritiusIslandPoints.map((pt, i) => {
      const { x, y } = getSvgCoords(pt.lat, pt.lon);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ') + ' Z';
  }, []);

  // Set cell colors
  const getCellColorClass = (cell: OceanCell) => {
    const isSelected = Math.abs(selectedCell.lat - cell.lat) < 0.01 && Math.abs(selectedCell.lon - cell.lon) < 0.01;

    if (viewMode === 'sst') {
      const t = cell.sst;
      if (t <= 24.2) return 'stroke-blue-500 fill-blue-900/60';
      if (t <= 24.8) return 'stroke-blue-400 fill-blue-800/40';
      if (t <= 25.2) return 'stroke-cyan-500 fill-cyan-800/20';
      return 'stroke-teal-500 fill-teal-900/15';
    } else if (viewMode === 'chlorophyll') {
      const c = cell.chlorophyll;
      if (c >= 2.0) return 'stroke-emerald-400 fill-emerald-950/80';
      if (c >= 1.0) return 'stroke-emerald-500 fill-emerald-900/40';
      if (c >= 0.5) return 'stroke-teal-500 fill-teal-900/20';
      return 'stroke-white/10 fill-white/5';
    } else if (viewMode === 'currents') {
      const s = cell.currentSpeed;
      if (s >= 0.8) return 'stroke-fuchsia-400 fill-fuchsia-950/75';
      if (s >= 0.6) return 'stroke-purple-400 fill-purple-900/45';
      if (s >= 0.4) return 'stroke-indigo-500 fill-indigo-950/25';
      return 'stroke-blue-600 fill-blue-950/15';
    } else {
      const d = cell.depth;
      if (d < 300) return 'stroke-yellow-500/50 fill-yellow-900/20';
      if (d < 1500) return 'stroke-slate-500/40 fill-slate-800/30';
      return 'stroke-white/5 fill-bento-bg/30';
    }
  };

  // Legacy Cell Grids color (kept for the Raw Data sheet view)
  const getLegacyCellBg = (cell: OceanCell) => {
    const isSelected = Math.abs(selectedCell.lat - cell.lat) < 0.01 && Math.abs(selectedCell.lon - cell.lon) < 0.01;
    if (viewMode === 'sst') {
      const t = cell.sst;
      if (t <= 24.2) return isSelected ? 'bg-blue-900 border-2 border-bento-accent ring-2 ring-bento-accent/50 text-white' : 'bg-blue-900/90 text-blue-200';
      if (t <= 24.8) return isSelected ? 'bg-blue-800 border-2 border-bento-accent ring-2 ring-bento-accent/50 text-white' : 'bg-blue-800/90 text-blue-100';
      if (t <= 25.2) return isSelected ? 'bg-blue-700 border-2 border-bento-accent ring-2 ring-bento-accent/50 text-white' : 'bg-blue-700/80 text-blue-50';
      if (t <= 25.5) return isSelected ? 'bg-indigo-950 border-2 border-bento-accent ring-2 ring-bento-accent/50 text-white' : 'bg-indigo-950/70 text-indigo-200';
      return isSelected ? 'bg-teal-900 border-2 border-bento-accent ring-2 ring-bento-accent/50 text-white' : 'bg-teal-950/60 text-teal-200';
    } else if (viewMode === 'chlorophyll') {
      const c = cell.chlorophyll;
      if (c >= 2.0) return isSelected ? 'bg-emerald-950/90 border-2 border-emerald-400 text-white' : 'bg-emerald-900/80 text-emerald-100';
      if (c >= 1.0) return isSelected ? 'bg-emerald-900/60 border-2 border-emerald-400 text-white' : 'bg-emerald-950/40 text-emerald-200';
      if (c >= 0.5) return isSelected ? 'bg-teal-900/40 border-2 border-emerald-400 text-white' : 'bg-teal-950/20 text-teal-300';
      return isSelected ? 'bg-bento-bg border-2 border-bento-text-muted/50 text-white' : 'bg-bento-card/45 text-bento-text-muted';
    } else if (viewMode === 'currents') {
      const s = cell.currentSpeed;
      if (s >= 0.8) return isSelected ? 'bg-fuchsia-900 border-2 border-bento-accent ring-2 ring-bento-accent/50 text-white animate-pulse' : 'bg-fuchsia-950 text-fuchsia-200 border border-fuchsia-800/30';
      if (s >= 0.6) return isSelected ? 'bg-purple-900 border-2 border-bento-accent ring-2 ring-bento-accent/50 text-white' : 'bg-purple-900/80 text-purple-200';
      if (s >= 0.4) return isSelected ? 'bg-indigo-900 border-2 border-bento-accent ring-2 ring-bento-accent/50 text-white' : 'bg-indigo-950/70 text-indigo-300';
      return isSelected ? 'bg-blue-950 border-2 border-bento-accent text-white' : 'bg-blue-950/40 text-blue-400';
    } else {
      const d = cell.depth;
      if (d < 300) return isSelected ? 'bg-yellow-950/70 border-2 border-bento-accent text-white' : 'bg-yellow-950/20 text-yellow-300';
      if (d < 1500) return isSelected ? 'bg-slate-800 border-2 border-bento-accent text-white' : 'bg-slate-800/50 text-slate-200';
      return isSelected ? 'bg-bento-card border-2 border-bento-accent text-white' : 'bg-bento-bg/85 text-bento-text-muted/40';
    }
  };

  return (
    <div id="ocean-grid-panel" className="flex flex-col space-y-4">
      
      {/* Upper Mode Selector & Info Dashboard */}
      <div className="flex flex-col items-start justify-between space-y-3 lg:flex-row lg:items-center lg:space-y-0 bento-card p-4 shadow-md bg-gradient-to-b from-bento-card to-bento-bg/90">
        <div className="w-full lg:w-auto space-y-2.5">
          <div className="flex items-center space-x-2">
            <Radar className="h-4 w-4 text-bento-accent animate-spin-slow shrink-0" />
            <span className="text-[10px] font-black text-bento-accent uppercase tracking-widest block">Moniteur Copernicus Mascareignes</span>
          </div>

          <div className="flex flex-wrap gap-1 bg-bento-bg/85 p-1 rounded-xl">
            <button
              id="view-mode-sst"
              onClick={() => setViewMode('sst')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold pointer cursor-pointer select-none transition-all ${
                viewMode === 'sst' ? 'bg-bento-accent text-bento-bg' : 'text-bento-text-muted hover:bg-white/5'
              }`}
            >
              Température (SST)
            </button>
            <button
              id="view-mode-chloro"
              onClick={() => setViewMode('chlorophyll')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold pointer cursor-pointer select-none transition-all ${
                viewMode === 'chlorophyll' ? 'bg-emerald-500 text-bento-bg' : 'text-bento-text-muted hover:bg-white/5'
              }`}
            >
              Nutriments (Chlorophylle)
            </button>
            <button
              id="view-mode-cur"
              onClick={() => setViewMode('currents')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold pointer cursor-pointer select-none transition-all ${
                viewMode === 'currents' ? 'bg-fuchsia-600 text-bento-bg' : 'text-bento-text-muted hover:bg-white/5'
              }`}
            >
              Courants (Velocity)
            </button>
            <button
              id="view-mode-depth"
              onClick={() => setViewMode('depth')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold pointer cursor-pointer select-none transition-all ${
                viewMode === 'depth' ? 'bg-yellow-600 text-bento-bg' : 'text-bento-text-muted hover:bg-white/5'
              }`}
            >
              Bathymétrie
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-0.5">
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox"
                id="superimpose-currents-toggle"
                checked={superimposeCurrents}
                onChange={(e) => setSuperimposeCurrents(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-white/15 text-bento-accent bg-bento-bg focus:ring-bento-accent cursor-pointer"
              />
              <label htmlFor="superimpose-currents-toggle" className="text-[10px] font-bold text-bento-text-muted hover:text-white cursor-pointer select-none transition-all flex items-center">
                Superposer les courants de surface <span className="text-[9px] font-mono text-bento-accent ml-1 opacity-95">(P1D-m)</span>
              </label>
            </div>
            
            <div className="flex items-center space-x-1.5 bg-bento-bg/40 px-2 py-0.5 rounded-md border border-white/5 text-[9px] font-mono text-bento-text-muted/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>SATELLITE CONNECTIVITY: 100% (COPERNICUS-C4-LEO)</span>
            </div>
          </div>
        </div>

        <div className="flex flex-row items-center gap-2.5">
          <div className="flex items-center space-x-2 bg-bento-accent-alt/10 border border-bento-accent-alt/25 px-3 py-2 rounded-xl">
            <AlertCircle className="h-4.5 w-4.5 text-bento-accent-alt animate-pulse shrink-0" />
            <div>
              <p className="text-xs font-black text-bento-accent-alt">{activeUpwellingCount} Upwellings Actifs</p>
              <p className="text-[9px] text-bento-text-muted/80 font-medium">Anomalie &gt;1.0°C du climat local</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Anchor Shortcuts for coordinates */}
      <div>
        <p className="text-xs font-black text-bento-text-muted mb-2 flex items-center gap-1.5">
          <Compass className="h-4 w-4 text-bento-accent shrink-0 animate-spin-slow" />
          BALISES DE GUIDAGE : ACCÈS DIRECT GPS
        </p>
        <div className="flex gap-2 pb-1 overflow-x-auto no-scrollbar scroll-smooth">
          {oceanHotspots.map((spot) => {
            const isNearSelected = Math.abs(selectedCell.lat - spot.lat) < 0.15 && Math.abs(selectedCell.lon - spot.lon) < 0.15;
            return (
              <button
                key={spot.name}
                onClick={() => handleHotspotSelect(spot)}
                className={`flex-none px-3.5 py-2 rounded-xl text-left border text-xs cursor-pointer select-none transition-all ${
                  isNearSelected 
                    ? 'border-bento-accent bg-bento-accent/15 text-bento-accent shadow-md shadow-bento-accent/5' 
                    : 'border-white/5 bg-bento-card hover:border-white/25 hover:text-white text-bento-text-muted'
                }`}
              >
                <p className="font-bold">{spot.name}</p>
                <p className="text-[9.5px] text-bento-text-muted/60 font-mono">{(Math.abs(spot.lat)).toFixed(2)}°S / {spot.lon.toFixed(2)}°E</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dual Row Layout: 
          Left Side: Tactical Radar Map (or raw button grid)
          Right Side: Player Command & Mission Progression */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        
        {/* MAP COLUMN */}
        <div className="xl:col-span-8 flex flex-col space-y-3">
          
          {/* Frame Selector tabs */}
          <div className="flex items-center justify-between bg-bento-bg/70 border border-white/5 px-3 py-1.5 rounded-xl">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-bento-text-muted">
              <Map className="h-3.5 w-3.5 text-bento-accent" />
              <span>Format d'Interface Océanique</span>
            </div>
            
            <div className="flex bg-bento-card p-0.5 rounded-lg border border-white/5">
              <button
                onClick={() => setMapFrame('radar')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-extrabold cursor-pointer select-none transition-all ${
                  mapFrame === 'radar' 
                    ? 'bg-bento-accent text-bento-bg shadow-inner' 
                    : 'text-bento-text-muted hover:text-white'
                }`}
              >
                <Radar className="h-3 w-3 shrink-0" />
                <span>Radar Sonar Tactique</span>
              </button>
              <button
                onClick={() => setMapFrame('sensor')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-extrabold cursor-pointer select-none transition-all ${
                  mapFrame === 'sensor' 
                    ? 'bg-bento-accent text-bento-bg shadow-inner' 
                    : 'text-bento-text-muted hover:text-white'
                }`}
              >
                <BookOpen className="h-3 w-3 shrink-0" />
                <span>Grille des Données</span>
              </button>
            </div>
          </div>

          {/* ACTIVE MAP INTERFACE VIEW FRAME */}
          {mapFrame === 'radar' ? (
            <div className="relative rounded-2xl border border-white/5 bg-bento-card p-2 sm:p-4 shadow-xl overflow-hidden min-h-[400px] flex flex-col justify-between">
              
              {/* Radar Grid Graphic Shell */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(2,43,66,0.3)_0%,rgba(1,22,39,0.95)_100%)] pointer-events-none" />
              
              {/* Scan HUD Overlay details */}
              <div className="absolute top-2.5 left-2.5 font-mono text-[8.5px] text-bento-accent-alt/80 z-20 space-y-0.5 pointer-events-none">
                <p>RANGE: 40 MILES RADIUS</p>
                <p>FREQ: 375 KHZ MULTI-BEAM</p>
                <p>TARGET ACQUISITION: CONTINUOUS</p>
              </div>

              <div className="absolute top-2.5 right-2.5 font-mono text-[8.5px] text-bento-accent/80 z-20 space-y-0.5 text-right pointer-events-none">
                <p>LAT SPAN: 19.8°S - 20.6°S</p>
                <p>LON SPAN: 57.0°E - 58.5°E</p>
                <p>BEARING ORIGIN: PORT LOUIS</p>
              </div>

              {/* FLOATING XP BUBBLE NOTIFIER LAYER */}
              <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
                <AnimatePresence>
                  {floatingXps.map((bubble) => (
                    <motion.div
                      key={bubble.id}
                      initial={{ opacity: 1, y: bubble.y, x: bubble.x, scale: 0.8 }}
                      animate={{ opacity: 0, y: bubble.y - 70, scale: 1.2 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.3, ease: "easeOut" }}
                      className="absolute pointer-events-none font-mono font-extrabold text-bento-accent text-xs bg-bento-bg/95 px-2 py-1 rounded-full border border-bento-accent/40 shadow-lg drop-shadow-[0_0_8px_rgba(76,201,240,0.6)] flex items-center gap-1"
                    >
                      <Zap className="h-3 w-3 fill-bento-accent text-bento-accent shrink-0 animate-pulse" />
                      <span>+{bubble.amount} XP</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* INTERACTIVE SVG SONAR RADAR CANVAS */}
              <div className="relative w-full aspect-[16/10] overflow-hidden rounded-xl border border-white/5 bg-bento-bg/85 z-10 self-center">
                
                {/* Visual grid reference lines */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

                <svg className="w-full h-full" viewBox="0 0 640 390">
                  <defs>
                    <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#4cc9f0" stopOpacity="0.12" />
                      <stop offset="50%" stopColor="#4cc9f0" stopOpacity="0.04" />
                      <stop offset="100%" stopColor="#011627" stopOpacity="0" />
                    </radialGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Sonar Glow Circles */}
                  <circle cx={centerPortLouis.x} cy={centerPortLouis.y} r={280} fill="url(#radarGlow)" pointerEvents="none" />
                  
                  {/* Concentric sonar range circles centered on Port Louis */}
                  <circle cx={centerPortLouis.x} cy={centerPortLouis.y} r={65} fill="none" stroke="#4cc9f0" strokeOpacity={0.15} strokeWidth={0.8} strokeDasharray="3 3" pointerEvents="none"/>
                  <circle cx={centerPortLouis.x} cy={centerPortLouis.y} r={130} fill="none" stroke="#4cc9f0" strokeOpacity={0.1} strokeWidth={0.8} strokeDasharray="4 4" pointerEvents="none"/>
                  <circle cx={centerPortLouis.x} cy={centerPortLouis.y} r={200} fill="none" stroke="#4cc9f0" strokeOpacity={0.06} strokeWidth={0.8} strokeDasharray="5 5" pointerEvents="none"/>
                  <circle cx={centerPortLouis.x} cy={centerPortLouis.y} r={270} fill="none" stroke="#4cc9f0" strokeOpacity={0.04} strokeWidth={0.8} strokeDasharray="6 6" pointerEvents="none"/>

                  {/* Dynamic Sweeping Radar Beam (SVG Native, high perf, no JS layout recalculation) */}
                  <line 
                    x1={centerPortLouis.x} 
                    y1={centerPortLouis.y} 
                    x2={centerPortLouis.x + 350} 
                    y2={centerPortLouis.y} 
                    stroke="#4cc9f0" 
                    strokeWidth={1.5} 
                    strokeOpacity={0.25}
                    strokeDasharray="2 2"
                    pointerEvents="none"
                  >
                    <animateTransform 
                      attributeName="transform"
                      type="rotate"
                      from={`0 ${centerPortLouis.x} ${centerPortLouis.y}`}
                      to={`360 ${centerPortLouis.x} ${centerPortLouis.y}`}
                      dur="9s"
                      repeatCount="indefinite"
                    />
                  </line>

                  {/* Navigation Vector Beam from Port Louis to Selected Cell */}
                  <line 
                    x1={centerPortLouis.x} 
                    y1={centerPortLouis.y} 
                    x2={selectedSvgCoords.x} 
                    y2={selectedSvgCoords.y} 
                    stroke="#4cc9f0" 
                    strokeWidth={1.2} 
                    strokeDasharray="4 3" 
                    strokeOpacity={0.8}
                    filter="url(#glow)"
                    pointerEvents="none"
                  />
                  
                  {/* Static Port Louis GPS Origin beacon */}
                  <circle 
                    cx={centerPortLouis.x} 
                    cy={centerPortLouis.y} 
                    r={5} 
                    fill="#4cc9f0" 
                    className="animate-pulse"
                    pointerEvents="none"
                  />
                  <text 
                    x={centerPortLouis.x + 8} 
                    y={centerPortLouis.y - 6} 
                    fill="#e0fbfc" 
                    fontSize="9px" 
                    fontFamily="monospace" 
                    fontWeight="bold"
                    fillOpacity={0.8}
                    pointerEvents="none"
                  >
                    RV PIONEER [HQ]
                  </text>

                  {/* MAURITIUS MAIN ISLAND GEOMETRIC VECTOR OUTLINE */}
                  <path 
                    d={mauritiusPathD} 
                    fill="#10b981" 
                    fillOpacity={0.18} 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    pointerEvents="none"
                  />

                  {/* Smaller outlying visual islands */}
                  {/* Gunner's Quoin (Coin de Mire) */}
                  <polygon 
                    points={`${getSvgCoords(-19.94, 57.62).x},${getSvgCoords(-19.94, 57.62).y} ${getSvgCoords(-19.96, 57.61).x},${getSvgCoords(-19.96, 57.61).y} ${getSvgCoords(-19.96, 57.63).x},${getSvgCoords(-19.96, 57.63).y}`}
                    fill="#10b981"
                    fillOpacity={0.4}
                    stroke="#10b981"
                    strokeWidth={0.8}
                  />

                  {/* Round & Flat Islands */}
                  <circle cx={getSvgCoords(-19.87, 57.66).x} cy={getSvgCoords(-19.87, 57.66).y} r={3} fill="#10b981" fillOpacity={0.6} />
                  <circle cx={getSvgCoords(-19.86, 57.78).x} cy={getSvgCoords(-19.86, 57.78).y} r={2} fill="#10b981" fillOpacity={0.5} />

                  {/* Interactive Nodes layer (all coordinates represent clickable circles) */}
                  {grid.map((cell) => {
                    const { x, y } = getSvgCoords(cell.lat, cell.lon);
                    const isUp = isUpwelling(cell);
                    const isSelected = Math.abs(selectedCell.lat - cell.lat) < 0.01 && Math.abs(selectedCell.lon - cell.lon) < 0.01;
                    const cellColor = getCellColorClass(cell);

                    return (
                      <g 
                        key={`${cell.lat}-${cell.lon}`}
                        className="cursor-pointer group"
                        onClick={(e) => handleCellSelect(cell, e)}
                      >
                        {/* Interactive Click Radius */}
                        <circle 
                          cx={x} 
                          cy={y} 
                          r={13} 
                          fill="transparent" 
                        />

                        {/* Node circle visual style */}
                        <circle 
                          cx={x} 
                          cy={y} 
                          r={isSelected ? 6 : 4} 
                          className={`transition-all duration-300 ${cellColor} ${
                            isSelected 
                              ? 'stroke-2 ring-2 filter drop-shadow-[0_0_6px_rgba(76,201,240,0.8)]' 
                              : 'stroke-[0.8] hover:r-5 hover:stroke-white'
                          }`}
                        />

                        {/* Active sonar warning pings for active upwelling coordinates */}
                        {isUp && (
                          <circle 
                            cx={x} 
                            cy={y} 
                            r={11} 
                            fill="none" 
                            stroke="#f72585" 
                            strokeWidth={1} 
                            strokeOpacity={0.6}
                            className="animate-ping"
                            pointerEvents="none"
                          />
                        )}

                        {/* Anchored custom hotspot dot indicator */}
                        {cell.name && (
                          <rect 
                            x={x - 2} 
                            y={y - 2} 
                            width={4} 
                            height={4} 
                            fill="#4cc9f0" 
                            className="rotate-45"
                            pointerEvents="none"
                          />
                        )}

                        {/* Tiny vector flows (Current indicators showing actual angle & density overlay) */}
                        {superimposeCurrents && cell.currentSpeed > 0.1 && (
                          <line 
                            x1={x} 
                            y1={y} 
                            x2={x + Math.sin(cell.currentDir * Math.PI / 180) * 9} 
                            y2={y - Math.cos(cell.currentDir * Math.PI / 180) * 9} 
                            stroke={isSelected ? '#4cc9f0' : '#ffffff'} 
                            strokeWidth={0.8} 
                            strokeOpacity={isSelected ? 0.9 : 0.3}
                            pointerEvents="none"
                          />
                        )}
                      </g>
                    );
                  })}

                  {/* LOCK RETICLE HUD - FOCUS DIRECTLY ON TARGET COORDINATE */}
                  <g pointerEvents="none">
                    {/* Targeting Box */}
                    <rect 
                      x={selectedSvgCoords.x - 12} 
                      y={selectedSvgCoords.y - 12} 
                      width={24} 
                      height={24} 
                      fill="none" 
                      stroke="#4cc9f0" 
                      strokeWidth={1.5}
                      className="animate-pulse filter drop-shadow-[0_0_4px_rgba(76,201,240,0.6)]"
                    />
                    
                    {/* Diagnostic projection lines locking targeting grid */}
                    <line 
                      x1={selectedSvgCoords.x} 
                      y1={0} 
                      x2={selectedSvgCoords.x} 
                      y2={390} 
                      stroke="#4cc9f0" 
                      strokeWidth={0.5} 
                      strokeDasharray="1 4" 
                      strokeOpacity={0.4}
                    />
                    <line 
                      x1={0} 
                      y1={selectedSvgCoords.y} 
                      x2={640} 
                      y2={selectedSvgCoords.y} 
                      stroke="#4cc9f0" 
                      strokeWidth={0.5} 
                      strokeDasharray="1 4" 
                      strokeOpacity={0.4}
                    />

                    {/* Glowing reticle dots */}
                    <circle cx={selectedSvgCoords.x} cy={selectedSvgCoords.y} r={1.5} fill="#f72585" />
                  </g>
                </svg>

                {/* Satellite GPS lock HUD ticker at the bottom of radar card */}
                <div className="absolute bottom-2 left-2 right-2 bg-bento-bg/95 border border-white/5 p-2 rounded-lg font-mono text-[9px] flex items-center justify-between text-bento-text-muted">
                  <div className="flex items-center gap-1.5 font-bold uppercase">
                    <Crosshair className="h-3 w-3 text-bento-accent animate-pulse" />
                    <span>CIBLAGE : {Math.abs(selectedCell.lat).toFixed(2)}°S / {selectedCell.lon.toFixed(2)}°E {selectedCell.name ? `(${selectedCell.name})` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline">VEL: 0.0Kts</span>
                    <span className="bg-bento-accent/10 border border-bento-accent/35 text-bento-accent px-1.5 py-0.5 rounded font-black animate-pulse">HUD ACCORDÉ</span>
                  </div>
                </div>

              </div>

              {/* Dynamic Legend details */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-1 border-t border-white/5 text-[9.5px] font-mono text-bento-text-muted/60">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> &lt;24.2°C Upwelling
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500" /> &gt;25.5°C Normal
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-600" /> Flux intense
                  </span>
                </div>
                <span>*Cliquez n'importe quelle coordonnée sonar pour verrouiller le cap.</span>
              </div>

            </div>
          ) : (
            /* SATELLITE Copernicus Raw data spreadsheet view */
            <div className="relative rounded-2xl border border-white/5 bg-bento-card p-3.5 overflow-x-auto shadow-inner">
              <div className="min-w-[420px] max-w-full mx-auto select-none">
                
                {/* Longitude Labels Header */}
                <div className="grid grid-cols-[38px_repeat(11,_1fr)] gap-1 mb-1 text-[9px] font-mono text-bento-text-muted/40 text-center">
                  <div />
                  {lons.map(lon => (
                    <div key={lon} className="p-0.5 truncate">
                      {lon.toFixed(2)}
                    </div>
                  ))}
                </div>

                {/* Grid Rows */}
                <div className="space-y-1">
                  {lats.map(lat => {
                    return (
                      <div key={lat} className="grid grid-cols-[38px_repeat(11,_1fr)] gap-1 items-center">
                        
                        {/* Latitude Sidebar label */}
                        <div className="text-[9px] font-mono text-bento-text-muted/40 text-right pr-1">
                          {Math.abs(lat).toFixed(1)}°S
                        </div>

                        {/* Ocean cells columns */}
                        {lons.map(lon => {
                          const cell = getCell(lat, lon);
                          if (!cell) {
                            return <div key={lon} className="aspect-square bg-bento-bg rounded-md border border-white/5" />;
                          }

                          const isUp = isUpwelling(cell);
                          const isSelected = Math.abs(selectedCell.lat - cell.lat) < 0.01 && Math.abs(selectedCell.lon - cell.lon) < 0.01;

                          return (
                            <button
                              key={lon}
                              onClick={(e) => handleCellSelect(cell, e)}
                              className={`relative aspect-square rounded-md flex flex-col items-center justify-center cursor-pointer transition-all ${getLegacyCellBg(cell)}`}
                              title={`Lat: ${cell.lat}, Lon: ${cell.lon}, Temp: ${cell.sst}°C`}
                            >
                              <span className="text-[7.5px] font-bold tracking-tight select-none">
                                {viewMode === 'sst' 
                                  ? cell.sst.toFixed(1) 
                                  : viewMode === 'chlorophyll' 
                                    ? cell.chlorophyll.toFixed(1) 
                                    : viewMode === 'currents' 
                                      ? cell.currentSpeed.toFixed(2) 
                                      : (cell.depth / 100).toFixed(0)}
                              </span>

                              {cell.currentSpeed > 0.1 && (viewMode === 'currents' || superimposeCurrents) && (
                                <div 
                                  className={`absolute bottom-0.5 right-0.5 scale-75 transition-all ${
                                    cell.currentSpeed >= 0.75 ? 'text-bento-accent-alt' : 'text-white opacity-40'
                                  }`}
                                  style={{ transform: `rotate(${cell.currentDir}deg)` }}
                                >
                                  <ArrowUp className="h-2 w-2" />
                                </div>
                              )}

                              {isUp && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bento-accent-alt opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-bento-accent-alt"></span>
                                </span>
                              )}

                              {cell.name && (
                                <span className="absolute top-0.5 left-0.5 h-1.5 w-1.5 rounded-full bg-bento-accent shadow animate-pulse" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-3 text-[10px] font-mono text-bento-text-muted/50 border-t border-white/5 pt-2 px-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <div className="flex items-center space-x-1">
                      <span className="h-2 w-2 rounded-full bg-bento-accent" />
                      <span>Copernicus L3/L4 Reconstructions</span>
                    </div>
                  </div>
                  <span>*La grille numérique compile 99 sondes hydro-statiques distinctes.</span>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* ECO-PIONNIER MISSION CONTROL SIDEBAR PANEL */}
        <div className="xl:col-span-4 flex flex-col space-y-4">
          
          {/* Rank and Player Profile widget */}
          <div className="bento-card p-4 shadow-xl bg-gradient-to-r from-bento-card to-bento-bg/30 border border-white/5">
            <span className="text-[9px] font-black text-bento-accent uppercase tracking-widest block mb-2">PROFIL SONDEUR COPERNICUS</span>
            
            <div className="flex items-center space-x-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-bento-bg border border-bento-accent/30 shadow-md">
                <Award className="h-6 w-6 text-bento-accent" />
                <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-bento-accent-alt text-[9.5px] font-black font-mono text-white text-center">
                  {level}
                </span>
              </div>
              <div className="truncate">
                <p className={`text-xs font-black truncate ${playerRank.color}`}>
                  {playerRank.title}
                </p>
                <p className="text-[10px] text-bento-text-muted font-bold font-mono">
                  NIVEAU D'EXPÉRIENCE {level}
                </p>
              </div>
            </div>

            {/* EXP Progress Gauge */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-bento-text-muted/70">
                <span>XP ACQUISE : <strong>{xp}</strong></span>
                <span>PROCHAIN GRADE : <strong>{xpToNextLevel} XP</strong></span>
              </div>
              <div className="relative h-2 w-full bg-bento-bg rounded-full overflow-hidden border border-white/5">
                <div 
                  className="absolute h-full bg-gradient-to-r from-bento-accent to-blue-500 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min((xp / xpToNextLevel) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[9.5px] text-bento-text-muted/50 text-right italic font-mono pt-0.5">
                +20 XP pour chaque nouvelle sonde GPS cartographiée.
              </p>
            </div>
          </div>

          {/* ACTIVE QUESTS MISSION DASHBOARD */}
          <div className="bento-card p-4 shadow-xl border border-white/5 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center space-x-2">
                <Trophy className="h-4.5 w-4.5 text-amber-400 shrink-0" />
                <h4 className="text-xs font-black text-white uppercase tracking-wider">MISSIONS TACTIQUES</h4>
              </div>
              <span className="text-[9px] font-mono text-bento-accent bg-bento-accent/10 px-2 py-0.5 rounded">
                {completedQuests.length} / {questsList.length} COMPLÉTÉ
              </span>
            </div>

            <div className="space-y-2.5">
              {questsList.map((quest) => {
                const isDone = completedQuests.includes(quest.id);
                return (
                  <div 
                    key={quest.id}
                    className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                      isDone 
                        ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-100/60' 
                        : 'bg-bento-bg/75 border-white/5 hover:border-white/10 text-bento-text'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-mono font-black uppercase px-1 rounded ${
                            isDone 
                              ? 'bg-emerald-900/40 text-emerald-400' 
                              : 'bg-bento-card text-bento-accent'
                          }`}>
                            {quest.badge}
                          </span>
                          <span className={`font-semibold ${isDone ? 'line-through opacity-60' : ''}`}>
                            {quest.title}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-bento-text-muted/80 mt-1">
                          {quest.description}
                        </p>
                      </div>

                      {isDone ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <span className="h-4.5 w-4.5 rounded-full border border-bento-accent/40 bg-bento-card flex items-center justify-center text-[8px] font-mono text-bento-accent font-black shrink-0 mt-0.5">
                          XP
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-white/5 text-[9px] font-mono">
                      <span className="text-bento-text-muted/60">{quest.conditionDescription}</span>
                      <strong className={isDone ? 'text-emerald-400/50' : 'text-bento-accent-alt'}>
                        +{quest.xpReward} XP
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ACTIVE SONAR SCAN BUTTON / RETICLE DISCHARGE */}
          <div className="bento-card p-4 shadow-xl border border-white/5 bg-gradient-to-br from-bento-card to-indigo-950/40">
            <span className="text-[9px] font-black text-bento-accent uppercase tracking-widest block mb-2.5">SONAR EMITTER PINGER</span>
            
            <div className="space-y-3">
              <div className="p-3 bg-bento-bg/85 rounded-xl border border-white/5 font-mono text-[10.5px]">
                <div className="flex justify-between items-center text-bento-text-muted/80 mb-1">
                  <span>DISCHARGE STATE:</span>
                  <strong className={scanState === 'scanning' ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}>
                    {scanState === 'scanning' ? 'PULSING' : 'READY TO TRANSMIT'}
                  </strong>
                </div>
                
                {/* Console text log ticker */}
                <div className="h-6 overflow-hidden flex items-center">
                  <span className="text-[10px] text-bento-accent font-bold truncate">
                    &gt; {scanLines}
                  </span>
                </div>

                {/* Progress bar */}
                {scanState === 'scanning' && (
                  <div className="h-1.5 w-full bg-bento-card rounded-full overflow-hidden mt-1.5 border border-white/5">
                    <div 
                      className="h-full bg-bento-accent animate-pulse"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                )}
              </div>

              <button
                disabled={scanState === 'scanning'}
                onClick={triggerSonarScan}
                className={`w-full py-2.5 rounded-xl text-xs font-black select-none pointer cursor-pointer font-mono tracking-wider shadow-md text-center flex items-center justify-center gap-1.5 transition-all ${
                  scanState === 'scanning'
                    ? 'bg-bento-card text-bento-text-muted border border-white/5 animate-pulse cursor-not-allowed'
                    : 'bg-gradient-to-r from-bento-accent to-blue-500 hover:opacity-90 text-bento-bg'
                }`}
              >
                <Radar className="h-4 w-4 animate-spin-slow shrink-0" />
                <span>PINGER SUR LES SYMBOLES SONAR (+35 XP)</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Target Coordinates Detail Slate (Nautical Navigation GPS format) */}
      <div className="bento-card p-4 shadow-xl bg-gradient-to-b from-bento-card to-bento-card/85">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3.5 pb-3.5 border-b border-white/5 gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[9.5px] font-black text-bento-accent px-2 py-0.5 rounded bg-bento-accent/10 border border-bento-accent/25 tracking-widest font-mono">
                CONSTITUTION DU VECTEUR GPS
              </span>
              {selectedCell.name && (
                <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1">
                  📍 {selectedCell.name}
                </span>
              )}
            </div>
            <h3 className="text-base font-black text-white mt-1">
              Lat : {Math.abs(selectedCell.lat).toFixed(2)}°S • Lon : {selectedCell.lon.toFixed(2)}°E
            </h3>
          </div>
          
          {/* Compass Steering Heading detail */}
          <div className="bg-bento-bg/75 px-3 py-1.5 rounded-xl border border-white/5 flex items-center space-x-3 text-xs shrink-0">
            <Compass className="h-5 w-5 text-bento-accent animate-spin-slow" />
            <div className="font-mono">
              <p className="text-[9px] text-bento-text-muted/65 leading-none">CAP DE NAVIGATION</p>
              <p className="font-bold text-white text-xs mt-0.5">
                {navigationStats.bearing}° • {navigationStats.cardinal}
              </p>
            </div>
            <div className="font-mono pl-3 border-l border-white/5 text-right">
              <p className="text-[9px] text-bento-text-muted/65 leading-none">DISTANCE (SHELFS)</p>
              <p className="font-semibold text-bento-accent-alt text-xs mt-0.5">
                {navigationStats.distanceNM} <span className="text-[9.5px] font-normal text-bento-text-muted opacity-80">M-Nau (NM)</span>
              </p>
            </div>
          </div>
        </div>

        {/* 4 Primary Copernicus Indicators Grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          
          {/* Sea Surface Temp */}
          <div className="bg-bento-bg/65 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center text-bento-text-muted text-xs mb-1 font-bold">
                <Waves className="h-3.5 w-3.5 mr-1.5 text-blue-400 shrink-0" />
                <span>Temp de Surface (SST)</span>
              </div>
              <p className="text-lg font-black text-white font-mono flex items-baseline">
                {selectedCell.sst}°C
                <span className="text-xs text-bento-text-muted/50 ml-1.5">Moy: {selectedCell.sstMean}°C</span>
              </p>
            </div>
            {isUpwelling(selectedCell) ? (
              <span className="text-[10px] font-extrabold text-bento-accent-alt bg-bento-accent-alt/10 border border-bento-accent-alt/25 px-1.5 py-0.5 rounded block mt-2 text-center animate-pulse">
                Anomalie Froide (Upwelling)
              </span>
            ) : (
              <span className="text-[10px] text-bento-accent bg-bento-accent/10 border border-bento-accent/15 px-1.5 py-0.5 rounded block mt-2 text-center font-bold">
                Climatologie normale
              </span>
            )}
          </div>

          {/* Chlorophyll-a Nutrients indicator */}
          <div className="bg-bento-bg/65 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center text-bento-text-muted text-xs mb-1 font-bold">
                <Layers className="h-3.5 w-3.5 mr-1.5 text-emerald-400 shrink-0" />
                <span>Chlorophylle-a</span>
              </div>
              <p className="text-lg font-black text-emerald-400 font-mono">
                {selectedCell.chlorophyll} <span className="text-xs font-normal text-bento-text-muted/55">mg/m³</span>
              </p>
            </div>
            <p className="text-[10px] text-bento-text-muted/70 mt-2 font-medium bg-bento-bg/40 px-2 py-0.5 rounded border border-white/5">
              {selectedCell.chlorophyll > 1.5 
                ? "🚀 Hyper-concentration" 
                : selectedCell.chlorophyll >= 0.7 
                  ? "🌿 Front nutritif riche" 
                  : "💧 Eaux sédimentaires claires"}
            </p>
          </div>

          {/* Ocean Currents vectors */}
          <div className="bg-bento-bg/65 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center text-bento-text-muted text-xs mb-1 font-bold">
                <Compass className="h-3.5 w-3.5 mr-1.5 text-fuchsia-400 shrink-0" />
                <span>Courant de Surface</span>
              </div>
              <p className="text-lg font-black text-white font-mono">
                {selectedCell.currentSpeed} <span className="text-xs font-normal text-bento-text-muted/55">m/s</span>
              </p>
            </div>
            <p className="text-[10.1px] text-bento-text-muted/70 mt-2 flex items-center gap-1 font-mono-sub font-medium bg-bento-bg/40 px-2 py-0.5 rounded border border-white/5">
              <span 
                className="inline-block text-bento-accent font-black text-xs" 
                style={{ transform: `rotate(${selectedCell.currentDir}deg)` }}
              >
                ➔
              </span>
              Direction : {selectedCell.currentDir}° (Alizés)
            </p>
          </div>

          {/* Salinity & Halocline proxy */}
          <div className="bg-bento-bg/65 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center text-bento-text-muted text-xs mb-1 font-bold">
                <Droplet className="h-3.5 w-3.5 mr-1.5 text-teal-400 shrink-0" />
                <span>Salinité Marine</span>
              </div>
              <p className="text-lg font-black text-white font-mono">
                {selectedCell.salinity} <span className="text-xs font-normal text-bento-text-muted/55">psu</span>
              </p>
            </div>
            <p className="text-[10px] text-bento-text-muted/70 mt-2 font-medium bg-bento-bg/40 px-2 py-0.5 rounded border border-white/5">
              Profondeur d'Ancrage : <span className="font-black text-white">{selectedCell.depth}m</span>
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
