/**
 * AASHA AIOS — IEC Runtime Contract
 * Path: Aasha-AI/packages/iec/contracts/runtime_contract.ts
 *
 * Re-exports the authoritative AashaExperienceContract lifecycle methods.
 * Strictly avoids parallel contract definitions.
 */

export interface IAashaExperienceContract {
  mount(container: HTMLElement, config?: Record<string, any>): void | Promise<void>;
  getState(): Record<string, any>;
  pause(): void;
  resume(): void;
  reset(): void;
  destroy(): void;
  emitTelemetry(eventType: string, payload: Record<string, any>): any;
}

export abstract class BaseAashaExperienceAdapter implements IAashaExperienceContract {
  protected container: HTMLElement | null = null;
  protected state: Record<string, any> = {};
  protected foundationId: string = 'AASHA_NATIVE';
  protected experienceId: string = 'generic';

  public mount(container: HTMLElement, config?: Record<string, any>): void {
    if (!container) throw new Error('CONTAINER_REQUIRED');
    this.container = container;
  }

  public getState(): Record<string, any> {
    return { ...this.state };
  }

  public pause(): void {
    // Override to pause animation frames or interval timers
  }

  public resume(): void {
    // Override to restart rendering loop
  }

  public reset(): void {
    this.state = {};
  }

  public destroy(): void {
    if (this.container) {
      this.container = null;
    }
  }

  public emitTelemetry(eventType: string, payload: Record<string, any>): any {
    const detail = {
      timestamp: Date.now(),
      foundationId: this.foundationId,
      experienceId: this.experienceId,
      eventType,
      payload,
    };

    if (typeof CustomEvent !== 'undefined' && this.container && typeof this.container.dispatchEvent === 'function') {
      const event = new CustomEvent('aasha:telemetry', {
        bubbles: true,
        detail,
      });
      this.container.dispatchEvent(event);
      return event;
    }

    return { type: 'aasha:telemetry', detail };
  }
}
