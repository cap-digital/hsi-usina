"use client";

import { motion } from "motion/react";
import { useState } from "react";
import type { CelulaGrade, Estrategia, Grade } from "@/data/types";
import { fmtBRL, fmtMetricaPrincipal, nomeMes, rodou, rotuloMes } from "@/data/format";

/** Investimento por estratégia × mês (só meses com veiculação), em escala raiz. Célula vazia = a estratégia não rodou no mês. */
export function GradeEstrategias({ grade, estrategias }: { grade: Grade; estrategias: Estrategia[] }) {
  const ativas = grade.celulas.filter(rodou);
  const celulas = new Map(ativas.map((c) => [`${c.estrategia}|${c.mes}`, c]));
  const max = Math.max(...ativas.map((c) => c.investimento), 1);
  const principal = new Map(estrategias.map((e) => [e.estrategia, e.principal]));
  const [hi, setHi] = useState<CelulaGrade | null>(null);
  const cols = grade.meses.length;

  return (
    <div className="w-full">
      <div className="overflow-x-auto pb-2" data-lenis-prevent-horizontal>
        <div className="grid min-w-[520px] gap-[4px]" style={{ gridTemplateColumns: `minmax(150px,210px) repeat(${cols}, minmax(0,1fr))` }}>
          <span className="sticky left-0 z-10 bg-white" />
          {grade.meses.map((m) => (
            <span key={m} className="pb-1 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-text-3">
              {rotuloMes(m)}
            </span>
          ))}
          {grade.linhas.map((l, r) => (
            <div key={l} className="contents">
              <span className="sticky left-0 z-10 flex h-full min-w-0 items-center bg-white pr-3 text-[13px] font-medium text-text-2">
                <span className="truncate">{l}</span>
              </span>
              {grade.meses.map((m, col) => {
                const c = celulas.get(`${l}|${m}`);
                const t = c ? Math.sqrt(c.investimento / max) : 0;
                const ativo = c && hi === c;
                return (
                  <motion.span
                    key={m}
                    className="relative flex h-10 items-center justify-center overflow-hidden rounded-[8px] md:h-12"
                    style={{
                      background: c ? `color-mix(in oklab, var(--verde-escuro) ${Math.round(t * 100)}%, var(--verde-claro))` : "rgba(0,99,26,.04)",
                      outline: ativo ? "2px solid var(--verde-escuro)" : "none",
                      outlineOffset: 1,
                    }}
                    initial={{ opacity: 0, scale: 0.4 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: r * 0.05 + col * 0.04 }}
                    onPointerEnter={() => setHi(c ?? null)}
                    onPointerLeave={() => setHi(null)}
                    aria-label={c ? `${l} · ${nomeMes(m)} · ${fmtBRL(c.investimento)}` : undefined}
                  >
                    {c && (
                      <span className={`text-[11px] font-bold tabular ${t > 0.55 ? "text-white" : "text-[var(--verde-escuro)]"}`}>
                        {fmtBRL(c.investimento, { compact: true })}
                      </span>
                    )}
                  </motion.span>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] text-text-2">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-10 rounded-[3px]" style={{ background: "linear-gradient(90deg, var(--verde-claro), var(--verde-escuro))" }} />
          Investimento no mês
        </span>
        <span className="ml-auto text-[10.5px] font-semibold uppercase tracking-[0.2em] text-text-3">Meses com veiculação</span>
      </div>

      {/* Leitura do hover: só na tela (no PDF não há cursor). */}
      <p className="no-print mt-4 min-h-10 text-[11px] font-semibold uppercase leading-relaxed tracking-[0.16em] text-text-3">
        {hi ? (
          <>
            {hi.estrategia} · {nomeMes(hi.mes)} ·{" "}
            <span className="text-[var(--verde-escuro)]">
              {fmtBRL(hi.investimento)} · {fmtMetricaPrincipal(hi, principal.get(hi.estrategia) ?? "impressoes")}
            </span>{" "}
            · {hi.campanhas.join(", ")}
          </>
        ) : (
          "Passe o cursor sobre a grade"
        )}
      </p>
    </div>
  );
}
