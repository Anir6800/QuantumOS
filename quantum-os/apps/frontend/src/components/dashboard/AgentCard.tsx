import React from 'react';
import { useDemoStore } from '@/store/demo-store';
import { CpuIcon, CheckCircle2Icon, Loader2Icon } from 'lucide-react';

export function AgentCard({ agentId, agentName, isSelected, index }: { agentId: string, agentName: string, isSelected: boolean, index: number }) {
  const { phase, fakeLogs, agentScores, winReason, selectedWinner } = useDemoStore();
  
  const score = agentScores[agentName] || 0;
  const recentLogs = fakeLogs.filter(log => log.agent === agentName).slice(-3);
  
  const isWinner = selectedWinner === agentName;
  const notWinnerButDone = phase === 'completed' && !isWinner;

  let containerClass = "relative flex flex-col gap-3 p-4 rounded-xl border transition-all duration-700 overflow-hidden ";
  
  if (phase === 'idle') {
    containerClass += isSelected ? "bg-white/10 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]" : "bg-black/40 border-white/5 opacity-60";
  } else if (phase === 'initializing') {
    containerClass += "bg-white/10 border-indigo-500/50 animate-pulse";
  } else if (phase === 'executing' || phase === 'benchmarking') {
    containerClass += "bg-white/10 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)] scale-105";
  } else if (phase === 'completed') {
    if (isWinner) {
      containerClass += "bg-cyan-500/20 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.6)] scale-110 z-10";
    } else {
      containerClass += "bg-black/60 border-white/5 opacity-30 grayscale blur-[1px]";
    }
  }

  return (
    <div className={containerClass} style={{ transitionDelay: `${index * 50}ms` }}>
      {/* Background Glow */}
      {(phase === 'executing' || isWinner) && (
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 z-0 pointer-events-none" />
      )}

      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          {phase === 'executing' || phase === 'initializing' || phase === 'benchmarking' ? (
            <Loader2Icon className="w-5 h-5 text-cyan-400 animate-spin" />
          ) : isWinner ? (
            <CheckCircle2Icon className="w-5 h-5 text-cyan-400" />
          ) : (
            <CpuIcon className="w-5 h-5 text-white/60" />
          )}
          <h3 className="font-bold text-white/90">{agentName}</h3>
        </div>
        {phase !== 'idle' && phase !== 'initializing' && (
          <div className="bg-black/50 px-2 py-1 rounded text-xs font-mono text-cyan-300 border border-white/10">
            {score.toLocaleString()} tokens
          </div>
        )}
      </div>

      <div className="relative z-10 flex-1 min-h-[60px] text-xs font-mono text-white/50 space-y-1">
        {phase === 'idle' ? (
          <p className="italic">Awaiting prompt...</p>
        ) : phase === 'initializing' ? (
          <p className="text-indigo-300 animate-pulse">Booting neural engine...</p>
        ) : (
          recentLogs.map(log => (
            <div key={log.id} className="animate-in slide-in-from-bottom-2 fade-in truncate">
              <span className="text-cyan-500/50">{`>`}</span> {log.message}
            </div>
          ))
        )}
      </div>
      
      {isWinner && (
        <div className="relative z-10 mt-2 mb-1 text-[10px] sm:text-xs font-mono text-cyan-200 bg-black/50 p-3 rounded-lg border border-cyan-500/30 overflow-x-auto shadow-inner animate-in fade-in slide-in-from-bottom-3 duration-500 delay-150">
          <pre>
{`function executeTask(data) {
  // Optimized implementation
  const result = data.map(item => {
    if (item.value % 15 === 0) return 'FizzBuzz';
    if (item.value % 3 === 0) return 'Fizz';
    if (item.value % 5 === 0) return 'Buzz';
    return item.value;
  });
  return result;
}`}
          </pre>
        </div>
      )}
      
      {isWinner && winReason && (
        <div className="relative z-10 mt-2 text-xs text-green-300 bg-green-500/10 p-2 rounded border border-green-500/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {winReason}
        </div>
      )}
    </div>
  );
}
