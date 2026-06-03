import { OceanCell, HistoricalDP, OceanSpot } from './types';

// Anchor spots around Mauritius
export const oceanHotspots: OceanSpot[] = [
  {
    name: "Chenal d'Upwelling du Morne",
    lat: -20.45,
    lon: 57.25,
    description: "Chenal sédimentaire profond à fortes remontées d'eau froide. Écosystème riche en nutriments propice au pélagique.",
    avgDepth: 1850
  },
  {
    name: "Canyon de Grand Baie",
    lat: -19.95,
    lon: 57.55,
    description: "Faille bathymétrique au Nord de l'île. Courant modéré et thermocline stable.",
    avgDepth: 950
  },
  {
    name: "Pente du Banc de Soudan",
    lat: -20.15,
    lon: 57.95,
    description: "Sillon externe est où les courants profonds se heurtent à la barrière volcanique, créant des anomalies froides enrichies.",
    avgDepth: 1200
  },
  {
    name: "Fosse de Mahébourg",
    lat: -20.45,
    lon: 57.75,
    description: "Zone sud-est fortement exposée aux alizés. Courants intenses avec des signatures de phytoplancton denses.",
    avgDepth: 2200
  },
  {
    name: "Plateau de Flic-en-Flac",
    lat: -20.25,
    lon: 57.35,
    description: "Zone côtière de transition avec lagune protégée et récifs externes soumis à des mascareignes saisonnières.",
    avgDepth: 180
  }
];

// Helper to check if a coordination pair is near a hot spot to induce temperature anomalies (upwellings)
function getSSTAndNutrientAnomaly(lat: number, lon: number): { sstOffset: number; chlorophyllOffset: number; isHotspot: boolean } {
  let minDistance = 999;
  let nearestIdx = -1;
  
  for (let i = 0; i < oceanHotspots.length; i++) {
    const spot = oceanHotspots[i];
    const dist = Math.sqrt(Math.pow(spot.lat - lat, 2) + Math.pow(spot.lon - lon, 2));
    if (dist < minDistance) {
      minDistance = dist;
      nearestIdx = i;
    }
  }

  // If close to Le Morne (-20.45, 57.25) or Banc de Soudan (-20.15, 57.95), create upwelling cold anomalies
  if (minDistance < 0.25) {
    if (nearestIdx === 0) { // Le Morne: highly productive cold upflow
      return { sstOffset: -1.6, chlorophyllOffset: 2.1, isHotspot: true };
    }
    if (nearestIdx === 2) { // Soudan Bank: moderate upwelling
      return { sstOffset: -1.2, chlorophyllOffset: 1.5, isHotspot: true };
    }
    if (nearestIdx === 3) { // Mahebourg: ocean dynamics cooler
      return { sstOffset: -0.9, chlorophyllOffset: 1.1, isHotspot: true };
    }
    return { sstOffset: -0.3, chlorophyllOffset: 0.4, isHotspot: true };
  }

  // Default deep ocean noise
  const hash = Math.sin(lat * 12.9898 + lon * 78.233) * 43758.5453;
  const sstNoise = (hash % 0.4) - 0.2;
  const chloroNoise = Math.abs((hash * 10) % 0.2);
  return { sstOffset: sstNoise, chlorophyllOffset: chloroNoise, isHotspot: false };
}

// Generate ocean data grid around Mauritius (Lat: -20.6 to -19.8, step: 0.1 | Lon: 57.0 to 58.5, step: 0.15)
export function generateOceanGrid(dayOffset: number = 0): OceanCell[] {
  const cells: OceanCell[] = [];
  
  const lats = [-20.6, -20.5, -20.4, -20.3, -20.2, -20.1, -20.0, -19.9, -19.8];
  const lons = [57.0, 57.15, 57.3, 57.45, 57.6, 57.75, 57.9, 58.05, 58.2, 58.35, 58.5];

  // Base parameters for Mauritius area in June (early winter cycle)
  const baseSST = 25.5; // °C
  const baseSSTMean = 25.6; // Long-term climatology mean

  for (const lat of lats) {
    for (const lon of lons) {
      const { sstOffset, chlorophyllOffset } = getSSTAndNutrientAnomaly(lat, lon);
      
      // Add a slight cyclical variation depending on dayOffset to simulate live drift
      const driftSST = Math.sin(dayOffset * 0.2 + lat) * 0.15;
      
      const sst = Number((baseSST + sstOffset + driftSST).toFixed(2));
      const sstMean = baseSSTMean;
      
      // Chlorophyll-a: higher in colder upwelling zones (nutrients)
      const chlorophyll = Number((0.18 + chlorophyllOffset + Math.abs(driftSST) * 1.5).toFixed(3));
      
      // Currents: south equatorial current flowing west-south-west (230 - 260 degrees)
      const currentDir = Math.floor(225 + (Math.sin(lat * 10) * 15) + (dayOffset % 10));
      const currentSpeed = Number((0.25 + Math.abs(Math.cos(lon * 8)) * 0.45 + (sstOffset < -1.0 ? 0.2 : 0)).toFixed(2));
      
      // Depth: closer to Mauritius (long: 57.5, lat: -20.2) is shallower island shelf, drops rapidly
      const dLat = lat - (-20.2);
      const dLon = lon - 57.5;
      const distToIsland = Math.sqrt(dLat * dLat + dLon * dLon);
      const depth = distToIsland < 0.15 
        ? Math.max(40, Math.floor(distToIsland * 1500)) 
        : Math.floor(1200 + distToIsland * 3500);

      const salinity = Number((35.2 + Math.sin(lon * 5) * 0.1).toFixed(2));

      // Append name if it closely matches an anchor hotspot
      let cellName: string | undefined;
      for (const h of oceanHotspots) {
        if (Math.abs(h.lat - lat) < 0.05 && Math.abs(h.lon - lon) < 0.05) {
          cellName = h.name;
          break;
        }
      }

      cells.push({
        lat,
        lon,
        sst,
        sstMean,
        chlorophyll,
        currentSpeed,
        currentDir,
        salinity,
        depth,
        name: cellName
      });
    }
  }

  return cells;
}

// Generate the 30-day timeline analysis for a specific coordinate
export function generateHistoricData(lat: number, lon: number): HistoricalDP[] {
  const data: HistoricalDP[] = [];
  const baseSSTMean = 25.6;
  const { sstOffset, chlorophyllOffset } = getSSTAndNutrientAnomaly(lat, lon);

  // Generate 30 points leading to current day
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayName = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    
    // Simulate daily variability
    const sstVar = Math.sin((30 - i) * 0.4) * 0.25 + Math.cos((30 - i) * 0.1) * 0.12;
    const sst = Number((25.5 + sstOffset + sstVar).toFixed(2));
    
    const chloroVar = Math.abs(Math.sin((30 - i) * 0.3) * 0.11);
    const chlorophyll = Number((0.2 + chlorophyllOffset + chloroVar).toFixed(3));

    data.push({
      date: dayName,
      sst,
      sstMean: baseSSTMean,
      chlorophyll
    });
  }

  return data;
}

// Upwelling Detection helper: True if SST is > 1.0°C below local climate mean
export function isUpwelling(cell: OceanCell): boolean {
  return (cell.sstMean - cell.sst) >= 1.0;
}
