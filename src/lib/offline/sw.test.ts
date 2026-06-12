// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Harness for the runtime service worker (`public/sw.js`). It is a classic
 * worker script, so we load it into a sandbox with fake `self`/`caches`/`fetch`,
 * capture its event handlers, and dispatch real `fetch` events to assert the
 * caching strategy per request type. This is the first test coverage for the
 * worker, added with the offline navigation fix (#244).
 */
const SW_PATH = fileURLToPath(
  new URL("../../../public/sw.js", import.meta.url),
);
const ORIGIN = "https://www.tnhiking.club";

type Behavior = "ok" | "offline" | "hang";

function makeCaches() {
  const stores = new Map<string, Map<string, unknown>>();
  const keyOf = (req: { url: string } | string) =>
    typeof req === "string" ? req : req.url;
  async function open(name: string) {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name)!;
    return {
      async match(req: { url: string } | string) {
        return store.get(keyOf(req));
      },
      async put(req: { url: string } | string, res: unknown) {
        store.set(keyOf(req), res);
      },
      async add(req: { url: string } | string) {
        store.set(keyOf(req), { ok: true, _tag: "offline-page" });
      },
    };
  }
  return {
    caches: {
      open,
      async keys() {
        return [...stores.keys()];
      },
      async delete(k: string) {
        return stores.delete(k);
      },
    },
    stores,
  };
}

function makeRequest(
  url: string,
  opts: { mode?: string; accept?: string; rsc?: boolean; method?: string } = {},
) {
  const h = new Map<string, string>();
  if (opts.accept) h.set("accept", opts.accept);
  if (opts.rsc) h.set("rsc", "1");
  return {
    url,
    method: opts.method ?? "GET",
    mode: opts.mode ?? "cors",
    headers: { get: (k: string) => h.get(k.toLowerCase()) ?? null },
    clone() {
      return this;
    },
  };
}

function loadSw(state: { behavior: Behavior; tag: string }) {
  const handlers: Record<string, (e: unknown) => void> = {};
  const { caches } = makeCaches();
  const self = {
    addEventListener: (type: string, fn: (e: unknown) => void) => {
      handlers[type] = fn;
    },
    location: { origin: ORIGIN },
    skipWaiting: () => Promise.resolve(),
    clients: { claim: () => Promise.resolve() },
  };
  const fetchMock = vi.fn(
    (_request: unknown, init?: { signal?: AbortSignal }) =>
      new Promise((resolve, reject) => {
        if (state.behavior === "offline") return reject(new Error("offline"));
        if (state.behavior === "hang") {
          init?.signal?.addEventListener("abort", () =>
            reject(new Error("aborted")),
          );
          return; // otherwise never settles
        }
        resolve({
          ok: true,
          _tag: state.tag,
          clone() {
            return this;
          },
        });
      }),
  );
  const Response = {
    error: () => ({ ok: false, _tag: "neterror" }),
  };
  const sandbox: Record<string, unknown> = {
    self,
    caches,
    fetch: fetchMock,
    URL,
    AbortController,
    Response,
    Set,
    Promise,
    setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
    clearTimeout: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(SW_PATH, "utf8"), sandbox);
  return { handlers, fetchMock };
}

function dispatchFetch(
  handlers: Record<string, (e: unknown) => void>,
  request: unknown,
): Promise<{ _tag?: string } | undefined> | undefined {
  let responded: Promise<{ _tag?: string } | undefined> | undefined;
  handlers.fetch({
    request,
    respondWith(p: unknown) {
      responded = Promise.resolve(p) as Promise<{ _tag?: string } | undefined>;
    },
    waitUntil() {},
  });
  return responded;
}

describe("service worker offline navigation (#244)", () => {
  const state = { behavior: "ok" as Behavior, tag: "net" };
  beforeEach(() => {
    state.behavior = "ok";
    state.tag = "net";
  });

  it("caches an RSC navigation payload online and serves it offline", async () => {
    const { handlers } = loadSw(state);
    const url = `${ORIGIN}/trails/abrams-falls?_rsc=abc`;
    const req = () =>
      makeRequest(url, { accept: "text/x-component", rsc: true });

    state.tag = "rsc-payload";
    const online = await dispatchFetch(handlers, req());
    expect(online?._tag).toBe("rsc-payload");

    state.behavior = "offline";
    const offline = await dispatchFetch(handlers, req());
    expect(offline?._tag).toBe("rsc-payload");
  });

  it("fails an RSC request fast when the network hangs, instead of freezing", async () => {
    vi.useFakeTimers();
    try {
      const { handlers } = loadSw(state);
      state.behavior = "hang";
      const responded = dispatchFetch(
        handlers,
        makeRequest(`${ORIGIN}/explore?_rsc=zzz`, {
          accept: "text/x-component",
          rsc: true,
        }),
      );
      await vi.advanceTimersByTimeAsync(6000);
      const res = await responded;
      // Falls back to a network error so the router does a hard navigation to
      // the cached HTML, rather than hanging until connectivity returns.
      expect(res?._tag).toBe("neterror");
    } finally {
      vi.useRealTimers();
    }
  });

  it("caches optimized images so trail photos load offline", async () => {
    const { handlers } = loadSw(state);
    const url = `${ORIGIN}/_next/image?url=%2Ftrails%2Fgrassy-ridge-bald.jpg&w=640&q=75`;
    const req = () => makeRequest(url, { accept: "image/avif,image/webp,*/*" });

    state.tag = "image";
    const online = await dispatchFetch(handlers, req());
    expect(online?._tag).toBe("image");

    state.behavior = "offline";
    const offline = await dispatchFetch(handlers, req());
    expect(offline?._tag).toBe("image");
  });

  // The WKWebView can hold a connection open in airplane mode instead of
  // failing it, so every fetch path must time out, not just navigation (#244).
  async function settlesWhenNetworkHangs(request: unknown) {
    vi.useFakeTimers();
    try {
      const { handlers } = loadSw(state);
      state.behavior = "hang";
      const responded = dispatchFetch(handlers, request);
      let settled = false;
      void responded?.then(() => {
        settled = true;
      });
      await vi.advanceTimersByTimeAsync(6000);
      await Promise.resolve();
      return settled;
    } finally {
      vi.useRealTimers();
    }
  }

  it("fails a map/tile request fast when the network hangs", async () => {
    const settled = await settlesWhenNetworkHangs(
      makeRequest("https://tiles.openfreemap.org/styles/liberty", {
        accept: "application/json",
      }),
    );
    expect(settled).toBe(true);
  });

  it("fails an uncached asset fast when the network hangs", async () => {
    const settled = await settlesWhenNetworkHangs(
      makeRequest(`${ORIGIN}/_next/static/chunks/app.js`, { accept: "*/*" }),
    );
    expect(settled).toBe(true);
  });
});
