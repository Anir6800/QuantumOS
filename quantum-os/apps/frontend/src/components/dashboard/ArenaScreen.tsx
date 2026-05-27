"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useDemoStore } from '@/store/demo-store';
import { SimulationEngine } from '@/lib/simulation-engine';
import { AgentCard } from '@/components/dashboard/AgentCard';
import { SparklesIcon, TerminalIcon, ActivityIcon } from 'lucide-react';

const AVAILABLE_AGENTS = ['DeepSeek', 'GPT-4o', 'Claude 3.5', 'Llama 3', 'Mistral'];

export function ArenaScreen() {
  const { isDemoModeActive, phase, fakeLogs, agentScores, setPhase } = useDemoStore();
  const [prompt, setPrompt] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>(AVAILABLE_AGENTS);
  
  const simulationEngineRef = useRef<SimulationEngine | null>(null);

  const handleStartBattle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || selectedAgents.length === 0) return;

    if (isDemoModeActive) {
      // Start Fake Demo Simulation
      if (!simulationEngineRef.current) {
        simulationEngineRef.current = new SimulationEngine(selectedAgents, setPhase);
      }
      simulationEngineRef.current.start();
    } else {
      // Real API Logic placeholder (in a real app, we'd call the backend here)
      alert('Real API execution would start here (Demo Mode is OFF).');
    }
  };

  useEffect(() => {
    return () => {
      if (simulationEngineRef.current) {
        simulationEngineRef.current.cleanup();
      }
    };
  }, []);

  const toggleAgent = (agent: string) => {
    if (phase !== 'idle') return;
    setSelectedAgents(prev => 
      prev.includes(agent) ? prev.filter(a => a !== agent) : [...prev, agent]
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full w-full">
      
      {/* Left/Main Column: Prompt & Swarm */}
      <div className="flex-1 flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-10">
        
        {/* Top Section: Giant Prompt Input */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl shrink-0">
          <form onSubmit={handleStartBattle} className="flex flex-col gap-4">
            <div className="flex items-center gap-3 mb-2">
              <TerminalIcon className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-bold text-white tracking-wide uppercase">Mission Directive</h2>
            </div>
            
            <textarea
              className={`w-full h-24 md:h-32 bg-white/5 border rounded-xl p-4 text-lg md:text-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none transition-all ${
                phase !== 'idle' ? 'border-white/5 opacity-70 cursor-not-allowed' : 'border-white/20'
              }`}
              placeholder="Enter objective (e.g. Build FizzBuzz in 3 different ways...)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={phase !== 'idle'}
            />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_AGENTS.map(agent => (
                  <button
                    key={agent}
                    type="button"
                    onClick={() => toggleAgent(agent)}
                    disabled={phase !== 'idle'}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      selectedAgents.includes(agent) 
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' 
                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                    } ${phase !== 'idle' && 'cursor-not-allowed opacity-50'}`}
                  >
                    {agent}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={phase !== 'idle' || !prompt.trim() || selectedAgents.length === 0}
                className="group relative overflow-hidden bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] flex items-center justify-center gap-2"
              >
                <SparklesIcon className="w-5 h-5" />
                <span>{phase !== 'idle' ? 'BATTLE IN PROGRESS' : 'START BATTLE'}</span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              </button>
            </div>
          </form>
        </div>

        {/* Center Section: Live Swarm Arena */}
        <div className="flex-1 bg-black/20 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col">
          <h2 className="text-sm font-bold text-white/40 tracking-widest uppercase mb-6 flex items-center gap-2 z-10 relative">
            <ActivityIcon className="w-4 h-4" /> Live Swarm Arena
          </h2>
          
          {/* Neural Network background effect (Fake) */}
          {(phase === 'executing' || phase === 'initializing') && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
               {/* Just some CSS blobs and moving lines to simulate network */}
               <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
               <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>
          )}

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-max relative z-10">
            {selectedAgents.map((agent, index) => (
              <AgentCard 
                key={agent} 
                agentId={agent.toLowerCase().replace(' ', '-')} 
                agentName={agent} 
                isSelected={selectedAgents.includes(agent)} 
                index={index} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Live Scoreboard */}
      <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 h-full pb-10">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl flex-1 overflow-hidden flex flex-col">
          <h2 className="text-sm font-bold text-white/40 tracking-widest uppercase mb-4 border-b border-white/10 pb-2">
            Live Telemetry
          </h2>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {selectedAgents.map(agent => (
              <div key={agent} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-white/70">
                  <span>{agent}</span>
                  <span className="text-cyan-400 font-mono">{(agentScores[agent] || 0).toLocaleString()} tks</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
                    style={{ width: `${Math.min(((agentScores[agent] || 0) / 100) * 100, 100)}%` }} // Arbitrary scaling for visual effect
                  />
                </div>
              </div>
            ))}
            
            {phase === 'idle' && (
              <div className="h-full flex items-center justify-center opacity-50">
                <p className="text-xs text-center text-white/40 max-w-[200px]">
                  Awaiting initialization sequence...
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Global Log Stream */}
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl h-64 overflow-hidden flex flex-col">
          <h2 className="text-xs font-bold text-white/30 tracking-widest uppercase mb-2">
            Global Event Stream
          </h2>
          <div className="flex-1 overflow-y-auto space-y-1 text-[10px] font-mono flex flex-col-reverse">
            {fakeLogs.slice(-20).reverse().map(log => (
              <div key={log.id} className="text-white/40 animate-in fade-in slide-in-from-bottom-1">
                <span className="text-cyan-500/70">[{log.agent}]</span> {log.message}
              </div>
            ))}
          </div>
        </div>
      </div>
      
    </div>
  );
}
