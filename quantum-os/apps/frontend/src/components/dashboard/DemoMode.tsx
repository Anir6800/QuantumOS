"use client";

import React, { useState } from 'react';
import { CameraIcon, SparklesIcon, CpuIcon, CheckCircle2Icon, Loader2Icon } from 'lucide-react';

const AI_AGENTS = [
  { id: 'ai-1', name: 'Alpha Coder' },
  { id: 'ai-2', name: 'Logic Weaver' },
  { id: 'ai-3', name: 'Quantum Core' },
  { id: 'ai-4', name: 'Nexus Engine' },
  { id: 'ai-5', name: 'Synth Mind' },
];

export function DemoMode() {
  const [prompt, setPrompt] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedAi, setSelectedAi] = useState<{ id: string; name: string } | null>(null);
  const [showReason, setShowReason] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // Start simulation
    setIsSimulating(true);
    setSelectedAi(null);
    setShowReason(false);

    // Simulate time taken by all agents to think
    setTimeout(() => {
      // Randomly select one agent
      const randomAi = AI_AGENTS[Math.floor(Math.random() * AI_AGENTS.length)];
      setSelectedAi(randomAi);
      
      // Delay before showing the fake reason
      setTimeout(() => {
        setShowReason(true);
        setIsSimulating(false);
      }, 1000);
    }, 2500);
  };

  const handleReset = () => {
    setPrompt('');
    setSelectedAi(null);
    setShowReason(false);
    setIsSimulating(false);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 h-full min-h-[70vh] py-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex p-3 rounded-full bg-cyan-500/20 text-cyan-400 mb-2 shadow-[0_0_20px_rgba(34,211,238,0.4)]">
          <CameraIcon className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tight">
          Photoshoot Demo Mode
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Enter a prompt to start the mock simulation with multiple AI agents.
        </p>
      </div>

      {/* Main Card */}
      <div className="flex-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl overflow-hidden relative">
        {!selectedAi && !isSimulating ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 h-full justify-center">
            <div className="space-y-4">
              <label htmlFor="prompt" className="text-lg font-medium text-white/90">
                Enter your prompt
              </label>
              <textarea
                id="prompt"
                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none transition-all"
                placeholder="e.g., Make fizzbuzz at 3 5..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                autoFocus
              />
            </div>
            
            <button
              type="submit"
              disabled={!prompt.trim()}
              className="group relative flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] overflow-hidden"
            >
              <SparklesIcon className="w-5 h-5" />
              <span>Start Simulation</span>
              
              {/* Shine effect */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
            </button>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-10 animate-in fade-in zoom-in duration-500">
            {/* The Simulation visualization */}
            <div className="relative w-full max-w-lg">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
              
              <div className="grid grid-cols-5 gap-4 justify-items-center relative z-10">
                {AI_AGENTS.map((agent, i) => {
                  const isSelected = selectedAi?.id === agent.id;
                  const notSelectedButDone = showReason && !isSelected;
                  
                  let itemClass = "transition-all duration-500 flex flex-col items-center gap-3";
                  
                  if (isSimulating) {
                    itemClass += " animate-pulse";
                  } else if (isSelected) {
                    itemClass += " scale-110 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]";
                  } else if (notSelectedButDone) {
                    itemClass += " opacity-30 grayscale blur-[1px]";
                  }

                  return (
                    <div key={agent.id} className={itemClass} style={{ animationDelay: `${i * 150}ms` }}>
                      <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center ${isSelected ? 'bg-cyan-500/20 border-cyan-400' : 'bg-white/5 border-white/10'} border shadow-lg backdrop-blur-md`}>
                        {isSimulating ? (
                          <Loader2Icon className="w-6 h-6 animate-spin text-cyan-500" />
                        ) : isSelected ? (
                          <CheckCircle2Icon className="w-8 h-8 text-cyan-400" />
                        ) : (
                          <CpuIcon className="w-6 h-6 text-white/50" />
                        )}
                      </div>
                      <span className={`text-xs md:text-sm font-medium text-center ${isSelected ? 'text-cyan-400' : 'text-white/60'}`}>
                        {agent.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status / Reason text */}
            <div className="text-center h-24 flex flex-col justify-center">
              {isSimulating ? (
                <p className="text-xl text-white/80 animate-pulse font-medium">
                  Agents are analyzing "{prompt}"...
                </p>
              ) : showReason && selectedAi ? (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-700">
                  <p className="text-2xl text-cyan-400 font-bold tracking-wide">
                    {selectedAi.name} Selected!
                  </p>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-200/90 text-sm md:text-base max-w-md mx-auto shadow-lg backdrop-blur-sm">
                    <span className="font-semibold text-red-400">System Note:</span> Due to high latency it's hard to simulate and run all 5 agents simultaneously, so we randomly chose this AI to proceed with your request.
                  </div>
                  
                  <button
                    onClick={handleReset}
                    className="mt-6 px-6 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
                  >
                    Try Another Prompt
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
