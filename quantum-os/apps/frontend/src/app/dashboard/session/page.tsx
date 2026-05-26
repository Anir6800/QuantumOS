import React from 'react';
import { SessionLaunchForm } from '@/components/dashboard/SessionLaunchForm';

export default function SessionPage() {
  return (
    <div className="max-w-6xl mx-auto w-full flex flex-col gap-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Launch New Swarm</h1>
        <p className="text-muted-foreground mt-1">Configure your multi-agent session and select models to begin task execution.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column - Form (60%) */}
        <div className="lg:col-span-3">
          <SessionLaunchForm />
        </div>

        {/* Right Column - Info Panel (40%) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-4">Swarm Configuration</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex justify-between items-start border-b border-border pb-3">
                <span className="font-medium text-foreground">Estimated Completion Time</span>
                <span className="text-right">~45 seconds</span>
              </li>
              <li className="flex justify-between items-start border-b border-border pb-3">
                <span className="font-medium text-foreground">Pricing Tier</span>
                <span className="text-right text-cyan-500 font-medium">Standard</span>
              </li>
              <li className="flex justify-between items-start border-b border-border pb-3">
                <span className="font-medium text-foreground">Memory Persistence</span>
                <span className="text-right">Enabled</span>
              </li>
              <li className="flex justify-between items-start pt-1">
                <span className="font-medium text-foreground">Security</span>
                <span className="text-right">Sandboxed Environment</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-cyan-500/10 border border-cyan-500/20 p-6 rounded-xl">
            <h4 className="font-bold text-cyan-600 dark:text-cyan-400 mb-2">Did you know?</h4>
            <p className="text-sm text-cyan-700 dark:text-cyan-500 leading-relaxed">
              Using heterogeneous models increases resilience. A mix of Llama and DeepSeek models provides diverse problem-solving approaches to complex tasks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
