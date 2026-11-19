"use client";

import { Bookmark, Ellipsis, Heart, ImageIcon, MessageCircle, MousePointerClick, Play, Share2, ThumbsUp, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Metricas } from "@/data/types";
import { fmtCompact, fmtNum, fmtPct } from "@/data/format";
import { cn } from "@/lib/utils";

type Chave = "reacoes" | "comentarios" | "compartilhamentos" | "salvamentos" | "linkClick" | "videoViews" | "fotoViews" | "outros";

export const ITENS: { k: Chave; rotulo: string; icone: LucideIcon; destaque: boolean }[] = [
  { k: "reacoes", rotulo: "Curtidas e reações", icone: Heart, destaque: true },
  { k: "comentarios", rotulo: "Comentários", icone: MessageCircle, destaque: true },
  { k: "compartilhamentos", rotulo: "Compartilhamentos", icone: Share2, destaque: true },
  { k: "salvamentos", rotulo: "Salvamentos", icone: Bookmark, destaque: true },
  { k: "linkClick", rotulo: "Cliques no link", icone: MousePointerClick, destaque: false },
  { k: "videoViews", rotulo: "Visualizações de vídeo (3s)", icone: Play, destaque: false },
  { k: "fotoViews", rotulo: "Visualizações de foto", icone: ImageIcon, destaque: false },
  { k: "outros", rotulo: "Outros", icone: Ellipsis, destaque: false },
];

/** Porcentagem que nunca vira "0,0%" para um valor > 0. */
function pct(v: number, total: number): string {
  if (!total || !v) return "0%";
  const p = v / total;
  if (p < 0.001) return "<0,1%";
  return fmtPct(p, p < 0.1 ? 1 : 0);
}

/**
 * O que compõe o engajamento com o post: 4 interações em destaque (barras na escala das quatro) e
 * uma linha secundária (barras na escala do total). % sempre sobre o engajamento total do recorte.
 * Com mais de um recorte em `dados`, mostra o seletor (Todas, Alcance…).
 */
