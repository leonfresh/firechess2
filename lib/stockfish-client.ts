export type LocalEngineEval = {
  cp: number;
  bestMove: string | null;
};

export type LocalEngineLine = LocalEngineEval & {
  pvMoves: string[];
};

const MATE_CP = 100000;

class StockfishClient {
  private worker: Worker | null = null;
  private initialized = false;
  private evalCache = new Map<string, LocalEngineEval | null>();
  /** Tracks the highest depth evaluated for each FEN to avoid O(n) cache scans */
  private maxDepthPerFen = new Map<string, number>();
  private queue: Promise<void> = Promise.resolve();
  private _pendingTasks = 0;

  /** Number of evaluation tasks currently queued or in-flight on this worker. */
  get pendingTasks(): number { return this._pendingTasks; }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(task, task);
    this.queue = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  private async ensureReady(): Promise<void> {
    if (this.initialized) return;

    try {
      this.worker = new Worker("/stockfish-18-lite.js", { type: "classic" });
    } catch (err) {
      throw new Error(
        "Failed to start the analysis engine. Your browser may not support WebAssembly workers."
      );
    }

    try {
      await this.sendAndWaitFor("uci", (line) => line.trim() === "uciok");
      await this.sendAndWaitFor("isready", (line) => line.trim() === "readyok");
    } catch (err) {
      // Clean up the broken worker so a retry can attempt a fresh start
      this.worker?.terminate();
      this.worker = null;

      const msg = err instanceof Error ? err.message : String(err);

      if (msg.includes("doesn't parse") || msg.includes("CompileError") || msg.includes("Aborted")) {
        throw new Error(
          "The analysis engine failed to load (WASM error). " +
          "Please try reloading the page. If the issue persists your browser may not fully support WebAssembly threads."
        );
      }
      throw err;
    }

    this.initialized = true;
  }

