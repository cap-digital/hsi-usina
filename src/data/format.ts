/** Formatação pt-BR usada nas páginas e gráficos do relatório. */

import type { ChavePrincipal, Metricas } from "./types";

const cache = new Map<string, Intl.NumberFormat>();
const nf = (o: Intl.NumberFormatOptions) => {
  const k = JSON.stringify(o);
  let f = cache.get(k);
  if (!f) cache.set(k, (f = new Intl.NumberFormat("pt-BR", o)));
  return f;
};

export function fmtNum(v: number, decimals = 0): string {
  return nf({ maximumFractionDigits: decimals, minimumFractionDigits: 0 }).format(v);
}

export function fmtCompact(v: number, decimals = 1): string {
  const a = Math.abs(v);
  if (a >= 1e9) return `${fmtNum(v / 1e9, decimals)} bi`;
  if (a >= 1e6) return `${fmtNum(v / 1e6, decimals)} mi`;
  if (a >= 1e3) return `${fmtNum(v / 1e3, a >= 1e5 ? 0 : decimals)} mil`;
  return fmtNum(v, 0);
}

/**
 * Valor em R$, sempre com centavos: "R$ 1,10", "R$ 5.500,00".
 * `compact` abrevia a partir de mil ("R$ 39,8 mil"); abaixo de mil, centavos, salvo `decimals: 0` (eixos).
 */
export function fmtBRL(v: number, opts: { compact?: boolean; decimals?: number } = {}): string {
  if (opts.compact && Math.abs(v) >= 1e3) return `R$ ${fmtCompact(v, opts.decimals ?? 1)}`;
  const casas = opts.compact ? (opts.decimals === 0 ? 0 : 2) : (opts.decimals ?? 2);
  return nf({ style: "currency", currency: "BRL", maximumFractionDigits: casas, minimumFractionDigits: casas }).format(v);
}

/** "R$ 39,8 mil" — milhares com uma casa fixa. */
export function fmtMil(v: number): string {
  return `R$ ${nf({ minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v / 1e3)} mil`;
}

/** `v` em fração (0.42 → "42%"). */
export function fmtPct(v: number, decimals = 1): string {
  return `${nf({ minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(v * 100)}%`;
}

/** Número com casas fixas ("4,0"). */
export function fmtDec(v: number, decimals = 1): string {
  return nf({ minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(v);
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES_LONGOS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** "06 out". Com `anoRef` ("2026"), datas de outro ano levam o ano curto: "02 dez/25". */
export function fmtDia(iso: string, anoRef?: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const ano = anoRef && String(y) !== anoRef ? `/${String(y).slice(2)}` : "";
  return `${String(d).padStart(2, "0")} ${MESES[m - 1]}${ano}`;
}

/** "2026-01" → "janeiro". */
export function nomeMes(mes: string): string {
  return MESES_LONGOS[Number(mes.slice(5, 7)) - 1];
}

/** "2026-01" → "jan". */
export function rotuloMes(mes: string): string {
  return MESES[Number(mes.slice(5, 7)) - 1];
}

/** ["2026-01","2026-02","2026-03"] → "jan a mar"; ["2026-10"] → "out"; ["2026-01","2026-10"] → "jan e out". */
export function fmtMeses(meses: string[]): string {
  if (!meses.length) return "";
  const n = meses.map((m) => Number(m.slice(5, 7)));
  const contiguo = n.every((v, i) => i === 0 || v === n[i - 1] + 1);
  if (meses.length === 1) return rotuloMes(meses[0]);
  if (contiguo) return `${rotuloMes(meses[0])} a ${rotuloMes(meses[meses.length - 1])}`;
  return fmtLista(meses.map(rotuloMes));
}

export function fmtAtualizado(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));
}

/** Nota discreta das campanhas que começaram em 2025. */
export const NOTA_2025 =
  "Curativos Especiais, Faz Bem e Posts de oportunidade (Always On 2025) começaram em 2025; aqui entra só o que foi veiculado de 1º de janeiro de 2026 em diante.";

/* ------------------------------------------------- métrica principal por estratégia */

const PRINCIPAL: Record<ChavePrincipal, { rotulo: string; custo: "CPM" | "Custo por engajamento" | "CPC"; curto: string }> = {
  impressoes: { rotulo: "impressões", custo: "CPM", curto: "CPM" },
  engajamento: { rotulo: "engajamentos", custo: "Custo por engajamento", curto: "custo/engaj." },
  cliquesLink: { rotulo: "cliques no link", custo: "CPC", curto: "CPC" },
};

export interface MetricaPrincipal {
  valor: number;
  rotulo: string;
  custo: number;
  custoRotulo: "CPM" | "Custo por engajamento" | "CPC";
  custoCurto: string;
}

export function metricaPrincipal(m: Metricas, chave: ChavePrincipal): MetricaPrincipal {
  const p = PRINCIPAL[chave];
  const custo = chave === "impressoes" ? m.cpm : chave === "engajamento" ? m.custoEngajamento : m.cpc;
  return { valor: m[chave], rotulo: p.rotulo, custo, custoRotulo: p.custo, custoCurto: p.curto };
}

/** Custo com casas suficientes: custo por engajamento tem 3 casas ("R$ 0,020"). */
export function fmtCusto(v: number, chave: ChavePrincipal): string {
  if (chave === "engajamento" && v < 0.1) return `R$ ${nf({ minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(v)}`;
  return fmtBRL(v, { decimals: 2 });
}

/** "10,9 mi impressões · CPM R$ 1,31" */
export function fmtMetricaPrincipal(m: Metricas, chave: ChavePrincipal): string {
  const p = metricaPrincipal(m, chave);
  return `${fmtCompact(p.valor)} ${p.rotulo} · ${p.custoCurto} ${fmtCusto(p.custo, chave)}`;
}

/* ------------------------------------------------- textos */

const EXTENSO = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez"];

/** 0–10 por extenso; acima disso, o número. */
export function fmtExtenso(n: number, maiuscula = false): string {
  const s = EXTENSO[n] ?? fmtNum(n);
  return maiuscula ? s[0].toUpperCase() + s.slice(1) : s;
}

/** "a, b e c". */
export function fmtLista(itens: string[]): string {
  return itens.length < 2 ? (itens[0] ?? "") : `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}

/** Célula/métrica que de fato rodou. */
export function rodou(c: { investimento: number; impressoes: number }): boolean {
  return c.investimento > 0 || c.impressoes > 0;
}

/** Métrica principal pelo nome da estratégia (criativos e células herdam a da estratégia). */
export const PRINCIPAL_DA_ESTRATEGIA: Record<string, ChavePrincipal> = {
  Alcance: "impressoes",
  "Posts de oportunidade": "impressoes",
  "Curativos Especiais": "impressoes",
  Engajamento: "engajamento",
  "Faz Bem": "engajamento",
  "Tráfego": "cliquesLink",
};
