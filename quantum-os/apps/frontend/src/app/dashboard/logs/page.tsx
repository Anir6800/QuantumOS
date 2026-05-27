import { LogsClient } from '@/components/dashboard/LogsClient'

export default function LogsPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-0 flex-col overflow-hidden">
      <LogsClient />
    </div>
  )
}
