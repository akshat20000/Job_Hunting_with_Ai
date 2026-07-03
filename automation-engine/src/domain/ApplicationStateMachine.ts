export type ApplicationState = 'FOUND' | 'MATCHED' | 'TAILORED' | 'READY' | 'APPLYING' | 'SUBMITTED' | 'FAILED';

export class ApplicationStateMachine {
  private currentState: ApplicationState;

  constructor(initialState: ApplicationState = 'FOUND') {
    this.currentState = initialState;
  }

  getCurrentState(): ApplicationState {
    return this.currentState;
  }

  static getValidTransitions(state: ApplicationState): ApplicationState[] {
    switch (state) {
      case 'FOUND':
        return ['MATCHED', 'FAILED'];
      case 'MATCHED':
        return ['TAILORED', 'FAILED'];
      case 'TAILORED':
        return ['READY', 'FAILED'];
      case 'READY':
        return ['APPLYING', 'FAILED'];
      case 'APPLYING':
        return ['SUBMITTED', 'FAILED'];
      case 'SUBMITTED':
        return [];
      case 'FAILED':
        return [];
      default:
        return [];
    }
  }

  transitionTo(nextState: ApplicationState): void {
    const valid = ApplicationStateMachine.getValidTransitions(this.currentState);
    if (!valid.includes(nextState)) {
      throw new Error(`Invalid state transition: Cannot transition from ${this.currentState} to ${nextState}`);
    }
    this.currentState = nextState;
  }
}
