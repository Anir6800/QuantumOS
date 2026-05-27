import { useDemoStore, DemoStatePhase } from '@/store/demo-store';

const FAKE_LOG_MESSAGES = [
  "Optimizing loop complexity...",
  "Evaluating memory efficiency...",
  "Benchmarking recursion strategy...",
  "Analyzing abstract syntax tree...",
  "Compiling token metrics...",
  "Running predictive simulations...",
  "Minimizing runtime footprint...",
  "Validating edge cases...",
  "Checking type safety contours...",
  "Synchronizing swarm logic..."
];

const WIN_REASONS = [
  "due to superior readability and lower complexity score.",
  "due to optimized runtime performance and cleaner implementation structure.",
  "due to highly scalable modular architecture.",
  "due to minimal memory footprint and zero allocations.",
  "due to perfect type safety and elegant error handling."
];

export class SimulationEngine {
  private timerId: NodeJS.Timeout | null = null;
  private agents: string[] = [];
  private onPhaseChange: (phase: DemoStatePhase) => void;

  constructor(agents: string[], onPhaseChange: (phase: DemoStatePhase) => void) {
    this.agents = agents;
    this.onPhaseChange = onPhaseChange;
  }

  public start() {
    this.onPhaseChange('initializing');
    useDemoStore.getState().resetSimulation();

    // Init phase
    setTimeout(() => {
      this.onPhaseChange('executing');
      this.startExecutionStream();
    }, 2000); // 2s boot time
  }

  private startExecutionStream() {
    let tickCount = 0;
    
    // Simulate high speed log stream
    this.timerId = setInterval(() => {
      tickCount++;
      
      // Randomly pick an agent and a log
      const agent = this.agents[Math.floor(Math.random() * this.agents.length)];
      const msg = FAKE_LOG_MESSAGES[Math.floor(Math.random() * FAKE_LOG_MESSAGES.length)];
      
      useDemoStore.getState().addFakeLog({ agent, message: msg });
      
      // Update fake scores
      const currentScore = useDemoStore.getState().agentScores[agent] || 0;
      // gradually increase scores, but randomly
      useDemoStore.getState().updateAgentScore(agent, currentScore + Math.floor(Math.random() * 5));

      // After 50 ticks (approx 5 seconds), move to benchmarking
      if (tickCount > 50) {
        this.stopExecutionStream();
        this.startBenchmarking();
      }
    }, 100); // 10 logs per second
  }

  private stopExecutionStream() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private startBenchmarking() {
    this.onPhaseChange('benchmarking');
    
    setTimeout(() => {
      this.onPhaseChange('completed');
      this.selectWinner();
    }, 3000); // 3 seconds of benchmarking
  }

  private selectWinner() {
    const winner = this.agents[Math.floor(Math.random() * this.agents.length)];
    const reasonTemplate = WIN_REASONS[Math.floor(Math.random() * WIN_REASONS.length)];
    
    const finalReason = `${winner} selected ${reasonTemplate}`;
    useDemoStore.getState().setWinner(winner, finalReason);
  }

  public cleanup() {
    this.stopExecutionStream();
  }
}
