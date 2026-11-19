"use client";

import { scaleBand, scaleLinear } from "d3-scale";
import { curveMonotoneX, line } from "d3-shape";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import useMeasure from "react-use-measure";
import type { Mes } from "@/data/types";
import { fmtBRL, fmtCompact, fmtNum } from "@/data/format";
import { TipRow, TipTitle, VizTooltip } from "./tooltip";

const M_LARGO = { top: 28, right: 64, bottom: 36, left: 64 };
/** Estreito (< 520px): sem eixo esquerdo (cada barra já tem o valor em cima) e eixo direito enxuto. */
const M_ESTREITO = { top: 26, right: 34, bottom: 34, left: 8 };
const EASE = [0.22, 1, 0.36, 1] as const;

/** Investimento (barras, verde) e impressões (linha, verde-escuro, eixo à direita) nos meses com veiculação. */
export function MonthlyChart({ meses, height = 360 }: { meses: Mes[]; height?: number }) {
  const [ref, bounds] = useMeasure();
  const [hi, setHi] = useState<number | null>(null);
  const width = bounds.width || 0;
  const estreito = width > 0 && width < 520;
  const M = estreito ? M_ESTREITO : M_LARGO;
  const iw = Math.max(0, width - M.left - M.right);
  const ih = height - M.top - M.bottom;

  const { x, ys, yi, path } = useMemo(() => {
    const x = scaleBand<string>().domain(meses.map((d) => d.mes)).range([0, iw]).padding(0.42);
    const ys = scaleLinear().domain([0, Math.max(...meses.map((d) => d.investimento), 1)]).range([ih, 0]).nice();
    const yi = scaleLinear().domain([0, Math.max(...meses.map((d) => d.impressoes), 1)]).range([ih, 0]).nice();
    const path =
      line<Mes>()
        .x((d) => (x(d.mes) ?? 0) + x.bandwidth() / 2)
        .y((d) => yi(d.impressoes))
        .curve(curveMonotoneX)(meses) ?? "";
    return { x, ys, yi, path };
  }, [meses, iw, ih]);

  const hd = hi === null ? null : meses[hi];

  return (
    <div className="w-full">
      <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] text-text-2">
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-[3px] bg-[var(--verde)]" />
          Investimento <span className="sm:hidden">(R$, valor sobre a barra)</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="h-[2.5px] w-4 rounded-full bg-[var(--verde-escuro)]" />
          Impressões (eixo direito)
        </span>
        <span className="ml-auto text-[10.5px] font-semibold uppercase tracking-[0.2em] text-text-3">Meses com veiculação</span>
      </div>

      <div ref={ref} className="relative w-full" style={{ height }}>
        {width > 0 && (
          <svg width={width} height={height} className="block overflow-visible" onPointerLeave={(e) => e.pointerType === "mouse" && setHi(null)}>
            <g transform={`translate(${M.left},${M.top})`}>
              {ys.ticks(4).map((t) => (
                <g key={t} transform={`translate(0,${ys(t)})`}>
                  <line x2={iw} stroke="var(--chart-grid)" />
                  {!estreito && (
                    <text x={-12} dy="0.32em" textAnchor="end" className="fill-[var(--text-3)] text-[10.5px] tabular">
                      {fmtBRL(t, { compact: true, decimals: 0 })}
                    </text>
                  )}
                </g>
              ))}
              {yi.ticks(4).map((t) => (
                <text key={t} x={iw + (estreito ? 6 : 12)} y={yi(t)} dy="0.32em" className="fill-[var(--verde-escuro)] text-[10px] tabular md:text-[10.5px]">
                  {fmtCompact(t, 0)}
                </text>
              ))}
              {meses.map((d, i) => {
                const bx = x(d.mes) ?? 0;
                const bw = x.bandwidth();
                const y = ys(d.investimento);
                const dim = hi !== null && hi !== i;
                return (
                  <g
                    key={d.mes}
                    onPointerEnter={(e) => e.pointerType === "mouse" && setHi(i)}
                    onClick={() => setHi((h) => (h === i ? null : i))}
                    opacity={dim ? 0.45 : 1}
                    style={{ transition: "opacity .3s", cursor: "pointer" }}
                  >
                    <rect x={bx - (x.step() * x.paddingInner()) / 2} width={x.step()} y={0} height={ih} fill="transparent" />
                    <motion.rect
                      x={bx}
                      width={bw}
                      rx={Math.min(10, bw / 4)}
                      fill="var(--verde)"
                      initial={{ y: ih, height: 0 }}
                      whileInView={{ y, height: ih - y }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: i * 0.08, ease: EASE }}
                    />
                    <motion.text
                      x={bx + bw / 2}
                      y={y - 10}
                      textAnchor="middle"
                      className={estreito ? "fill-[var(--verde-escuro)] text-[10px] font-bold tabular" : "fill-[var(--verde-escuro)] text-[12px] font-bold tabular"}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.6 + i * 0.08 }}
                    >
                      {estreito ? fmtCompact(d.investimento, 1) : fmtBRL(d.investimento, { compact: true })}
                    </motion.text>
                    <text x={bx + bw / 2} y={ih + 24} textAnchor="middle" className="fill-[var(--text-2)] text-[11px] font-semibold uppercase tracking-[0.14em] md:text-[12px] md:tracking-[0.18em]">
                      {d.rotulo}
                    </text>
                  </g>
                );
              })}
              <motion.path
                d={path}
                fill="none"
                stroke="var(--verde-escuro)"
                strokeWidth={2.5}
                strokeLinecap="round"
                pointerEvents="none"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.6, delay: 0.6 }}
              />
              {meses.map((d) => (
                <circle
                  key={d.mes}
                  cx={(x(d.mes) ?? 0) + x.bandwidth() / 2}
                  cy={yi(d.impressoes)}
                  r={hd?.mes === d.mes ? 6 : 4}
                  fill="var(--verde-escuro)"
                  stroke="#fff"
                  strokeWidth={2}
                  pointerEvents="none"
                />
              ))}
            </g>
          </svg>
        )}
        <VizTooltip open={Boolean(hd)} x={hd ? M.left + (x(hd.mes) ?? 0) + x.bandwidth() / 2 : 0} y={hd ? M.top + ys(hd.investimento) : 0} width={width}>
          {hd && (
            <>
              <TipTitle>{hd.nome[0].toUpperCase() + hd.nome.slice(1)}</TipTitle>
              <TipRow label="Investimento" value={fmtBRL(hd.investimento)} color="var(--verde)" />
              <TipRow label="Impressões" value={fmtNum(hd.impressoes)} color="var(--verde-escuro)" />
              <TipRow label="Alcance no mês" value={fmtNum(hd.alcance)} />
              <TipRow label="Engajamentos" value={fmtNum(hd.engajamento)} />
              <TipRow label="CPM" value={fmtBRL(hd.cpm)} />
            </>
          )}
        </VizTooltip>
      </div>
    </div>
  );
}
