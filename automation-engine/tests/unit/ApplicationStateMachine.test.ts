import { describe, it, expect } from 'vitest';
import { ApplicationStateMachine } from '../../src/domain/ApplicationStateMachine.js';

describe('ApplicationStateMachine', () => {
  it('should initialize to FOUND state when constructed with FOUND', () => {
    const fsm = new ApplicationStateMachine('FOUND');
    expect(fsm.state).toBe('FOUND');
  });

  it('should transition correctly along a progressive path', () => {
    const fsm = new ApplicationStateMachine('FOUND');

    fsm.transitionTo('MATCHED');
    expect(fsm.state).toBe('MATCHED');

    fsm.transitionTo('TAILORED');
    expect(fsm.state).toBe('TAILORED');

    fsm.transitionTo('READY');
    expect(fsm.state).toBe('READY');

    fsm.transitionTo('APPLYING');
    expect(fsm.state).toBe('APPLYING');

    // Correct terminal state is APPLIED (not SUBMITTED)
    fsm.transitionTo('APPLIED');
    expect(fsm.state).toBe('APPLIED');
  });

  it('should allow transitions to FAILED from standard states', () => {
    const fsm = new ApplicationStateMachine('MATCHED');
    fsm.transitionTo('FAILED');
    expect(fsm.state).toBe('FAILED');
  });

  it('should block and throw on illegal transitions', () => {
    const fsm = new ApplicationStateMachine('FOUND');
    expect(() => fsm.transitionTo('READY')).toThrowError(
      'Invalid state transition: Cannot transition from FOUND to READY'
    );
  });

  it('should report terminal state correctly', () => {
    const applied = new ApplicationStateMachine('APPLIED');
    const failed = new ApplicationStateMachine('FAILED');
    const inProgress = new ApplicationStateMachine('MATCHED');
    expect(applied.isTerminal()).toBe(true);
    expect(failed.isTerminal()).toBe(true);
    expect(inProgress.isTerminal()).toBe(false);
  });
});
