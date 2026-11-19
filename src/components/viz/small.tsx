"use client";

import { motion } from "motion/react";
import { fmtNum, fmtPct } from "@/data/format";

/* ---------------------------------------------------------------- Split bar */

/** Barra 100% empilhada com legenda. `soPct` esconde os valores absolutos. */
export function SplitBar({ parts, soPct = false }: { parts: { label: string; value: number; color: string }[]; soPct?: boolean }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <div>
      <div className="flex h-5 gap-[3px] overflow-hidden rounded-full bg-surface-3">
        {parts.map((p, i) => (
          <motion.div
            key={p.label}
            style={{ background: p.color }}
            initial={{ width: 0 }}
            whileInView={{ width: `${(p.value / total) * 100}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
        {parts.map((p) => (
          <div key={p.label} className="flex items-baseline gap-2">
            <span className="size-2.5 rounded-full" style={{ background: p.color }} />
            <span className="text-[13.5px] text-text-2">{p.label}</span>
            <span className="text-[12.5px] font-bold text-[var(--verde-escuro)] tabular">
              {fmtPct(p.value / total)}{soPct ? "" : ` · ${fmtNum(p.value)}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
