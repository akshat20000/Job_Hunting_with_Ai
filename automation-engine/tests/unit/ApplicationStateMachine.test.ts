import { describe, it, expect } from 'vitest';
import { ApplicationStateMachine } from '../../src/domain/ApplicationStateMachine.js';

describe('ApplicationStateMachine', () => {
  it('should initialize to FOUND state by default', () => {
    const fsm = new ApplicationStateMachine();
    expect(fsm.getCurrentState()).toBe('FOUND');
  });

  it('should transition correctly along a progressive path', () => {
    const fsm = new ApplicationStateMachine('FOUND');
    
    fsm.transitionTo('MATCHED');
    expect(fsm.getCurrentState()).toBe('MATCHED');

    fsm.transitionTo('TAILORED');
    expect(fsm.getCurrentState()).toBe('TAILORED');

    fsm.transitionTo('READY');
    expect(fsm.getCurrentState()).toBe('READY');

    fsm.transitionTo('APPLYING');
    expect(fsm.getCurrentState()).toBe('APPLYING');

    fsm.transitionTo('SUBMITTED');
    expect(fsm.getCurrentState()).toBe('SUBMITTED');
  });

  it('should allow transitions to FAILED from standard states', () => {
    const fsm = new ApplicationStateMachine('MATCHED');
    fsm.transitionTo('FAILED');
    expect(fsm.getCurrentState()).toBe('FAILED');
  });

  it('should block and throw on illegal transitions', () => {
    const fsm = new ApplicationStateMachine('FOUND');
    expect(() => fsm.transitionTo('READY')).toThrowError(
      'Invalid state transition: Cannot transition from FOUND to READY'
    );
  });
});
