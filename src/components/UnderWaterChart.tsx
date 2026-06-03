/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { generateHistoricData } from '../data';
import { HistoricalDP } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Legend } from 'recharts';
import { AreaChart as ChartIcon, Zap, Loader2 } from 'lucide-react';

interface UnderWaterChartProps {
  lat: number;
  lon: number;
}

export default function UnderWaterChart({ lat, lon }: UnderWaterChartProps) {
  const [metric, setMetric] = useState<'sst' | 'chlorophyll'>('sst');
  const [rangeDays, setRangeDays] = useState<7 | 15 | 30>(30);

  // Generate 30 days of standard historical parameters for these coordinates
  const rawHistoryData = useMemo(() => {
    return generateHistoricData(lat, lon);
  }, [lat, lon]);

  // Adjust current slice depending on selected duration range
  const historyData = useMemo(() => {
    return rawHistoryData.slice(30 - rangeDays);
  }, [rawHistoryData, rangeDays]);

  // Identify lowest temperature in slice
  const minTempPoint = useMemo(() => {
    if (historyData.length === 0) return null;
    return historyData.reduce((prev, curr) => (curr.sst < prev.sst ? curr : prev), historyData[0]);
  }, [historyData]);

  return (
    <div id="marine-trends-panel" className="bento-card p-4 shadow-xl">
      
      {/* Visual Header */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center">
            <ChartIcon className="h-4 w-4 mr-2 text-bento-accent" />
            Série Temporelle Historique (Copernicus)
          </h3>
          <p className="text-xs text-bento-text-muted mt-0.5">
            Évolution de la thermocline locale sur {rangeDays} jours
          </p>
        </div>

        {/* View toggles */}
        <div className="flex flex-wrap gap-2">
          {/* Parameter switch */}
          <div className="flex bg-bento-bg p-0.5 rounded-xl border border-white/5">
            <button
              onClick={() => setMetric('sst')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold select-none cursor-pointer transition-all ${
                metric === 'sst' 
                  ? 'bg-bento-accent text-bento-bg font-bold shadow-sm' 
                  : 'text-bento-text-muted hover:text-white'
              }`}
            >
              Temp (SST)
            </button>
            <button
              onClick={() => setMetric('chlorophyll')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold select-none cursor-pointer transition-all ${
                metric === 'chlorophyll' 
                  ? 'bg-emerald-550 text-bento-bg font-bold shadow-sm' 
                  : 'text-bento-text-muted hover:text-white'
              }`}
            >
              Chlorophylle
            </button>
          </div>

          {/* Days range switch */}
          <div className="flex bg-bento-bg p-0.5 rounded-xl border border-white/5">
            {( [7, 15, 30] as const ).map((days) => (
              <button
                key={days}
                onClick={() => setRangeDays(days)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold select-none cursor-pointer transition-all ${
                  rangeDays === days 
                    ? 'bg-bento-card text-bento-accent font-bold shadow-inner' 
                    : 'text-bento-text-muted/60 hover:text-bento-text-muted'
                }`}
              >
                {days}j
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Charts Area */}
      <div className="h-64 w-full bg-bento-bg/60 p-2 rounded-xl border border-white/5 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={historyData} margin={{ top: 15, right: 10, left: -22, bottom: 0 }}>
            <defs>
              {/* Temperature line gradient color */}
              <linearGradient id="colorSst" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4bb3fd" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#4bb3fd" stopOpacity={0.0}/>
              </linearGradient>
              {/* Chlorophyll line gradient color */}
              <linearGradient id="colorChloro" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff/5" />
            <XAxis 
              dataKey="date" 
              stroke="#8facbd" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
            />
            <YAxis 
              domain={metric === 'sst' ? ['dataMin - 0.5', 'dataMax + 0.5'] : [0, 'dataMax + 0.5']} 
              stroke="#8facbd" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
            />
            
            <Tooltip
              contentStyle={{
                backgroundColor: '#022b42',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                fontSize: '11px',
                color: '#e2f1f7'
              }}
            />

            {metric === 'sst' ? (
              <>
                {/* Long-term Local Average Climatology Line */}
                <ReferenceLine 
                  y={25.6} 
                  stroke="#8facbd" 
                  strokeDasharray="4 4" 
                  label={{ value: 'Moyenne Climatologique (25.6°C)', position: 'top', fill: '#8facbd', fontSize: 9 }} 
                />
                
                {/* Upwelling trigger line (Regional average - 1.0°C) */}
                <ReferenceLine 
                  y={24.6} 
                  stroke="#fb5165" 
                  strokeDasharray="3 3" 
                  label={{ value: 'Seuil d\'Upwelling (24.6°C)', position: 'bottom', fill: '#fb5165', fontSize: 9 }} 
                />

                <Area 
                  name="Température Surface (°C)" 
                  type="monotone" 
                  dataKey="sst" 
                  stroke="#4bb3fd" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorSst)" 
                />
              </>
            ) : (
              <Area 
                name="Chlorophylle-a (mg/m³)" 
                type="monotone" 
                dataKey="chlorophyll" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorChloro)" 
              />
            )}
            <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Mini Diagnostic panel below chart */}
      {metric === 'sst' && minTempPoint && (
        <div className="mt-3 flex items-center justify-between text-[11px] bg-bento-bg/75 p-2.5 rounded-xl border border-white/5">
          <div className="flex items-center text-bento-text-muted">
            <Zap className="h-3.5 w-3.5 text-bento-accent mr-2" />
            <span>Pic de refroidissement minimal mesuré :</span>
          </div>
          <span className="font-bold text-white">
            {minTempPoint.sst}°C (le {minTempPoint.date})
          </span>
        </div>
      )}

    </div>
  );
}