  private async sendAndWaitFor(command: string, doneWhen: (line: string) => boolean): Promise<string[]> {
    if (!this.worker) {
      throw new Error("Stockfish worker is not initialized");
    }

    const worker = this.worker;

    const lines: string[] = [];

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error(`Stockfish timeout waiting for: ${command}`));
      }, 20000);

      const onMessage = (event: MessageEvent) => {
        const text = typeof event.data === "string" ? event.data : String(event.data ?? "");
        lines.push(text);

        if (doneWhen(text)) {
          cleanup();
          resolve(lines);
        }
      };

      const cleanup = () => {
        clearTimeout(timeout);
        worker.removeEventListener("message", onMessage);
        worker.removeEventListener("error", onError);
        worker.removeEventListener("messageerror", onMessageError);
      };

      const onError = (event: ErrorEvent) => {
        cleanup();
        reject(new Error(`Stockfish worker error: ${event.message || "unknown"}`));
      };

      const onMessageError = () => {
        cleanup();
        reject(new Error("Stockfish worker messageerror"));
      };

      worker.addEventListener("message", onMessage);
      worker.addEventListener("error", onError);
      worker.addEventListener("messageerror", onMessageError);
      worker.postMessage(command);
    });
  }

  private parseInfo(lines: string[], maxPvPlies = 0): LocalEngineLine | null {
    let latestScoreCp: number | null = null;
    let latestBestMove: string | null = null;
    let latestPvMoves: string[] = [];

    for (const line of lines) {
      if (line.startsWith("info ")) {
        const scoreCpMatch = line.match(/\bscore cp (-?\d+)/);
        const scoreMateMatch = line.match(/\bscore mate (-?\d+)/);
        const pvMatch = line.match(/\bpv\s+(.+)$/);

        if (scoreMateMatch) {
          const mateValue = Number(scoreMateMatch[1]);
          const sign = mateValue > 0 ? 1 : -1;
          latestScoreCp = sign * (MATE_CP - Math.min(Math.abs(mateValue), 1000));
        } else if (scoreCpMatch) {
          latestScoreCp = Number(scoreCpMatch[1]);
        }

        if (pvMatch) {
          const pv = pvMatch[1].trim().split(/\s+/).filter(Boolean);
          latestPvMoves = maxPvPlies > 0 ? pv.slice(0, maxPvPlies) : pv;
        }
      }

      if (line.startsWith("bestmove ")) {
        const parts = line.split(" ");
        latestBestMove = parts[1] && parts[1] !== "(none)" ? parts[1] : null;
      }
    }

    if (latestScoreCp === null) return null;

    return {
      cp: latestScoreCp,
      bestMove: latestBestMove,
      pvMoves: latestPvMoves
    };
  }

  /** Parse multi-PV output — returns one LocalEngineLine per PV, sorted best-first */
  private parseMultiPv(lines: string[]): LocalEngineLine[] {
    // Collect the latest info line for each multipv index
    const pvMap = new Map<number, { cp: number; pv: string[] }>();
    let bestMove: string | null = null;

    for (const line of lines) {
      if (line.startsWith("info ") && line.includes(" multipv ")) {
        const pvIdxMatch = line.match(/\bmultipv (\d+)/);
        if (!pvIdxMatch) continue;
        const pvIdx = Number(pvIdxMatch[1]);

        let cp: number | null = null;
        const scoreCpMatch = line.match(/\bscore cp (-?\d+)/);
        const scoreMateMatch = line.match(/\bscore mate (-?\d+)/);
        if (scoreMateMatch) {
          const m = Number(scoreMateMatch[1]);
          cp = (m > 0 ? 1 : -1) * (MATE_CP - Math.min(Math.abs(m), 1000));
        } else if (scoreCpMatch) {
          cp = Number(scoreCpMatch[1]);
        }
        if (cp === null) continue;

        const pvMatch = line.match(/\bpv\s+(.+)$/);
        const pv = pvMatch ? pvMatch[1].trim().split(/\s+/).filter(Boolean) : [];

        pvMap.set(pvIdx, { cp, pv });
      }

      if (line.startsWith("bestmove ")) {
        const parts = line.split(" ");
        bestMove = parts[1] && parts[1] !== "(none)" ? parts[1] : null;
      }
    }

    const results: LocalEngineLine[] = [];
    for (const [, val] of [...pvMap.entries()].sort((a, b) => a[0] - b[0])) {
      results.push({
        cp: val.cp,
        bestMove: val.pv[0] ?? null,
        pvMoves: val.pv,
      });
    }
    // Ensure the first result has the actual bestmove from the engine
    if (results.length > 0 && bestMove) results[0].bestMove = bestMove;
    return results;
  }

  private async analyzeFenInternal(fen: string, depth: number, maxPvPlies: number): Promise<LocalEngineLine | null> {
    await this.ensureReady();

    if (!this.worker) {
      return null;
    }

    this.worker.postMessage(`position fen ${fen}`);
    const searchLines = await this.sendAndWaitFor(`go depth ${depth}`, (line) => line.startsWith("bestmove "));
    return this.parseInfo(searchLines, maxPvPlies);
  }

  /** Run multi-PV analysis and return the top N lines */
  private async analyzeMultiPvInternal(fen: string, depth: number, numPv: number): Promise<LocalEngineLine[]> {
    await this.ensureReady();
    if (!this.worker) return [];

    // Set multi-PV, run search, then reset to 1
    await this.sendAndWaitFor(`setoption name MultiPV value ${numPv}`, (line) => true);
    await this.sendAndWaitFor("isready", (line) => line.trim() === "readyok");
    this.worker.postMessage(`position fen ${fen}`);
    const searchLines = await this.sendAndWaitFor(`go depth ${depth}`, (line) => line.startsWith("bestmove "));
    await this.sendAndWaitFor("setoption name MultiPV value 1", (line) => true);
    await this.sendAndWaitFor("isready", (line) => line.trim() === "readyok");
    return this.parseMultiPv(searchLines);
  }

  async evaluateFen(fen: string, depth = 10): Promise<LocalEngineEval | null> {
    const cacheKey = `${fen}|d${depth}`;

    if (this.evalCache.has(cacheKey)) {
      return this.evalCache.get(cacheKey)!;
    }

    // Reuse a higher-depth cached result if available (higher depth ⊇ lower depth accuracy)
    const maxCached = this.maxDepthPerFen.get(fen) ?? 0;
    if (maxCached > depth) {
      const higherKey = `${fen}|d${maxCached}`;
      const val = this.evalCache.get(higherKey);
      if (val) {
        this.evalCache.set(cacheKey, val);
        return val;
      }
    }

    this._pendingTasks++;
    try {
      return await this.enqueue(async () => {
        if (this.evalCache.has(cacheKey)) {
          return this.evalCache.get(cacheKey)!;
        }

        const line = await this.analyzeFenInternal(fen, depth, 0);
        const parsed = line ? { cp: line.cp, bestMove: line.bestMove } : null;
        this.evalCache.set(cacheKey, parsed);
        // Track max depth for fast higher-depth lookups
        const prevMax = this.maxDepthPerFen.get(fen) ?? 0;
        if (depth > prevMax) this.maxDepthPerFen.set(fen, depth);
        return parsed;
      });
    } finally {
      this._pendingTasks--;
    }
  }

  async getPrincipalVariation(fen: string, maxPlies = 10, depth = 12): Promise<LocalEngineLine | null> {
    this._pendingTasks++;
    try {
      return await this.enqueue(async () => {
        return this.analyzeFenInternal(fen, depth, maxPlies);
      });
    } finally {
      this._pendingTasks--;
    }
  }

  /** Get the top N moves with evaluations (multi-PV) */
  async getTopMoves(fen: string, numMoves = 5, depth = 10): Promise<LocalEngineLine[]> {
    this._pendingTasks++;
    try {
      return await this.enqueue(async () => {
        return this.analyzeMultiPvInternal(fen, depth, numMoves);
      });
    } finally {
      this._pendingTasks--;
    }
  }

  /** Terminate the underlying Web Worker and release resources. */
  destroy(): void {
    this.worker?.terminate();
    this.worker = null;
    this.initialized = false;
    this.evalCache.clear();
    this.maxDepthPerFen.clear();
  }
}

