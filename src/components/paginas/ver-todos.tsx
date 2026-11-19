"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Rodapé "Ver todos (N)" / "Mostrar menos" das listas expansíveis. */
export function BotaoVerTodos({ aberto, total, inicial, onToggle }: { aberto: boolean; total: number; inicial: number; onToggle: () => void }) {
  if (total <= inicial) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      className="no-print mt-6 inline-flex items-center gap-2 rounded-full border-[1.5px] border-[var(--verde)] bg-white px-5 py-2 text-[13px] font-semibold text-[var(--verde-escuro)] transition-colors hover:bg-[var(--verde)] hover:text-white"
    >
      {aberto ? "Mostrar menos" : `Ver todos (${total})`}
      <ChevronDown className={cn("size-4 transition-transform duration-300", aberto && "rotate-180")} />
    </button>
  );
}

/** Área com rolagem própria quando a lista está expandida (não alonga a página). */
export function RolagemLista({ ativo, children, altura = 640 }: { ativo: boolean; children: ReactNode; altura?: number }) {
  return (
    <div className={cn(ativo && "overflow-y-auto overscroll-contain pr-2")} style={ativo ? { maxHeight: altura } : undefined} data-lenis-prevent>
      {children}
    </div>
  );
}
