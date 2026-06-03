/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FieldLog, OceanCell } from '../types';
import { BookOpen, Trash2, Calendar, Compass, Anchor, Save } from 'lucide-react';

interface LogbookProps {
  logs: FieldLog[];
  onDeleteLog: (id: string) => void;
  onFocusCell: (lat: number, lon: number) => void;
  grid: OceanCell[];
}

export default function Logbook({ logs, onDeleteLog, onFocusCell, grid }: LogbookProps) {
  return (
    <div id="coastal-logbook-panel" className="bento-card p-4 shadow-xl">
      
      {/* Visual top bar */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-4.5 w-4.5 text-bento-accent" />
          <h3 className="text-sm font-bold text-white">Journal d'Observations Côtières</h3>
        </div>
        <span className="text-[10px] font-mono text-bento-text-muted/40">
          Relevés localisés
        </span>
      </div>

      {logs.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12 text-bento-text-muted bg-bento-bg rounded-2xl border border-dashed border-white/5 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bento-accent/10 text-bento-accent mx-auto mb-3">
            <Anchor className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold text-white">Journal vide pour l'instant</p>
          <p className="text-[10px] text-bento-text-muted/60 mt-1.5 max-w-[280px] mx-auto leading-relaxed">
            Utilisez l'onglet <strong>Analyste IA</strong> pour ajouter des relevés océanologiques spécifiques d'upwellings suite aux simulations Copernicus.
          </p>
        </div>
      ) : (
        /* List with Logs */
        <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1 no-scrollbar">
          {logs.map((log) => {
            const dateStr = new Date(log.timestamp).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div 
                key={log.id} 
                className="bg-bento-bg p-3.5 rounded-xl border border-white/5 hover:border-white/10 transition-all text-xs"
              >
                
                {/* Meta Header */}
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => onFocusCell(log.lat, log.lon)}
                    className="flex items-center space-x-1.5 text-bento-accent font-bold hover:underline select-none cursor-pointer"
                  >
                    <Compass className="h-3.5 w-3.5" />
                    <span>{Math.abs(log.lat).toFixed(2)}°S / {log.lon.toFixed(2)}°E</span>
                  </button>

                  <button
                    onClick={() => onDeleteLog(log.id)}
                    className="p-1 px-1.5 rounded bg-bento-accent-alt/10 text-bento-accent-alt hover:bg-bento-accent-alt/20 hover:text-white text-[10px] select-none cursor-pointer flex items-center transition-all"
                    title="Supprimer l'archivage"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Supprimer
                  </button>
                </div>

                {/* Local Measurements Row */}
                <div className="flex items-center space-x-4 bg-bento-card p-2 rounded-lg border border-white/5 mb-2.5 font-mono text-[10px] text-bento-text-muted justify-around">
                  <span>SST: <strong className="text-white">{log.sst}°C</strong></span>
                  <span>Chlorophylle: <strong className="text-emerald-400">{log.chlorophyll} mg/m³</strong></span>
                </div>

                {/* Log observation content */}
                <div className="text-bento-text bg-bento-bg/30 border-l-2 border-bento-accent/40 pl-3.5 py-1 whitespace-pre-wrap leading-relaxed text-[11px] font-mono">
                  {log.note.split('\n')[0].replace('###', '')}
                  <p className="text-[10px] text-bento-text-muted/40 italic mt-1 font-sans">
                    Enregistré le {dateStr}
                  </p>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