/* ================================================================
 * StockfishPool — distributes evaluations across N workers for
 * parallel analysis. Falls back gracefully to a single worker
 * when Web Workers or hardwareConcurrency are unavailable.
 * ================================================================ */

const isMobile =
  typeof navigator !== "undefined" &&
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

const DEFAULT_POOL_SIZE =
  typeof navigator !== "undefined"
    ? Math.min(navigator.hardwareConcurrency || 2, isMobile ? 2 : 4)
    : 2;

export class StockfishPool {
  private workers: StockfishClient[] = [];
  private evalCache = new Map<string, LocalEngineEval | null>();
  /** Tracks the highest depth evaluated for each FEN to avoid O(n) cache scans */
  private maxDepthPerFen = new Map<string, number>();
  /** Number of Stockfish Web Workers in the pool. */
  readonly size: number;

  constructor(size?: number) {
    this.size = size ?? DEFAULT_POOL_SIZE;
  }

  private ensureWorkers(): void {
    if (this.workers.length > 0) return;
    for (let i = 0; i < this.size; i++) {
      this.workers.push(new StockfishClient());
    }
  }

  /** Pick the worker with the fewest pending tasks. */
  private pickWorker(): StockfishClient {
    this.ensureWorkers();
    let best = this.workers[0];
    for (let i = 1; i < this.workers.length; i++) {
      if (this.workers[i].pendingTasks < best.pendingTasks) {
        best = this.workers[i];
      }
    }
    return best;
  }

  async evaluateFen(fen: string, depth = 10): Promise<LocalEngineEval | null> {
    const cacheKey = `${fen}|d${depth}`;

    if (this.evalCache.has(cacheKey)) {
      return this.evalCache.get(cacheKey)!;
    }

    // Reuse a higher-depth cached result if available
    const maxCached = this.maxDepthPerFen.get(fen) ?? 0;
    if (maxCached > depth) {
      const higherKey = `${fen}|d${maxCached}`;
      const val = this.evalCache.get(higherKey);
      if (val) {
        this.evalCache.set(cacheKey, val);
        return val;
      }
    }

    const worker = this.pickWorker();
    const result = await worker.evaluateFen(fen, depth);
    this.evalCache.set(cacheKey, result);
    // Track max depth for fast higher-depth lookups
    const prevMax = this.maxDepthPerFen.get(fen) ?? 0;
    if (depth > prevMax) this.maxDepthPerFen.set(fen, depth);
    return result;
  }

  async getPrincipalVariation(fen: string, maxPlies = 10, depth = 12): Promise<LocalEngineLine | null> {
    const worker = this.pickWorker();
    return worker.getPrincipalVariation(fen, maxPlies, depth);
  }

  /** Get the top N moves with evaluations (multi-PV) */
  async getTopMoves(fen: string, numMoves = 5, depth = 10): Promise<LocalEngineLine[]> {
    const worker = this.pickWorker();
    return worker.getTopMoves(fen, numMoves, depth);
  }

  /** Terminate all workers and free resources. */
  destroy(): void {
    for (const w of this.workers) w.destroy();
    this.workers = [];
    this.evalCache.clear();
    this.maxDepthPerFen.clear();
  }
}

export const stockfishClient = new StockfishClient();
export const stockfishPool = new StockfishPool();
