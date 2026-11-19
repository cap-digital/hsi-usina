"use client";

import { motion } from "motion/react";
import { useState, type PointerEvent } from "react";
import type { CelulaGrade, Estrategia, Grade } from "@/data/types";
import { fmtBRL, fmtMetricaPrincipal, nomeMes, rodou, rotuloMes } from "@/data/format";
import { cn } from "@/lib/utils";

/** Cor da célula: verde-claro → verde-escuro pela raiz do investimento. */
const fundo = (t: number) => `color-mix(in oklab, var(--verde-escuro) ${Math.round(t * 100)}%, var(--verde-claro))`;

/**
 * Investimento por estratégia × mês (só meses com veiculação), em escala raiz.
 * Tablet/desktop: grade. Mobile (< md): lista por estratégia com 4 chips (mês + valor inteiro).
 * Toque ou cursor numa célula mostra a métrica principal e as campanhas.
 */
export function GradeEstrategias({ grade, estrategias }: { grade: Grade; estrategias: Estrategia[] }) {
  const ativas = grade.celulas.filter(rodou);
  const celulas = new Map(ativas.map((c) => [`${c.estrategia}|${c.mes}`, c]));
  const max = Math.max(...ativas.map((c) => c.investimento), 1);
  const principal = new Map(estrategias.map((e) => [e.estrategia, e.principal]));
  const [hi, setHi] = useState<CelulaGrade | null>(null);
  const cols = grade.meses.length;

  // Mouse: hover. Toque: o pointerleave dispara logo após o toque, então só o clique alterna.
  const entra = (c: CelulaGrade | null) => (e: PointerEvent) => e.pointerType === "mouse" && setHi(c);
  const sai = (e: PointerEvent) => e.pointerType === "mouse" && setHi(null);
  const toca = (c: CelulaGrade | null) => () => setHi((atual) => (c && atual !== c ? c : null));

  const leitura = (c: CelulaGrade) => (
    <>
      {c.estrategia} · {nomeMes(c.mes)} ·{" "}
      <span className="text-[var(--verde-escuro)]">
        {fmtBRL(c.investimento)} · {fmtMetricaPrincipal(c, principal.get(c.estrategia) ?? "impressoes")}
      </span>{" "}
      · {c.campanhas.join(", ")}
    </>
  );

  return (
    <div className="w-full">
      {/* ---------- mobile: lista por estratégia ---------- */}
      <ul className="flex flex-col gap-3 md:hidden">
        {grade.linhas.map((l) => {
          const daLinha = hi && hi.estrategia === l ? hi : null;
          return (
            <li key={l} className="rounded-[14px] bg-[var(--surface-3)] p-3">
              <span className="block text-[13.5px] font-semibold text-[var(--verde-escuro)]">{l}</span>
              <div className="mt-2.5 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
                {grade.meses.map((m) => {
                  const c = celulas.get(`${l}|${m}`);
                  const t = c ? Math.sqrt(c.investimento / max) : 0;
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={!c}
                      onClick={toca(c ?? null)}
                      aria-pressed={Boolean(c && hi === c)}
                      aria-label={c ? `${l} · ${nomeMes(m)} · ${fmtBRL(c.investimento)}` : `${l} · ${nomeMes(m)} · sem veiculação`}
                      className={cn(
                        "flex min-w-0 flex-col items-center gap-0.5 rounded-[8px] px-1 py-1.5 text-center transition-[outline] disabled:cursor-default",
                        c && hi === c && "outline outline-2 outline-offset-1 outline-[var(--verde-escuro)]",
                      )}
                      style={{ background: c ? fundo(t) : "rgba(255,255,255,.7)" }}
                    >
                      <span className={cn("text-[9.5px] font-semibold uppercase tracking-[0.14em]", c && t > 0.55 ? "text-white/85" : "text-text-3")}>{rotuloMes(m)}</span>
                      <span className={cn("whitespace-nowrap text-[11px] font-bold tabular", c ? (t > 0.55 ? "text-white" : "text-[var(--verde-escuro)]") : "text-text-3")}>
                        {c ? fmtBRL(c.investimento, { compact: true }) : "—"}
                      </span>
                    </button>
                  );
                })}
              </div>
              {daLinha && <p className="no-print mt-2.5 text-[11px] font-medium leading-relaxed text-text-2">{leitura(daLinha)}</p>}
            </li>
          );
        })}
      </ul>

      {/* ---------- tablet/desktop: grade ---------- */}
      <div className="hidden md:block">
        <div className="grid gap-[4px]" style={{ gridTemplateColumns: `minmax(150px,210px) repeat(${cols}, minmax(0,1fr))` }} onPointerLeave={sai}>
          <span />
          {grade.meses.map((m) => (
            <span key={m} className="pb-1 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-text-3">
              {rotuloMes(m)}
            </span>
          ))}
          {grade.linhas.map((l, r) => (
            <div key={l} className="contents">
              <span className="flex h-full min-w-0 items-center pr-3 text-[13px] font-medium text-text-2">
                <span className="truncate">{l}</span>
              </span>
              {grade.meses.map((m, col) => {
                const c = celulas.get(`${l}|${m}`);
                const t = c ? Math.sqrt(c.investimento / max) : 0;
                return (
                  <motion.button
                    key={m}
                    type="button"
                    disabled={!c}
                    className="relative flex h-12 min-w-0 items-center justify-center overflow-hidden rounded-[8px] disabled:cursor-default"
                    style={{
                      background: c ? fundo(t) : "rgba(0,99,26,.04)",
                      outline: c && hi === c ? "2px solid var(--verde-escuro)" : "none",
                      outlineOffset: 1,
                    }}
                    initial={{ opacity: 0, scale: 0.4 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: r * 0.05 + col * 0.04 }}
                    onPointerEnter={entra(c ?? null)}
                    onClick={toca(c ?? null)}
                    aria-label={c ? `${l} · ${nomeMes(m)} · ${fmtBRL(c.investimento)}` : undefined}
                  >
                    {c && (
                      <span className={`whitespace-nowrap text-[11px] font-bold tabular ${t > 0.55 ? "text-white" : "text-[var(--verde-escuro)]"}`}>
                        {fmtBRL(c.investimento, { compact: true })}
                      </span>
                    )}
                  </motion.button>
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

      {/* Leitura (tela; no PDF não há cursor nem toque). No mobile ela aparece dentro do cartão tocado. */}
      <p className="no-print mt-4 hidden min-h-10 text-[11px] font-semibold uppercase leading-relaxed tracking-[0.16em] text-text-3 md:block">
        {hi ? (
          leitura(hi)
        ) : (
          <>
            <span className="[@media(hover:none)]:hidden">Passe o cursor sobre a grade</span>
            <span className="hidden [@media(hover:none)]:inline">Toque numa célula para ver os detalhes</span>
          </>
        )}
      </p>
      {!hi && <p className="no-print mt-3 text-[11px] text-text-3 md:hidden">Toque num mês para ver a métrica principal e as campanhas.</p>}
    </div>
  );
}
