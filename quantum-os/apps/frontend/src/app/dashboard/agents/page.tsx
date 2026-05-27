import { SwarmGrid } from '@/components/dashboard/SwarmGrid'

export default function AgentsPage() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-hidden">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Live Agents</h1>
        <p className="mt-1 text-sm md:text-base text-muted-foreground">
          Watch each specialist agent stream logs and progress in real time.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <SwarmGrid />
      </div>
    </div>
  )
}
