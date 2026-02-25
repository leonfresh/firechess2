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
  private queue: Promise<void> = Promise.resolve();

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

  private async analyzeFenInternal(fen: string, depth: number, maxPvPlies: number): Promise<LocalEngineLine | null> {
    await this.ensureReady();

    if (!this.worker) {
      return null;
    }

    this.worker.postMessage(`position fen ${fen}`);
    const searchLines = await this.sendAndWaitFor(`go depth ${depth}`, (line) => line.startsWith("bestmove "));
    return this.parseInfo(searchLines, maxPvPlies);
  }

  async evaluateFen(fen: string, depth = 10): Promise<LocalEngineEval | null> {
    const cacheKey = `${fen}|d${depth}`;

    if (this.evalCache.has(cacheKey)) {
      return this.evalCache.get(cacheKey)!;
    }

    // Reuse a higher-depth cached result if available (higher depth ⊇ lower depth accuracy)
    for (const [key, val] of this.evalCache) {
      if (!key.startsWith(`${fen}|d`)) continue;
      const cachedDepth = parseInt(key.split("|d")[1], 10);
      if (cachedDepth > depth && val) {
        this.evalCache.set(cacheKey, val);
        return val;
      }
    }

    return this.enqueue(async () => {
      if (this.evalCache.has(cacheKey)) {
        return this.evalCache.get(cacheKey)!;
      }

      const line = await this.analyzeFenInternal(fen, depth, 0);
      const parsed = line ? { cp: line.cp, bestMove: line.bestMove } : null;
      this.evalCache.set(cacheKey, parsed);
      return parsed;
    });
  }

  async getPrincipalVariation(fen: string, maxPlies = 10, depth = 12): Promise<LocalEngineLine | null> {
    return this.enqueue(async () => {
      return this.analyzeFenInternal(fen, depth, maxPlies);
    });
  }
}

export const stockfishClient = new StockfishClient();
