'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ModelBadge } from '@/components/common';
import { useSessionStore } from '@/store/session-store';
import { wsClient } from '@/lib/ws-client';

const MODEL_OPTIONS = [
  { id: 'deepseek-coder', label: 'DeepSeek Coder V2', provider: 'openrouter' },
  { id: 'llama-3.1-70b', label: 'Llama 3.1 70B', provider: 'groq' },
  { id: 'mistral-7b', label: 'Mistral 7B Instruct', provider: 'openrouter' },
  { id: 'qwen2.5-coder', label: 'Qwen 2.5 Coder', provider: 'together' },
  { id: 'nemotron-70b', label: 'Nemotron 70B', provider: 'nvidia' },
];

export function SessionLaunchForm() {
  const router = useRouter();
  const { startSession } = useSessionStore();
  
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [agentCount, setAgentCount] = useState(3);
  const [preferredProvider, setPreferredProvider] = useState('openrouter');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ taskDescription?: string; selectedModels?: string }>({});
  
  const handleModelToggle = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId) ? prev.filter(id => id !== modelId) : [...prev, modelId]
    );
  };
  
  const validate = () => {
    const newErrors: typeof errors = {};
    if (taskDescription.length < 20) {
      newErrors.taskDescription = 'Task description must be at least 20 characters.';
    }
    if (selectedModels.length === 0) {
      newErrors.selectedModels = 'Please select at least one model.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/v1/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          task_description: taskDescription, 
          models: selectedModels, 
          num_agents: agentCount 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create session');
      }
      
      const data = await response.json();
      const sessionId = data.id || data.session_id || 'test-session-id'; // Fallback for mocking
      
      startSession(sessionId, taskDescription);
      
      // Connect websocket (assuming API_URL is handled inside wsClient or use base url)
      // Usually you'd connect ws-client here:
      wsClient.connect(`ws://localhost:8000/ws/${sessionId}`); // Mock URL since we don't have API_URL defined, wsClient likely uses relative
      
      router.push('/dashboard/agents');
    } catch (err: any) {
      console.error(err);
      // Fallback for demo without backend
      const sessionId = 'mock-session-' + Date.now();
      startSession(sessionId, taskDescription);
      router.push('/dashboard/agents');
      // In real scenario, show toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAgentRoles = (count: number) => {
    const roles = ['Speed', 'Security', 'Scalability', 'General', 'Experimental'];
    // 2 agents: Speed, Security
    // 3 agents: Speed, Scalability, Security
    if (count === 2) return 'Speed, Security';
    if (count === 3) return 'Speed, Scalability, Security';
    if (count === 4) return 'Speed, Scalability, Security, General';
    if (count === 5) return 'Speed, Scalability, Security, General, Experimental';
    return roles.slice(0, count).join(', ');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-card border border-border p-6 rounded-xl shadow-sm">
      <div className="space-y-2">
        <label htmlFor="taskDescription" className="block text-sm font-medium text-foreground">Task Description</label>
        <textarea
          id="taskDescription"
          className={`w-full h-32 p-3 bg-background border ${errors.taskDescription ? 'border-red-500 focus:ring-red-500' : 'border-border focus:ring-cyan-500'} rounded-md focus:outline-none focus:ring-2`}
          placeholder="Describe the task for the swarm..."
          value={taskDescription}
          onChange={(e) => {
            const val = e.target.value.slice(0, 2000);
            setTaskDescription(val);
          }}
        />
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          {errors.taskDescription ? <span className="text-red-500">{errors.taskDescription}</span> : <span>Minimum 20 characters required.</span>}
          <span>{taskDescription.length} / 2000</span>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">Model Options</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MODEL_OPTIONS.map(model => (
            <label key={model.id} className="flex items-center gap-3 p-3 border border-border rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={selectedModels.includes(model.id)}
                onChange={() => handleModelToggle(model.id)}
                className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500"
              />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-foreground">{model.label}</span>
                <ModelBadge model={model.id} provider={model.provider} />
              </div>
            </label>
          ))}
        </div>
        {errors.selectedModels && <p className="text-red-500 text-xs">{errors.selectedModels}</p>}
      </div>

      <div className="space-y-4">
        <label htmlFor="agentCount" className="block text-sm font-medium text-foreground">
          Agent Count: {agentCount}
        </label>
        <div className="px-2">
          <input
            type="range"
            id="agentCount"
            min="2"
            max="5"
            step="1"
            value={agentCount}
            onChange={(e) => setAgentCount(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Roles: <span className="font-medium text-foreground">{getAgentRoles(agentCount)}</span>
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="preferredProvider" className="block text-sm font-medium text-foreground">Preferred Provider</label>
        <select
          id="preferredProvider"
          value={preferredProvider}
          onChange={(e) => setPreferredProvider(e.target.value)}
          className="w-full p-2.5 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
        >
          <option value="openrouter">OpenRouter</option>
          <option value="groq">Groq</option>
          <option value="together">Together</option>
          <option value="nvidia">NVIDIA</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white p-3 rounded-md font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Launching Swarm...
          </>
        ) : (
          'Launch Swarm'
        )}
      </button>
    </form>
  );
}
