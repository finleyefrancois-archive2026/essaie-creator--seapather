/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { OceanCell } from '../types';
import { isUpwelling } from '../data';
import { ShieldAlert, Compass, Eye, Waves, Layers } from 'lucide-react';

interface UpwellingAlertsProps {
  grid: OceanCell[];
  selectedCell: OceanCell;
  onSelectCell: (cell: OceanCell) => void;
}

export default function UpwellingAlerts({ grid, selectedCell, onSelectCell }: UpwellingAlertsProps) {
  // Extract all coordinates exhibiting active SST anomaly values >= 1.0°C below baseline averages
  const alertCells = grid.filter(isUpwelling).sort((a, b) => {
    // Sort by largest negative deviation
    const devA = a.sstMean - a.sst;
    const devB = b.sstMean - b.sst;
    return devB - devA;
  });

  return (
    <div id="upwelling-alerts-panel" className="bento-card p-4 shadow-xl">
      
      {/* Title */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="h-4.5 w-4.5 text-bento-accent-alt animate-pulse" />
          <h3 className="text-sm font-bold text-white">Moniteur d'Upwellings Actifs</h3>
        </div>
        <span className="text-[10px] font-bold text-bento-accent-alt bg-bento-accent-alt/10 px-2.5 py-0.5 rounded border border-bento-accent-alt/25">
          {alertCells.length} alertes
        </span>
      </div>

      {/* Grid Alert Cells List */}
      {alertCells.length === 0 ? (
        <div className="text-center py-6 text-bento-text-muted bg-bento-bg rounded-xl border border-dashed border-white/5">
          <p className="text-xs">Aucun upwelling actif détecté sur la zone Mascareignes.</p>
          <p className="text-[10px] text-bento-text-muted/60 mt-1">Températures stables dans le climat saisonnier.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
          {alertCells.map((cell) => {
            const tempDiff = cell.sstMean - cell.sst;
            const isTargeted = Math.abs(selectedCell.lat - cell.lat) < 0.01 && Math.abs(selectedCell.lon - cell.lon) < 0.01;

            return (
              <div 
                key={`${cell.lat}-${cell.lon}`}
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                  isTargeted 
                    ? 'bg-bento-accent/10 border-bento-accent' 
                    : 'bg-bento-bg/60 border-white/5 hover:border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-bold text-white">
                      {Math.abs(cell.lat).toFixed(1)}°S / {cell.lon.toFixed(1)}°E
                    </p>
                    {cell.name && (
                      <span className="text-[9px] font-medium text-bento-accent">
                        📍 {cell.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 text-[10px] text-bento-text-muted mt-1">
                    <span className="flex items-center text-bento-accent-alt font-mono font-semibold">
                      <Waves className="h-3 w-3 mr-1" />
                      -{tempDiff.toFixed(1)}°C anomalie
                    </span>
                    <span className="flex items-center text-emerald-400 font-mono font-semibold">
                      <Layers className="h-3 w-3 mr-1" />
                      {cell.chlorophyll} mg/m³
                    </span>
                  </div>
                </div>

                {/* Quick focus link button */}
                <button
                  onClick={() => onSelectCell(cell)}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-[10px] select-none cursor-pointer flex items-center space-x-1 transition-all ${
                    isTargeted 
                      ? 'bg-bento-accent text-bento-bg shadow-sm shadow-bento-accent/30' 
                      : 'bg-white/5 border border-white/5 text-bento-text-muted hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Eye className="h-3 w-3" />
                  <span>{isTargeted ? "Actif" : "Sonder"}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Helpful educational scientific footer memo */}
      <div className="bg-bento-accent/10 border border-bento-accent/20 rounded-xl p-3 mt-3 text-[10px] text-bento-accent leading-snug">
        💡 <strong>Pourquoi l'anomalie importe ?</strong> Les remontées d'eau côtières ("upwellings") refroidissent la surface, mais éparpillent le phytoplancton et les nutriments des strates bathymétriques de 1200m. C'est la base de la chaîne alimentaire !
      </div>

    </div>
  );
}
