"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useHubReady } from "@/components/core/preloader";
import { SplitHeading } from "@/components/core/split-heading";
import { LinhasCasa } from "@/components/core/casa";
import { LogoHSI } from "@/components/core/logo";
import { cn } from "@/lib/utils";

export interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  /** "verde": bloco verde cheio (capa, Início). "claro": fundo menta (páginas internas). */
  variante?: "verde" | "claro";
  /** Pílula verde-escura ao lado do título (ex.: "2026"). */
  selo?: string;
  kpis?: ReactNode;
  children?: ReactNode;
}

/**
 * Hero das páginas: título Black em caixa alta (SplitHeading), motivo das linhas em "casa"
 * em parallax, eyebrow espaçado, descrição, linha de KPIs e slot extra (botão do PDF).
 */
export function PageHero({ eyebrow, title, description, variante = "claro", selo, kpis, children }: PageHeroProps) {
  const rootRef = useRef<HTMLElement>(null);
  const ready = useHubReady();
  const verde = variante === "verde";

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to("[data-page-hero-parallax]", {
          yPercent: 14,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to("[data-page-hero-content]", {
          yPercent: -6,
          autoAlpha: 0.15,
          ease: "none",
          scrollTrigger: { trigger: root, start: "35% top", end: "bottom top", scrub: true },
        });
      });
    },
    { scope: rootRef },
  );

  useGSAP(
    () => {
      if (!ready) return;
      const root = rootRef.current;
      if (!root) return;
      const items = gsap.utils.toArray<HTMLElement>("[data-page-hero-item]", root);
      const linhas = root.querySelectorAll<SVGPathElement>("[data-page-hero-glow] path");
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.fromTo(items, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7, stagger: 0.06, ease: "power2.out" });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(items, { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.3, ease: "expo.out", stagger: 0.1, delay: 0.42 });
        if (linhas.length) {
          gsap.fromTo(linhas, { drawSVG: "50% 50%" }, { drawSVG: "0% 100%", duration: 2.2, ease: "expo.out", stagger: 0.07 });
        }
      });
    },
    { scope: rootRef, dependencies: [ready] },
  );

  return (
    <section
      ref={rootRef}
      data-hero
      data-variante={variante}
      className={cn(
        "relative isolate flex min-h-[85svh] flex-col justify-end overflow-hidden pb-[clamp(40px,6vw,80px)] pt-[clamp(130px,22vh,220px)]",
        verde ? "bg-[var(--verde)] text-[var(--verde-escuro)]" : "bg-[var(--ink)] text-[var(--text)]",
      )}
    >
      {/* ---- fundo: linhas em "casa" ---- */}
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div data-page-hero-parallax className="absolute inset-0">
          <div data-page-hero-glow className={cn("absolute", verde ? "-right-[12%] -top-[6%] h-[125%] w-[62%]" : "-right-[18%] -top-[18%] h-[130%] w-[60%]")}>
            <LinhasCasa
              className="size-full"
              cor={verde ? "var(--verde-escuro)" : "var(--verde)"}
              linhas={verde ? 8 : 6}
              opacidade={verde ? 0.6 : 0.35}
            />
          </div>
        </div>
        {!verde && <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[var(--ink)] to-transparent" />}
      </div>

      {/* ---- conteúdo ---- */}
      <div data-page-hero-content className="container-hub relative z-10 w-full">
        <div className="flex items-start justify-between gap-8">
          <div className="min-w-0">
            <p data-page-hero-item className={cn("eyebrow", verde ? "text-[var(--verde-escuro)]" : "text-[var(--verde)]")} style={{ opacity: 0 }}>
              {eyebrow}
            </p>

            <SplitHeading
              as="h1"
              type="words"
              trigger="ready"
              delay={0.2}
              className={cn(
                // Mobile: 10,5vw faz "INVESTIMENTO" (12 letras, ~7,5em) caber em 320px; desktop como antes.
                "display titulo-secao mt-[clamp(14px,2vw,26px)] max-w-[13ch] text-[clamp(2rem,10.5vw,3.5rem)] leading-[0.95] md:text-[clamp(3.5rem,7.6vw,8rem)] md:leading-[0.92]",
                verde ? "text-[var(--verde-escuro)] [&_em]:text-white" : "text-[var(--verde-escuro)] [&_em]:text-[var(--verde)]",
              )}
            >
              {title}
            </SplitHeading>

            {selo ? (
              <div data-page-hero-item className="mt-[clamp(16px,2vw,28px)]" style={{ opacity: 0 }}>
                <span className="selo px-5 py-2 text-[15px] tracking-[0.3em]">{selo}</span>
              </div>
            ) : null}
          </div>

          {verde ? (
            <div data-page-hero-item className="hidden shrink-0 md:block" style={{ opacity: 0 }}>
              <LogoHSI cor="branco" altura={176} priority />
            </div>
          ) : null}
        </div>

        {description ? (
          <p
            data-page-hero-item
            className={cn(
              "mt-[clamp(20px,2.6vw,36px)] max-w-[56ch] text-[15px] leading-[1.55] md:text-[17.5px]",
              verde ? "font-medium text-[var(--verde-escuro)]" : "text-[var(--text-2)]",
            )}
            style={{ opacity: 0 }}
          >
            {description}
          </p>
        ) : null}

        {kpis ? (
          <div
            data-page-hero-item
            className={cn("mt-[clamp(32px,4.5vw,64px)] border-t pt-[clamp(20px,3vw,36px)]", verde ? "border-[var(--verde-escuro)]/25" : "border-[var(--line)]")}
            style={{ opacity: 0 }}
          >
            {kpis}
          </div>
        ) : null}

        {children ? (
          <div data-page-hero-item className="mt-[clamp(20px,3vw,32px)]" style={{ opacity: 0 }}>
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default PageHero;
