"use client";

import { LinhasCasa } from "@/components/core/casa";
import { LogoHSI } from "@/components/core/logo";
import { Reveal } from "@/components/core/reveal";
import { TransitionLink } from "@/components/core/transition-link";
import { fmtAtualizado, fmtDia } from "@/data/format";
import { usePainel } from "@/data/provider";
import { ROUTES } from "./nav";

const FONTES = ["Meta · Facebook e Instagram", "Gerenciador de Anúncios do hospital", "1º jan → 31 out 2026"];

/** Rodapé em bloco verde: logo branco, navegação, fontes e notas. */
export function Footer() {
  const painel = usePainel();
  const showWarnings = process.env.NODE_ENV !== "production" && painel.avisos.length > 0;

  return (
    <footer className="relative isolate mt-[clamp(64px,8vw,120px)] overflow-hidden bg-[var(--verde)] text-[var(--verde-escuro)]">
      <div className="absolute -right-[20%] -top-[30%] -z-10 h-[160%] w-[70%]" aria-hidden>
        <LinhasCasa className="size-full" cor="var(--verde-escuro)" linhas={6} opacidade={0.4} />
      </div>
      <div className="container-hub pb-10 pt-[clamp(56px,7vw,96px)]">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1.2fr]">
          <Reveal className="flex flex-col gap-6" y={24}>
            <LogoHSI cor="branco" altura={120} />
            <p className="max-w-sm text-[15px] font-medium leading-relaxed">
              Relatório de desempenho do {painel.cliente} na Meta em {painel.periodo.inicio.slice(0, 4)}: investimento, entrega, público, campanhas
              e criativos no Facebook e no Instagram.
            </p>
          </Reveal>

          <Reveal as="nav" aria-label="Rodapé" className="flex flex-col gap-3" y={24} delay={0.05}>
            <span className="eyebrow mb-2 text-white">Navegação</span>
            {ROUTES.map((link) => (
              <TransitionLink key={link.href} href={link.href} className="w-fit text-[15px] font-medium transition-colors duration-300 hover:text-white">
                {link.label}
              </TransitionLink>
            ))}
          </Reveal>

          <Reveal className="flex flex-col gap-3" y={24} delay={0.1}>
            <span className="eyebrow mb-2 text-white">Fonte dos dados</span>
            {FONTES.map((line) => (
              <span key={line} className="text-[15px] font-medium">
                {line}
              </span>
            ))}
          </Reveal>
        </div>

        <div className="mt-[clamp(40px,5vw,72px)] flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-[var(--verde-escuro)]/25 pt-6 text-[10.5px] font-semibold uppercase tracking-[0.22em]">
          <span>
            Período {fmtDia(painel.periodo.inicio)} → {fmtDia(painel.periodo.fim)} 2026 · dados de {fmtAtualizado(painel.atualizadoEm)}
          </span>
          <span>Hospital Santa Izabel · Santa Casa da Bahia</span>
        </div>

        {painel.notas.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-1 text-[11.5px] leading-relaxed" role="list">
            {painel.notas.map((nota) => (
              <li key={nota}>{nota}</li>
            ))}
          </ul>
        ) : null}

        {showWarnings ? (
          <ul className="mt-3 flex flex-col gap-1 text-[10.5px] tracking-[0.06em] text-white" role="list">
            {painel.avisos.map((warning) => (
              <li key={warning}>⚠ {warning}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </footer>
  );
}
