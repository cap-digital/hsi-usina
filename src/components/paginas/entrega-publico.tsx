"use client";

import { motion } from "motion/react";
import { useMemo, useState } from "react";
import type { PublicoLinha } from "@/data/types";
import { fmtCompact, fmtPct } from "@/data/format";
import { cn } from "@/lib/utils";

type Tipo = "impressoes" | "alcance" | "engajamento" | "investimento";
const TIPOS: { k: Tipo; label: string }[] = [
  { k: "impressoes", label: "Impressões" },
  { k: "alcance", label: "Alcance" },
  { k: "engajamento", label: "Engajamento" },
  { k: "investimento", label: "Investimento" },
];
const ORDEM = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const F = "var(--verde)";
const M = "var(--verde-escuro)";

/** Entrega por gênero × idade, com seletor. Só idade e gênero informados; % sobre o informado. */
export function EntregaPublico({ linhas }: { linhas: PublicoLinha[] }) {
  const [tipo, setTipo] = useState<Tipo>("impressoes");
  const { rows, total, totF, totM, topo } = useMemo(() => {
    const v = (idade: string, g: string) => linhas.filter((l) => l.idade === idade && l.genero === g).reduce((s, l) => s + l[tipo], 0);
    const rows = ORDEM.filter((f) => linhas.some((l) => l.idade === f)).map((faixa) => ({ faixa, f: v(faixa, "female"), m: v(faixa, "male") }));
    const totF = rows.reduce((s, r) => s + r.f, 0);
    const totM = rows.reduce((s, r) => s + r.m, 0);
    const total = totF + totM || 1;
    const topo = [...rows].sort((a, b) => b.f + b.m - (a.f + a.m))[0];
    return { rows, total, totF, totM, topo };
  }, [linhas, tipo]);
  const max = Math.max(...rows.flatMap((r) => [r.f, r.m]), 1);

  return (
    <div>
      <div role="tablist" aria-label="Tipo de entrega" className="no-print -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:flex-wrap md:overflow-visible" data-lenis-prevent-horizontal>
        {TIPOS.map((t) => (
          <button
            key={t.k}
            role="tab"
            aria-selected={tipo === t.k}
            onClick={() => setTipo(t.k)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors duration-300",
              tipo === t.k ? "border-transparent bg-[var(--verde-escuro)] text-white" : "border-line-strong text-text-2 hover:border-[var(--verde)] hover:text-[var(--verde-escuro)]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-[1fr_52px_1fr] gap-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] md:grid-cols-[1fr_64px_1fr] md:gap-3 md:text-[11px] md:tracking-[0.18em]">
        <span className="text-right" style={{ color: F }}>
          Mulheres · {fmtPct(totF / total, 1)}
        </span>
        <span />
        <span style={{ color: M }}>Homens · {fmtPct(totM / total, 1)}</span>
      </div>
      <div className="mt-4 flex flex-col gap-2.5">
        {[...rows].reverse().map((r, i) => (
          <div key={r.faixa} className="grid grid-cols-[1fr_52px_1fr] items-center gap-2 md:grid-cols-[1fr_64px_1fr] md:gap-3">
            <Bar v={r.f} max={max} total={total} color={F} right delay={i * 0.06} k={tipo} />
            <span className="text-center text-[12.5px] font-semibold text-text-2 tabular">{r.faixa}</span>
            <Bar v={r.m} max={max} total={total} color={M} right={false} delay={i * 0.06} k={tipo} />
          </div>
        ))}
      </div>
      <p className="mt-6 text-[11px] leading-relaxed text-text-3">
        {topo && (
          <>
            Faixa com mais {TIPOS.find((t) => t.k === tipo)?.label.toLowerCase()}: <strong className="text-[var(--verde-escuro)]">{topo.faixa}</strong> (
            {fmtPct((topo.f + topo.m) / total, 1)}
            {tipo !== "investimento" ? ` · ${fmtCompact(topo.f + topo.m)}` : ""}). Percentuais sobre o total com idade e gênero informados.
            {tipo === "alcance" ? " Alcance somado entre campanhas." : ""}
          </>
        )}
      </p>
    </div>
  );
}

function Bar({ v, max, total, color, right, delay, k }: { v: number; max: number; total: number; color: string; right: boolean; delay: number; k: string }) {
  const pct = v / total;
  const w = (v / max) * 100;
  // Barra larga: % dentro, em branco. Barra curta: % fora, encostado na ponta da barra.
  const larga = w > 45;
  return (
    <div className={cn("relative h-9 rounded-[6px] bg-surface-3", right ? "flex justify-end" : "flex")}>
      <motion.div
        key={k}
        className="h-full rounded-[6px]"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${(v / max) * 100}%` }}
        transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      />
      <span
        className={cn("absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[11px] font-bold tabular md:text-[11.5px]", larga ? "text-white" : "text-[var(--verde-escuro)]")}
        style={larga ? (right ? { right: 8 } : { left: 8 }) : right ? { right: `calc(${w}% + 6px)` } : { left: `calc(${w}% + 6px)` }}
      >
        {fmtPct(pct, 1)}
      </span>
    </div>
  );
}
