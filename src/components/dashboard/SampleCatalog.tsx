"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

interface Product {
  title: string;
  price: number;
  brand?: string;
  category?: string;
  thumbnail: string;
  stock: number;
}

interface CatalogState {
  status: "loading" | "ready" | "error";
  products: Product[];
  message?: string;
}

/**
 * Demo panel for /api/products: fetch → render, with an honest error state
 * and a retry button. Labeled as sample data everywhere it appears.
 */
export function SampleCatalog() {
  const [state, setState] = useState<CatalogState>({ status: "loading", products: [] });

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/products?limit=6", { signal });
      const body = (await response.json()) as {
        products?: Product[];
        error?: { message?: string };
      };
      if (!response.ok || !Array.isArray(body.products)) {
        setState({
          status: "error",
          products: [],
          message: body.error?.message ?? "The sample catalog could not be loaded.",
        });
        return;
      }
      setState({ status: "ready", products: body.products });
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      setState({
        status: "error",
        products: [],
        message: "The sample catalog could not be reached. Check the connection and retry.",
      });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // Deferred so the initial fetch does not setState synchronously in the
    // effect body (react-hooks/set-state-in-effect); aborted on unmount.
    const timer = window.setTimeout(() => {
      void load(controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [load]);

  const retry = useCallback(() => {
    setState({ status: "loading", products: [] });
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="eyebrow !mb-0">Sample catalog</p>
          <span className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[0.65rem] tracking-[0.14em] text-faint">
            DEMO · DUMMYJSON
          </span>
        </div>
        <button
          type="button"
          onClick={retry}
          disabled={state.status === "loading"}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line px-4 font-display text-sm text-dim transition hover:border-linestrong hover:text-ink disabled:opacity-60"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${state.status === "loading" ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Refresh
        </button>
      </div>

      <p className="max-w-2xl text-sm leading-relaxed text-faint">
        Live fetch against <code className="text-dim">/api/products</code>, a server-side proxy in
        front of DummyJSON — public test data used to demonstrate caching and error handling, not
        real inventory.
      </p>

      {state.status === "loading" ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index} className="panel animate-pulse rounded-2xl p-4">
              <div className="mb-3 h-28 rounded-xl bg-accentsoft/40" />
              <div className="mb-2 h-4 w-3/4 rounded bg-accentsoft/40" />
              <div className="h-3 w-1/3 rounded bg-accentsoft/40" />
            </li>
          ))}
        </ul>
      ) : null}

      {state.status === "error" ? (
        <div role="alert" className="panel flex flex-col items-start gap-4 rounded-2xl border-linestrong p-5">
          <p className="text-sm leading-relaxed text-ink">{state.message}</p>
          <button type="button" className="btn-ghost" onClick={retry}>
            Try again
          </button>
        </div>
      ) : null}

      {state.status === "ready" ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {state.products.map((product) => (
            <li key={product.title} className="panel flex flex-col gap-3 rounded-2xl p-4">
              {/* External demo thumbnails — next/image not configured for dummyjson.com. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.thumbnail}
                alt=""
                loading="lazy"
                className="aspect-[4/3] w-full rounded-xl object-cover"
              />
              <div className="flex flex-col gap-1">
                <p className="font-display text-sm text-ink">{product.title}</p>
                <p className="font-mono text-xs text-accent">
                  ${product.price.toFixed(2)}
                  {product.brand ? <span className="text-faint"> · {product.brand}</span> : null}
                </p>
                <p className="text-xs text-faint">
                  {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                  {product.category ? ` · ${product.category}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