export function ComposicaoEngajamento({ dados, compacto = false }: { dados: { rotulo: string; m: Metricas }[]; compacto?: boolean }) {
  const [sel, setSel] = useState(0);
  const atual = dados[sel] ?? dados[0];
  const m = atual.m;
  const total = m.engajamento;
  const destaques = ITENS.filter((i) => i.destaque);
  const secundarios = ITENS.filter((i) => !i.destaque && m[i.k] > 0);
  const maxDestaque = Math.max(...destaques.map((i) => m[i.k]), 1);

  return (
    <div>
      {dados.length > 1 && (
        <div role="tablist" aria-label="Estratégia" className="no-print mb-6 flex flex-wrap gap-2">
          {dados.map((d, i) => (
            <button
              key={d.rotulo}
              role="tab"
              aria-selected={sel === i}
              onClick={() => setSel(i)}
              className={cn(
                "rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors duration-300",
                sel === i ? "border-transparent bg-[var(--verde-escuro)] text-white" : "border-line-strong text-text-2 hover:border-[var(--verde)] hover:text-[var(--verde-escuro)]",
              )}
            >
              {d.rotulo}
            </button>
          ))}
        </div>
      )}

      <div className={cn("grid gap-3", compacto ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 xl:grid-cols-4")}>
        {destaques.map((it, i) => {
          const v = m[it.k];
          const Icone = it.icone;
          return (
            <div key={it.k} className="rounded-[16px] bg-[var(--surface-3)] p-4 md:p-5">
              <div className="flex items-center gap-2 text-[var(--verde-escuro)]">
                <Icone className="size-4 shrink-0" aria-hidden />
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">{it.rotulo}</span>
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <span className="display text-[clamp(1.7rem,2.6vw,2.4rem)] font-black leading-none text-[var(--verde)] tabular">{fmtNum(v)}</span>
                <span className="pb-0.5 text-[12px] font-bold text-[var(--verde-escuro)] tabular">{pct(v, total)}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                <motion.div
                  key={`${atual.rotulo}-${it.k}`}
                  className="h-full rounded-full bg-[var(--verde)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${(v / maxDestaque) * 100}%` }}
                  transition={{ duration: 0.9, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {!compacto && secundarios.length > 0 && (
        <ul className="mt-5 grid gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
          {secundarios.map((it, i) => {
            const v = m[it.k];
            const Icone = it.icone;
            return (
              <li key={it.k}>
                <div className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="flex items-center gap-2 text-text-2">
                    <Icone className="size-3.5 shrink-0 text-[var(--verde-escuro)]" aria-hidden />
                    {it.rotulo}
                  </span>
                  <span className="shrink-0 font-semibold text-text tabular">
                    {fmtNum(v)} <span className="text-text-3">· {pct(v, total)}</span>
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-3)]">
                  <motion.div
                    key={`${atual.rotulo}-${it.k}`}
                    className="h-full rounded-full bg-[var(--verde-escuro)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${(v / (total || 1)) * 100}%` }}
                    transition={{ duration: 0.9, delay: 0.2 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {dados.length > 1 && <TabelaPdf dados={dados} />}

      <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] leading-relaxed text-text-3">
        <span>
          {fmtNum(total)} engajamentos com o post{dados.length > 1 ? ` · ${atual.rotulo}` : ""}. Percentuais sobre esse total.
        </span>
        {m.curtidasPagina > 0 && (
          <span className="inline-flex items-center gap-1">
            <ThumbsUp className="size-3" aria-hidden /> Além disso, {fmtNum(m.curtidasPagina)} curtidas na página (novos seguidores), que não entram nesse total.
          </span>
        )}
      </p>
    </div>
  );
}

/** Só no PDF (sem seletor): as quatro interações principais de cada recorte numa tabela. */
function TabelaPdf({ dados }: { dados: { rotulo: string; m: Metricas }[] }) {
  const cols = ITENS.filter((i) => i.destaque);
  return (
    <table className="so-pdf mt-6 w-full border-collapse text-left text-[12.5px]">
      <thead>
        <tr className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-3">
          <th className="py-2 pr-4 font-semibold">Estratégia</th>
          {cols.map((c) => (
            <th key={c.k} className="py-2 pl-4 text-right font-semibold">
              {c.rotulo}
            </th>
          ))}
          <th className="py-2 pl-4 text-right font-semibold">Engajamento total</th>
        </tr>
      </thead>
      <tbody>
        {dados.map((d, i) => (
          <tr key={d.rotulo} className={cn("border-t border-line", i === 0 && "font-bold")}>
            <td className="py-1.5 pr-4 font-semibold text-[var(--verde-escuro)]">{d.rotulo}</td>
            {cols.map((c) => (
              <td key={c.k} className="py-1.5 pl-4 text-right tabular">
                {fmtNum(d.m[c.k])}
              </td>
            ))}
            <td className="py-1.5 pl-4 text-right tabular">{fmtNum(d.m.engajamento)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Ícones + números de reações, comentários e compartilhamentos (cards de criativos). */
export function InteracoesMini({ m, className }: { m: Metricas; className?: string }) {
  const itens = [
    { k: "reacoes" as const, icone: Heart, rotulo: "curtidas e reações" },
    { k: "comentarios" as const, icone: MessageCircle, rotulo: "comentários" },
    { k: "compartilhamentos" as const, icone: Share2, rotulo: "compartilhamentos" },
  ];
  return (
    <div className={cn("flex items-center gap-3 text-[11.5px] font-semibold text-[var(--verde-escuro)] tabular", className)}>
      {itens.map(({ k, icone: Icone, rotulo }) => (
        <span key={k} className="inline-flex items-center gap-1" title={`${fmtNum(m[k])} ${rotulo}`} aria-label={`${fmtNum(m[k])} ${rotulo}`}>
          <Icone className="size-3.5" aria-hidden />
          {fmtCompact(m[k])}
        </span>
      ))}
    </div>
  );
}
