"use client";

import { FileDown, LoaderCircle } from "lucide-react";
import { useState } from "react";

/** Botão do Início: baixa o relatório completo em PDF, gerado no servidor. */
export function BotaoExportarPdf() {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState(false);

  async function baixar() {
    setGerando(true);
    setErro(false);
    try {
      const res = await fetch("/api/pdf");
      if (!res.ok) throw new Error(String(res.status));
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "HSI-Relatorio-Meta-2026.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setErro(true);
    } finally {
      setGerando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={baixar}
      disabled={gerando}
      className="no-print inline-flex items-center gap-2.5 rounded-full bg-[var(--verde-escuro)] px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_14px_40px_-18px_rgba(0,99,26,.7)] transition-colors hover:bg-white hover:text-[var(--verde-escuro)] disabled:cursor-wait disabled:opacity-70"
    >
      {gerando ? <LoaderCircle className="size-4 animate-spin" /> : <FileDown className="size-4" />}
      {gerando ? "Gerando PDF… (até 1 min)" : erro ? "Falhou — tentar de novo" : "Exportar PDF"}
    </button>
  );
}
