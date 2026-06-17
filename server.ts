import express, { Request, Response } from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Gemini Client safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("⚠️ Warning: GEMINI_API_KEY environment variable is not set. AI Analyst features will fall back to local rule-based intelligence.");
      throw new Error("GEMINI_API_KEY is required for the AI Analyst.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// API: Health Indicator
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", service: "Mascareignes Ocean Engine" });
});

// API: Google Earth Engine Long-term Climatological Trend Analyzer
app.post("/api/gee-analysis", async (req: Request, res: Response) => {
  try {
    const { sstTrend, pressureTrend, extremeCount } = req.body;

    const ai = getGeminiClient();

    const systemInstruction = `Tu es "L'Analyste Climatologique Senior de l'océan Indien", spécialiste de la dynamique atmosphérique des Mascareignes et de la Commission de l'Océan Indien (COI).
Ta mission est d'interpréter les tendances de réchauffement décennal à Maurice (1985-2024) issues de Google Earth Engine et Copernicus.

Donne des conseils scientifiques d'expert, très inspirants et pragmatiques, rédigés en français classique soutenu et lisible :
1. Corrélation entre le réchauffement SST (+${sstTrend} K/an) et l'Anticyclone des Mascareignes (+${pressureTrend} Pa/an). Explique comment la pression influence les alizés et l'upwelling marin local.
2. Évalue la fréquence des vagues de chaleur marines (${extremeCount} événements extrêmes) et l'impact sur les lagons/coraux mauriciens.
3. Propose une hypothèse scientifique concrète pour l'agriculture/pêche ou l'aquaculture durable.
4. Reste clair, très direct, utilisant des balises markdown structurées.`;

    const promptText = `Analyse les métriques issues de Google Earth Engine pour la région de Maurice (1985-2024) :
- Tendance thermique SST : ${sstTrend} K/an (soit approx. ${(sstTrend * 40).toFixed(2)}°C de réchauffement cumulé en 40 ans).
- Tendance de pression atmosphérique : ${pressureTrend} Pa/an (renforcement de la ceinture de haute pression).
- Vagues de chaleur océanique extrêmes : ${extremeCount} épisodes de dépassement du 95ème percentile climatologique.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 0.3,
      }
    });

    res.json({ analysis: response.text || "Diagnostic CLIM-A1 indétectable." });
  } catch (error: any) {
    console.warn("⚠️ GEE interpretation fell back to rules engine:", error?.message);
    const { sstTrend, pressureTrend, extremeCount } = req.body;
    const fallbackText = `### Rapport Climatologique Mascareignes (Mode Dégradé Local)
*Note : Le service de traduction IA est en cours de recalibrage. Voici l'interprétation de sécurité de seapather :*

1. **Réchauffement Thermique** : Une anomalie haussière de **+${sstTrend} K/an** témoigne d'une transition rapide vers un océan tropical plus chaud. En 40 ans, cela représente environ **+${(sstTrend * 40).toFixed(2)}°C**, modifiant profondément les écosystèmes pélagiques et provoquant le déplacement des bancs de thonidés.
2. **Dynamique des Alizés (Pression)** : Le signal de **+${pressureTrend} Pa/an** montre une intensification de l'Anticyclone des Mascareignes. Cela renforce les vents de secteur Sud-Est mais peut aussi bloquer certains upwellings de rupture.
3. **Coral Bleaching (Établi à ${extremeCount} cas)** : Ce niveau de stress thermique engendre un risque critique de blanchissement corallien le long des récifs barrières de Belle Mare et du Morne.`;

    res.json({ analysis: fallbackText, isFallback: true });
  }
});

// API: Core Marine Analyst endpoint backed by Gemini 3.5 Flash
app.post("/api/ocean-analysis", async (req: Request, res: Response) => {
  try {
    const { lat, lon, sst, sstMean, chlorophyll, currentSpeed, currentDir, depth, salinity, question } = req.body;

    if (lat === undefined || lon === undefined) {
      res.status(400).json({ error: "Missing required coodinate fields (lat, lon)." });
      return;
    }

    const ai = getGeminiClient();

    // Determine if local mathematical upwelling is active
    const tempDifference = sstMean - sst;
    const isUpwellingActive = tempDifference >= 1.0;

    // Structure prompt based on whether user is analyzing spatial node or asking custom questions
    let promptText = "";
    if (question) {
      promptText = `L'utilisateur demande à propos de cette zone spécifique (${lat}°S, ${lon}°E) : "${question}".
Voici les télémetries Copernicus actuelles de ce point pour guider ta réponse :
- Température Surface (SST) : ${sst}°C (Moyologique habituelle locale : ${sstMean}°C)
- Concentration de Chlorophylle-a : ${chlorophyll} mg/m³
- Courants marins : ${currentSpeed} m/s vers une direction de ${currentDir}°
- Profondeur : ${depth} mètres
- Salinité : ${salinity} psu

Répond de façon scientifique et pratique à sa question, en français de l'océan Indien (Mascareignes), de manière claire, concise et lisible sur écran de téléphone mobile.`;
    } else {
      promptText = `Analyse les données océanographiques Copernicus suivantes de l'île Maurice à cette coordonnée géographique (${lat}°S, ${lon}°E) :
- Température mesurée : ${sst}°C
- Climatologie (Température Moyenne locale) : ${sstMean}°C
- Écart thermique (Anomalie) : -${tempDifference.toFixed(2)}°C
- Taux de Chlorophylle-a : ${chlorophyll} mg/m³ (Indicateur clé de nutriments et phytoplancton)
- Courants océaniques : ${currentSpeed} m/s à une orientation de ${currentDir}°
- Profondeur bathymétrique : ${depth} mètres
- Salinité : ${salinity} psu

Détecte s'il y a un d'upwelling d'eau froide (si l'écart thermique est supérieur ou égal à 1°C).
Rédige une analyse océanique structurée utile aux pêcheurs artisanaux, scientifiques et gestionnaires de l'environnement à Maurice.`;
    }

    const systemInstruction = `Tu es "L'Analyste Océanique des Mascareignes", un ingénieur et océanographe senior expert de la zone de l'océan Indien (Maurice, Réunion, Rodrigues).
Ta mission est d'interpréter les données d'upwelling (remontées d'eau froide côtières et marines riches en nitrates/phytoplancton), les courants et les températures de surface.

Donne des conseils pragmatiques en français dynamique et professionnel :
1. Analyse la viabilité pour la pêche (ex: Thon blanc, Bonite, Dorades coryphènes qui suivent les gradients de température et de nourriture comme la chlorophylle).
2. Évalue la sécurité et dynamique marine (si les courants forts de ${currentSpeed} m/s exigent de la prudence pour les petites embarcations/pirogues).
3. Explique succinctement le phénomène hydrodynamique local si un upwelling est en cours (remontée d'eaux sub-superficielles riches provoquant une baisse de SST et un boom de chlorophylle).
4. Sois concis et utilise une mise en page avec des puces très claire, adaptée aux écrans de mobiles chancelants en pleine mer. Préfère les termes océaniques vivants.`;

    // Call Gemini 3.5 Flash
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 0.25,
      }
    });

    const analysisText = response.text || "Analyse indisponible";

    // Build some simple metadata metrics to deliver alongside the text
    const upwellingLikelihood = isUpwellingActive 
      ? 'HIGH' 
      : (tempDifference > 0.5 && chlorophyll > 1.0) ? 'MEDIUM' : 'LOW';

    let fishingIndex: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR' = 'MODERATE';
    if (isUpwellingActive && chlorophyll >= 1.5) {
      fishingIndex = 'EXCELLENT';
    } else if (chlorophyll >= 0.8 || tempDifference > 0.4) {
      fishingIndex = 'GOOD';
    } else if (currentSpeed > 0.9) {
      fishingIndex = 'POOR'; // Too dangerous/rough
    }

    res.json({
      analysis: analysisText,
      fishingIndex,
      upwellingLikelihood,
      tempDifference: Number(tempDifference.toFixed(2)),
      isUpwelling: isUpwellingActive
    });

  } catch (error: any) {
    const errorStr = String(error?.stack || error?.message || error);
    const isLeaked = errorStr.includes("leaked") || errorStr.includes("API key");
    if (isLeaked) {
      console.warn("⚠️ [Service degraded] Gemini API Key needs refresh. Your API key can be configured in the Settings > Secrets panel of Maryland/AI Studio.");
    } else {
      console.warn("⚠️ [Service degraded] Gemini API call fell back to local rules engine. Error:", error?.message || error);
    }
    
    // Fallback logic if API key isn't loaded or fails to execute
    // Generates high quality, realistic oceanographic assessment rule-based
    const { lat, lon, sst, sstMean, chlorophyll, currentSpeed } = req.body;
    const tempDiff = sstMean - sst;
    const hasUpwelling = tempDiff >= 1.0;
    
    let fallbackText = `### Analyse Océanographique Locale (Simulée)
*Note : Le service de traduction IA est actuellement en cours de liaison ou l'API key est absente. Voici l'évaluation brute du système :*

- **Analyse du Point (${lat}°S, ${lon}°E)** : La température de surface est de ${sst}°C, ce qui représente un écart de **${tempDiff.toFixed(2)}°C** par rapport à la moyenne climatologique de ${sstMean}°C.
- **Upwelling** : ${hasUpwelling ? "✅ Phénomène d'upwelling actif identifié. Les courants côtiers induisent un refroidissement net qui fait remonter des eaux riches des profondeurs côtières." : "❌ Pas d'upwelling thermique franc à cette coordonnée. Les conditions sont dans les normales saisonnières."}
- **Production Biologique** : Un taux de chlorophylle de **${chlorophyll} mg/m³** indique une ${chlorophyll > 1.0 ? "forte productivité primaire de phytoplancton, garantissant des zones privilégiées de rassemblement de poissons." : "productivité modérée."}
- **Conseil Artisan** : ${currentSpeed > 0.70 ? "⚠️ Courant soutenu de " + currentSpeed + " m/s. Prudence de mise pour les sorties légères au large de Mahébourg et du Morne." : "⚓ Mer praticable. Courants faibles favorables à la dérive pour la pêche côtière."}`;

    res.json({
      analysis: fallbackText,
      fishingIndex: hasUpwelling && chlorophyll > 1.2 ? 'EXCELLENT' : chlorophyll > 0.6 ? 'GOOD' : 'MODERATE',
      upwellingLikelihood: hasUpwelling ? 'HIGH' : 'LOW',
      tempDifference: Number(tempDiff.toFixed(2)),
      isUpwelling: hasUpwelling,
      isFallback: true
    });
  }
});

// Configure Vite or Static files depending on mode
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Dynamically import Vite only in development to prevent overhead in built container
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev server middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log(`Serving static production files from ${distPath}`);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌍 Mascareignes Ocean Dashboard container running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
