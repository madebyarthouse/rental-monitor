type LimiterTask<T> = () => Promise<T>;

class ConcurrencyLimiter {
  private readonly queue: Array<LimiterTask<unknown>> = [];
  private active = 0;

  constructor(private readonly max: number) {}

  run<T>(task: LimiterTask<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const wrapped = async () => {
        try {
          this.active++;
          const result = await task();
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          this.active--;
          this.next();
        }
      };
      this.queue.push(wrapped);
      this.next();
    });
  }

  private next() {
    if (this.active >= this.max) return;
    const task = this.queue.shift();
    if (!task) return;
    // Fire and forget; result handled in run's promise
    void task();
  }
}

const defaultLimiter = new ConcurrencyLimiter(4);

export async function fetchHtml(
  url: string,
  init?: RequestInit
): Promise<string> {
  return defaultLimiter.run(async () => {
    const headers = new Headers(init?.headers);
    if (!headers.has("User-Agent")) {
      headers.set(
        "User-Agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36"
      );
    }
    if (!headers.has("Accept")) {
      headers.set(
        "Accept",
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
      );
    }
    const res = await fetch(url, { ...init, headers });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    return await res.text();
  });
}

export function withLimiter<T>(task: LimiterTask<T>): Promise<T> {
  return defaultLimiter.run(task);
}


