'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ModelBadge } from '@/components/common';
import { api } from '@/lib/api-client';
import { useSessionStore } from '@/store/session-store';
import { wsClient } from '@/lib/ws-client';

type ModelOption = { id: string; label: string; provider: string }

const FALLBACK_MODELS: ModelOption[] = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile', provider: 'groq' },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant', provider: 'groq' },
  { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B 32768', provider: 'groq' },
  { id: 'gemma2-9b-it', label: 'Gemma 2 9B IT', provider: 'groq' },
  { id: 'openai/gpt-oss-120b', label: 'OpenAI GPT OSS 120B', provider: 'openrouter' },
  { id: 'openai/gpt-oss-20b', label: 'OpenAI GPT OSS 20B', provider: 'openrouter' },
  { id: 'openai/gpt-oss-safeguard-20b', label: 'OpenAI GPT OSS Safeguard 20B', provider: 'openrouter' },
]

export function SessionLaunchForm() {
  const router = useRouter();
  const { startSession } = useSessionStore();
  
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [agentCount, setAgentCount] = useState(3);
  const [modelOptions, setModelOptions] = useState<ModelOption[]>(FALLBACK_MODELS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ taskDescription?: string; selectedModels?: string }>({});

  useEffect(() => {
    let active = true

    const loadModels = async () => {
      try {
        const providersResponse = await api.get<{ providers?: string[] }>('/api/v1/providers')
        const providers = providersResponse.providers ?? ['groq']
        const responses = await Promise.all(
          providers.map(async (provider) => {
            const response = await api.get<{ provider?: string; models?: ModelOption[] }>(`/api/v1/providers/${provider}/models`)
            return response.models ?? []
          })
        )
        const models = responses.flat()
        if (active && models.length) {
          setModelOptions(models)
        }
      } catch {
        if (active) setModelOptions(FALLBACK_MODELS)
      }
    }

    void loadModels()
    return () => {
      active = false
    }
  }, [])
  
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
      const data = await api.post<{ id?: string; session_id?: string; task_description?: string }>('/api/v1/sessions', {
        task_description: taskDescription,
        models: selectedModels,
        num_agents: agentCount,
      });
      const sessionId = data.id || data.session_id || 'test-session-id'; // Fallback for mocking
      await wsClient.connectAndWait(`ws://127.0.0.1:8000/api/v1/ws/${sessionId}`);
      await api.post(`/api/v1/sessions/${sessionId}/start`, {});

      startSession(sessionId, taskDescription);
      
      router.push('/dashboard/agents');
    } catch (err: unknown) {
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
        <label className="block text-sm font-medium text-foreground">Groq Models</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {modelOptions.map((model, index) => (
            <label key={`${model.provider}:${model.id}:${index}`} className="flex items-center gap-3 p-3 border border-border rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
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
