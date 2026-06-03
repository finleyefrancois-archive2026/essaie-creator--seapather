/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OceanCell {
  lat: number;
  lon: number;
  sst: number;                 // Sea Surface Temperature (°C)
  sstMean: number;             // Regional monthly average (°C)
  chlorophyll: number;         // Chlorophyll-a (mg/m³), nutrient proxy
  currentSpeed: number;        // Ocean current speed (m/s)
  currentDir: number;          // Ocean current direction (degrees from North)
  salinity: number;            // Ocean salinity (psu)
  depth: number;               // Water depth (m)
  name?: string;               // Local coastal name if any
}

export interface OceanTelemetry {
  date: string;
  grid: OceanCell[];
}

export interface HistoricalDP {
  date: string;
  sst: number;
  sstMean: number;
  chlorophyll: number;
}

export interface OceanSpot {
  name: string;
  lat: number;
  lon: number;
  description: string;
  avgDepth: number;
}

export interface FieldLog {
  id: string;
  timestamp: string;
  lat: number;
  lon: number;
  sst: number;
  chlorophyll: number;
  note: string;
}

export interface AnalysisResponse {
  analysis: string;
  summary: string;
  fishingIndex: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR';
  thermalAnomalies: string;
  upwellingLikelihood: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendations: string[];
}
