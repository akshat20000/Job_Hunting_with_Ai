import { performance } from 'perf_hooks';

/**
 * Traces the execution duration of an async function.
 */
export async function traceDuration<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const duration = performance.now() - start;
    console.log(`⏱️ [Tracer] "${name}" completed in ${duration.toFixed(2)}ms`);
  }
}

export default traceDuration;
