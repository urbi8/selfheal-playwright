import { BREAKAGE_SCENARIOS, type BreakageScenario } from './scenarios.js';

export class BreakageManager {
  private activeScenarios: Set<string> = new Set();

  activate(scenarioId: string): BreakageScenario | null {
    const scenario = BREAKAGE_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return null;
    this.activeScenarios.add(scenarioId);
    return scenario;
  }

  deactivate(scenarioId: string): boolean {
    return this.activeScenarios.delete(scenarioId);
  }

  deactivateAll(): void {
    this.activeScenarios.clear();
  }

  getActiveScenarios(): BreakageScenario[] {
    return BREAKAGE_SCENARIOS.filter((s) => this.activeScenarios.has(s.id));
  }

  getInjectionScript(): string {
    const active = this.getActiveScenarios();
    if (active.length === 0) return '';

    const scripts = active.map((s) => s.mutationScript).join('\n');
    return `<script>document.addEventListener('DOMContentLoaded', () => {\n${scripts}\n});</script>`;
  }

  listAll(): Array<{ id: string; name: string; description: string; active: boolean }> {
    return BREAKAGE_SCENARIOS.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      active: this.activeScenarios.has(s.id),
    }));
  }
}
