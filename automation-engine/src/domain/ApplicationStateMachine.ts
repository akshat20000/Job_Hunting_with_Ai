export type ApplicationState =
  | 'FOUND'
  | 'MATCHED'
  | 'TAILORED'
  | 'READY'
  | 'APPLYING'
  | 'RETRYING'
  | 'APPLIED'
  | 'FAILED';

export class InvalidStateTransitionError extends Error {
  constructor(from: ApplicationState | string, to: ApplicationState | string) {
    super(`Invalid state transition: Cannot transition from ${from} to ${to}`);
    this.name = 'InvalidStateTransitionError';
  }
}

export class ApplicationStateMachine {
  private currentState: ApplicationState;

  // Full pipeline adjacency: FOUND -> MATCHED -> TAILORED -> READY -> APPLYING -> APPLIED
  // with FAILED reachable from any non-terminal state, and RETRYING looping back to APPLYING.
  private static readonly allowedTransitions: Record<ApplicationState, Set<ApplicationState>> = {
    'FOUND':    new Set(['MATCHED', 'FAILED']),
    'MATCHED':  new Set(['TAILORED', 'FAILED']),
    'TAILORED': new Set(['READY', 'FAILED']),
    'READY':    new Set(['APPLYING', 'FAILED']),
    'APPLYING': new Set(['APPLIED', 'RETRYING', 'FAILED']),
    'RETRYING': new Set(['APPLYING', 'FAILED']),
    'APPLIED':  new Set([]),
    'FAILED':   new Set([]),
  };

  constructor(initialState: ApplicationState) {
    this.currentState = initialState;
  }

  public transitionTo(nextState: ApplicationState): void {
    const allowedNextStates = ApplicationStateMachine.allowedTransitions[this.currentState];

    if (!allowedNextStates || !allowedNextStates.has(nextState)) {
      throw new InvalidStateTransitionError(this.currentState, nextState);
    }

    this.currentState = nextState;
  }

  public isTerminal(): boolean {
    return this.currentState === 'APPLIED' || this.currentState === 'FAILED';
  }

  public get state(): ApplicationState {
    return this.currentState;
  }
}