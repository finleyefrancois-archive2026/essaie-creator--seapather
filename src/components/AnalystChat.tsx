/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { OceanCell, AnalysisResponse, FieldLog } from '../types';
import { Sparkles, Send, Waves, ShieldAlert, Fish, Compass, RotateCcw, Save, Loader2 } from 'lucide-react';

interface AnalystChatProps {
  selectedCell: OceanCell;
  onSaveLog: (log: Omit<FieldLog, 'id' | 'timestamp'>) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'analyst';
  text: string;
  timestamp: string;
  meta?: {
    isUpwelling?: boolean;
    fishingIndex?: string;
    likelihood?: string;
  };
}

export default function AnalystChat({ selectedCell, onSaveLog }: AnalystChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load initial prompt analysis automatically when selected coordinate changes
  const triggerAutoAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ocean-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: selectedCell.lat,
          lon: selectedCell.lon,
          sst: selectedCell.sst,
          sstMean: selectedCell.sstMean,
          chlorophyll: selectedCell.chlorophyll,
          currentSpeed: selectedCell.currentSpeed,
          currentDir: selectedCell.currentDir,
          salinity: selectedCell.salinity,
          depth: selectedCell.depth
        })
      });

      if (!response.ok) {
        throw new Error("Erreur de communication avec le serveur océanique.");
      }

      const data = await response.json();
      setIsFallback(!!data.isFallback);
      
      const newMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'analyst',
        text: data.analysis,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        meta: {
          isUpwelling: data.isUpwelling,
          fishingIndex: data.fishingIndex,
          likelihood: data.upwellingLikelihood
        }
      };

      setMessages([newMsg]);
    } catch (error) {
      console.error(error);
      setMessages([{
        id: Math.random().toString(),
        sender: 'analyst',
        text: "### Analyse Indisponible\nImpossible d'atteindre le serveur d'analyse géospatiale. Veuillez vérifier votre clé API ou réessayer plus tard.",
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    triggerAutoAnalysis();
  }, [selectedCell.lat, selectedCell.lon]);

  // Scroll to bottom when conversation advances
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userQuery = inputText.trim();
    setInputText('');

    // Append user message
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: userQuery,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await fetch('/api/ocean-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: selectedCell.lat,
          lon: selectedCell.lon,
          sst: selectedCell.sst,
          sstMean: selectedCell.sstMean,
          chlorophyll: selectedCell.chlorophyll,
          currentSpeed: selectedCell.currentSpeed,
          currentDir: selectedCell.currentDir,
          salinity: selectedCell.salinity,
          depth: selectedCell.depth,
          question: userQuery
        })
      });

      if (!response.ok) {
        throw new Error("Échec d'envoi du message.");
      }

      const data = await response.json();
      setIsFallback(!!data.isFallback);
      
      const responseMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'analyst',
        text: data.analysis,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        meta: {
          isUpwelling: data.isUpwelling,
          fishingIndex: data.fishingIndex,
          likelihood: data.upwellingLikelihood
        }
      };

      setMessages(prev => [...prev, responseMsg]);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'analyst',
        text: "Des perturbations atmosphériques ou réseau bloquent actuellement la réponse du modèle de détection. Veuillez reformuler votre question.",
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToJournal = () => {
    // Save current state as log
    onSaveLog({
      lat: selectedCell.lat,
      lon: selectedCell.lon,
      sst: selectedCell.sst,
      chlorophyll: selectedCell.chlorophyll,
      note: messages.find(m => m.sender === 'analyst')?.text || `Observation d'upwelling.`
    });
  };

  return (
    <div id="analyst-view" className="bento-card flex flex-col h-[520px] p-4 shadow-xl">
      
      {/* Dynamic Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
        <div className="flex items-center space-x-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-bento-bg border border-white/5">
            <Sparkles className="h-4.5 w-4.5 text-bento-accent animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">Analyste Océanique Mascareignes</h3>
            <p className="text-[10px] text-bento-text-muted">Modèle Gemini Flash connecté</p>
          </div>
        </div>

        {/* Reload button for manual query */}
        <button
          onClick={triggerAutoAnalysis}
          className="p-1.5 rounded-lg border border-white/5 bg-bento-bg text-bento-text-muted hover:text-white transition-all select-none cursor-pointer"
          title="Relancer l'évaluation"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* API Key Warning / Information Banner */}
      {isFallback && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] p-2.5 rounded-xl mb-3 leading-relaxed flex flex-col space-y-1">
          <p className="font-bold flex items-center gap-1">
            <span>⚓ Mode de secours local activé.</span>
          </p>
          <p className="text-bento-text-muted">
            Votre clé API peut être configurée de manière entièrement confidentielle sous l'onglet <strong>Settings &gt; Secrets</strong> du tableau de bord.
          </p>
        </div>
      )}

      {/* Message Output Thread Container */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs select-text no-scrollbar"
      >
        {messages.map((msg) => {
          const isAnalyst = msg.sender === 'analyst';
          return (
            <div 
              key={msg.id} 
              className={`flex flex-col ${isAnalyst ? 'items-start' : 'items-end'}`}
            >
              
              {/* Sender label */}
              <span className="text-[10px] font-mono text-bento-text-muted/40 mb-1 px-1">
                {isAnalyst ? "🤖 Analyste Copernicus" : "👤 Vous"} • {msg.timestamp}
              </span>

              {/* Message block content bubble */}
              <div className={`max-w-[88%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                isAnalyst 
                  ? 'bg-bento-bg/85 border border-white/5 text-bento-text' 
                  : 'bg-bento-accent text-bento-bg font-semibold'
              }`}>
                {/* Parse key markdown styling simply since React-Markdown isn't imported */}
                {msg.text.split('\n').map((line, idx) => {
                  if (line.startsWith('### ')) {
                    return <h4 key={idx} className="font-bold text-white mt-2 mb-1 text-sm">{line.substring(4)}</h4>;
                  }
                  if (line.startsWith('- ') || line.startsWith('* ')) {
                    return <p key={idx} className="pl-3.5 py-0.5 border-l border-bento-accent/20 text-bento-text/90">✓ {line.substring(2)}</p>;
                  }
                  if (line.startsWith('**')) {
                    return <p key={idx} className="font-bold text-bento-text">{line}</p>;
                  }
                  return <p key={idx} className="mb-1 text-bento-text/80">{line}</p>;
                })}

                {/* Additional metadata metrics cards if analyst response */}
                {isAnalyst && msg.meta && (
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5">
                    
                    <div className="bg-bento-card p-2 rounded-xl text-[10px] border border-white/5">
                      <p className="text-bento-text-muted/60 font-bold uppercase tracking-wider">Potentiel Halieutique</p>
                      <p className={`font-black mt-1 flex items-center ${
                        msg.meta.fishingIndex === 'EXCELLENT' ? 'text-emerald-400' :
                        msg.meta.fishingIndex === 'GOOD' ? 'text-teal-300' : 'text-yellow-400'
                      }`}>
                        <Fish className="h-3.5 w-3.5 mr-1" />
                        {msg.meta.fishingIndex}
                      </p>
                    </div>

                    <div className="bg-bento-card p-2 rounded-xl text-[10px] border border-white/5">
                      <p className="text-bento-text-muted/60 font-bold uppercase tracking-wider">Risque d'Upwelling</p>
                      <p className="text-white font-bold mt-1 flex items-center">
                        <Waves className="h-3.5 w-3.5 text-bento-accent mr-1" />
                        {msg.meta.likelihood}
                      </p>
                    </div>

                  </div>
                )}
              </div>

              {/* Instant action to bookmark report under logs */}
              {isAnalyst && !loading && (
                <button
                  onClick={handleSaveToJournal}
                  className="mt-1.5 flex items-center text-[10px] text-bento-accent hover:text-white bg-bento-card border border-white/5 hover:border-white/15 px-2.5 py-1.5 rounded-lg select-none cursor-pointer shadow-sm transition-all"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Archiver au Journal Côtier
                </button>
              )}

            </div>
          );
        })}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex items-center space-x-2 text-bento-text-muted text-xs py-2 bg-bento-bg/40 p-3 rounded-xl border border-white/5 animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin text-bento-accent" />
            <span>Chargement critique des anomalies de thermocline...</span>
          </div>
        )}
      </div>

      {/* Interactive Form Field */}
      <form onSubmit={handleSendMessage} className="mt-3 flex items-center space-x-2 border-t border-white/5 pt-3">
        <input
          id="chat-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Demandez à l'IA : "Pêche au thon au large ?" ou "Salinité ?"...`}
          className="flex-1 bg-bento-bg text-white rounded-xl px-3.5 py-2.5 text-xs border border-white/5 focus:outline-none focus:border-bento-accent focus:ring-1 focus:ring-bento-accent/30 placeholder-bento-text-muted/50 transition-all"
          disabled={loading}
        />
        <button
          id="btn-send"
          type="submit"
          className="p-2.5 rounded-xl bg-bento-accent hover:bg-bento-accent/90 text-bento-bg font-bold transition-all disabled:opacity-40 disabled:hover:bg-bento-accent cursor-pointer flex items-center justify-center"
          disabled={!inputText.trim() || loading}
        >
          <Send className="h-4.5 w-4.5" />
        </button>
      </form>

    </div>
  );
}
