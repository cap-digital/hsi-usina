"use client";

import { ArrowUpRight, Play } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Criativo } from "@/data/types";
import { PRINCIPAL_DA_ESTRATEGIA, fmtBRL, fmtCompact, fmtCusto, metricaPrincipal } from "@/data/format";
import { BotaoVerTodos } from "./ver-todos";

const INICIAL = 8;

/**
 * Grade de criativos por impressões. Cada card mostra a métrica de custo da estratégia:
 * CPM (alcance), custo por engajamento (engajamento) ou CPC (tráfego). 8 na tela + "Ver todos".
 */
export function CriativosGrid({ criativos, mostrarEstrategia = true }: { criativos: Criativo[]; mostrarEstrategia?: boolean }) {
  const [aberto, setAberto] = useState(false);
  if (!criativos.length) return <p className="text-text-3">Nenhum criativo nesta estratégia.</p>;
  const lista = aberto ? criativos : criativos.slice(0, INICIAL);
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
        {lista.map((c, i) => {
          const chave = PRINCIPAL_DA_ESTRATEGIA[c.estrategia] ?? "impressoes";
          const p = metricaPrincipal(c, chave);
          return (
            <motion.figure
              key={c.id}
              className="hub-card group relative flex flex-col overflow-hidden !rounded-[18px]"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.8, delay: (i % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-surface-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- cópias locais em public/criativos/, tamanhos variados. */}
                <img
                  src={c.imagem}
                  alt={c.titulo ? `Anúncio: ${c.titulo}` : `Anúncio de ${c.estrategia}`}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
                />
                <span className="selo absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate !px-2.5 !py-1 !text-[9.5px] !tracking-[0.16em]">
                  #{i + 1}
                  {mostrarEstrategia ? ` · ${c.estrategia}` : ""}
                </span>
                {c.formato === "video" && (
                  <span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-[var(--verde)] text-white">
                    <Play className="size-3.5 fill-current" />
                  </span>
                )}
                {c.link && (
                  <a
                    href={c.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="no-print absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--verde-escuro)] opacity-100 shadow-sm transition-opacity hover:bg-[var(--verde)] hover:text-white md:opacity-0 md:group-hover:opacity-100"
                  >
                    Ver anúncio <ArrowUpRight className="size-3.5" />
                  </a>
                )}
              </div>
              <figcaption className="flex flex-1 flex-col gap-3 p-3.5 md:p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <span className="display block whitespace-nowrap text-[1.35rem] font-black leading-none text-[var(--verde)] tabular md:text-[1.6rem]">
                      {fmtCompact(c.impressoes)}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-3">impressões</span>
                  </div>
                  <div className="text-right">
                    <span className="block whitespace-nowrap text-[14px] font-bold text-[var(--verde-escuro)] tabular">{fmtCusto(p.custo, chave)}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-3">{p.custoCurto}</span>
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-2.5 text-[11px] text-text-3 tabular">
                  <span className="truncate">{chave === "impressoes" ? `${fmtCompact(c.alcance)} de alcance` : `${fmtCompact(p.valor)} ${p.rotulo}`}</span>
                  <span className="shrink-0">{fmtBRL(c.investimento, { compact: true })}</span>
                </div>
              </figcaption>
            </motion.figure>
          );
        })}
      </div>
      <BotaoVerTodos aberto={aberto} total={criativos.length} inicial={INICIAL} onToggle={() => setAberto((v) => !v)} />
    </div>
  );
}
