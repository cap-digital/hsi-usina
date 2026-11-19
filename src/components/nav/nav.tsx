"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { useScrollState } from "@/hooks/use-scroll-state";
import { LogoHSI } from "@/components/core/logo";
import { TransitionLink } from "@/components/core/transition-link";
import { fmtDia } from "@/data/format";
import { usePainel } from "@/data/provider";
import { MenuOverlay } from "./menu-overlay";

export const ROUTES = [
  { href: "/", label: "Início" },
  { href: "/midia", label: "Mídia" },
  { href: "/campanhas", label: "Campanhas" },
] as const;

export function activeRouteIndex(pathname: string): number {
  return ROUTES.findIndex((r) => (r.href === "/" ? pathname === "/" : pathname.startsWith(r.href)));
}

function RoutePills({ pathname, sobreVerde }: { pathname: string; sobreVerde: boolean }) {
  const listRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const activeIndex = activeRouteIndex(pathname);

  useGSAP(
    () => {
      const list = listRef.current;
      const indicator = indicatorRef.current;
      if (!list || !indicator) return;

      let animated = false;
      const move = () => {
        const target = list.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
        if (!target) {
          gsap.to(indicator, { autoAlpha: 0, duration: 0.3 });
          return;
        }
        gsap.to(indicator, {
          x: target.offsetLeft,
          width: target.offsetWidth,
          autoAlpha: 1,
          duration: animated ? 0.7 : 0,
          ease: "power4.inOut",
          overwrite: "auto",
        });
        animated = true;
      };

      move();
      const ro = new ResizeObserver(() => {
        animated = false;
        move();
      });
      ro.observe(list);
      return () => ro.disconnect();
    },
    { scope: listRef, dependencies: [activeIndex] },
  );

  return (
    <nav aria-label="Seções do relatório" className="hidden md:block">
      <div
        ref={listRef}
        className={cn(
          "relative flex items-center rounded-full border p-1 backdrop-blur-md transition-colors duration-500",
          sobreVerde ? "border-white/40 bg-white/15" : "border-line bg-white/70",
        )}
      >
        <span
          ref={indicatorRef}
          aria-hidden="true"
          className="absolute left-0 top-1 h-[calc(100%-8px)] rounded-full bg-[var(--verde-escuro)] opacity-0"
        />
        {ROUTES.map((route, i) => {
          const active = i === activeIndex;
          return (
            <TransitionLink
              key={route.href}
              href={route.href}
              data-index={i}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative z-10 rounded-full px-4 py-2 text-[13px] font-medium tracking-[-0.01em] transition-colors duration-500 ease-[var(--ease-out-expo)]",
                active ? "text-white" : sobreVerde ? "text-[var(--verde-escuro)] hover:text-white" : "text-text-2 hover:text-[var(--verde-escuro)]",
              )}
            >
              {route.label}
            </TransitionLink>
          );
        })}
      </div>
    </nav>
  );
}

/** Fixed top bar: logo, segmented route pills, updated-at stamp and the menu button. */
export function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrolled, direction, y } = useScrollState(40);
  const hidden = !menuOpen && direction === "down" && y > 320;
  const painel = usePainel();
  // No topo do Início o nav fica sobre o bloco verde do hero: logo branco e o logo grande do hero já aparece.
  const sobreVerde = pathname === "/" && !scrolled && !menuOpen;

  // Close the menu whenever the route changes (safety net; links also close it).
  useEffect(() => {
    const id = requestAnimationFrame(() => setMenuOpen(false));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <>
      <header
        data-open={menuOpen}
        className={cn(
          "hub-nav fixed inset-x-0 top-0 transition-[transform,background-color,border-color] duration-700 ease-[var(--ease-out-expo)]",
          scrolled && !menuOpen && "hub-nav--glass",
          hidden && "-translate-y-full",
        )}
        style={{ zIndex: "var(--z-nav)" }}
      >
        <div className="container-hub flex h-[72px] items-center justify-between gap-6 md:h-20">
          <TransitionLink href="/" aria-label="Início — Relatório de Desempenho, Hospital Santa Izabel" className="relative flex shrink-0 items-center">
            <LogoHSI cor={sobreVerde ? "branco" : "verde"} altura={52} priority className={cn("transition-opacity duration-500", sobreVerde && "md:opacity-0")} />
          </TransitionLink>

          <RoutePills pathname={pathname} sobreVerde={sobreVerde} />

          <div className="flex items-center gap-5">
            <span className={cn("hidden text-[11px] font-semibold uppercase tracking-[0.22em] lg:inline tabular", sobreVerde ? "text-[var(--verde-escuro)]" : "text-text-3")}>
              Meta · {fmtDia(painel.periodo.inicio)} → {fmtDia(painel.periodo.fim)} 2026
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="menu-overlay"
              data-open={menuOpen}
              className={cn(
                "group/burger flex h-10 items-center gap-3 rounded-full border px-4 transition-[border-color,background-color] duration-500 ease-[var(--ease-out-expo)]",
                menuOpen ? "border-text/30 bg-text/5" : sobreVerde ? "border-[var(--verde-escuro)]/40 hover:bg-white/15" : "border-line bg-white/70 hover:border-line-strong",
              )}
            >
              {/* Both labels share one grid cell so the button is as wide as the longest word ("Fechar"). */}
              <span className={cn("relative grid h-[11px] overflow-hidden text-[11px] font-semibold uppercase leading-[11px] tracking-[0.2em]", sobreVerde ? "text-[var(--verde-escuro)]" : "text-text")}>
                <span
                  className={cn(
                    "col-start-1 row-start-1 block transition-transform duration-500 ease-[var(--ease-out-expo)]",
                    menuOpen && "-translate-y-full",
                  )}
                >
                  Menu
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "col-start-1 row-start-1 block translate-y-full transition-transform duration-500 ease-[var(--ease-out-expo)]",
                    menuOpen && "translate-y-0",
                  )}
                >
                  Fechar
                </span>
              </span>
              <span className={cn("relative block h-3 w-5", sobreVerde ? "text-[var(--verde-escuro)]" : "text-text")} aria-hidden="true">
                <span className="burger-line" />
                <span className="burger-line" />
              </span>
            </button>
          </div>
        </div>
      </header>

      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
