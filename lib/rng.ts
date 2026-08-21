/**
 * Seeded PRNG so the same seed always produces the same corpus, on a laptop
 * or in CI. `Math.random()` is banned in data/generate-contexts.ts.
 */
export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = (seed >>> 0) || 0x9e3779b9;
  }

  /** Uniform in [0, 1). */
  next(): number {
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
    return this.state / 0x1_0000_0000;
  }

  /** Uniform integer in [0, n). */
  int(n: number): number {
    return Math.floor(this.next() * n);
  }

  /** Uniform integer in [min, max]. */
  intBetween(min: number, max: number): number {
    return min + this.int(max - min + 1);
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error("Rng.pick: empty array");
    return items[this.int(items.length)] as T;
  }

  /** k distinct elements from items, order not preserved. */
  sample<T>(items: readonly T[], k: number): T[] {
    const pool = [...items];
    const count = Math.min(k, pool.length);
    const result: T[] = [];
    for (let i = 0; i < count; i++) {
      const index = this.int(pool.length);
      result.push(pool[index] as T);
      pool.splice(index, 1);
    }
    return result;
  }
}

/**
 * Mixes a base seed with a label so independent meetings never accidentally
 * share a random stream.
 */
export function derive(seed: number, label: string): number {
  let h = seed >>> 0;
  for (let i = 0; i < label.length; i++) {
    h = (Math.imul(h ^ label.charCodeAt(i), 16777619) + 1) >>> 0;
  }
  return h;
}
