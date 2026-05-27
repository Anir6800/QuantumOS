'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Layers3 } from 'lucide-react'
import { AgentCard } from '@/components/dashboard/AgentCard'
import { EmptyState } from '@/components/common/EmptyState'
import { useAgentStream } from '@/hooks/useAgentStream'

export function SwarmGrid() {
  const { agentIds } = useAgentStream()

  if (!agentIds.length) {
    return (
      <div className="rounded-3xl border border-white/8 bg-[#0b0f19] p-8">
        <EmptyState
          icon={Layers3}
          title="Waiting for swarm launch..."
          description="Launch a session to watch the specialist agents appear, stream, and complete in real time."
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <AnimatePresence initial={false}>
        {agentIds.map((agentId) => (
          <motion.div key={agentId} layout className="min-w-0">
            <AgentCard agentId={agentId} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
