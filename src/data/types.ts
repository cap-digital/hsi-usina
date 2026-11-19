/** Tipos de src/data/snapshot.json (gerado por scripts/build-snapshot.py a partir de data/meta-raw/). */

/** Métricas da Meta. `investimento` = spend do Gerenciador; `ctr`/`ctrLink` em fração; `cpc` = por clique no link. */
export interface Metricas {
  investimento: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  cliquesLink: number;
  engajamento: number;
  cpm: number;
  ctr: number;
  ctrLink: number;
  cpc: number;
  custoEngajamento: number;
  frequencia: number;
  /* Composição do engajamento com o post (actions): somam exatamente `engajamento`. */
  /** post_reaction: curtidas e reações. */
  reacoes: number;
  /** comment */
  comentarios: number;
  /** post (compartilhamentos) */
  compartilhamentos: number;
  /** onsite_conversion.post_save */
  salvamentos: number;
  /** link_click (a ação; igual a cliquesLink no total) */
  linkClick: number;
  /** video_view (3 segundos) */
  videoViews: number;
  /** photo_view */
  fotoViews: number;
  /** post_engagement − soma dos itens acima (0 quando a composição fecha). */
  outros: number;
  /** like: curtidas na página (seguidores). NÃO compõe o engajamento com o post. */
  curtidasPagina: number;
}

export interface Periodo {
  inicio: string;
  fim: string;
}

/** `alcance` aqui é o alcance único do período (conta_total.json). */
export interface Totais extends Metricas {
  campanhas: number;
  anuncios: number;
  /** Meses com veiculação. */
  meses: number;
}

export interface Mes extends Metricas {
  /** "2026-01" */
  mes: string;
  /** "jan" */
  rotulo: string;
  /** "janeiro" */
  nome: string;
  /** Estratégias que rodaram no mês, na ordem fixa. */
  estrategias: string[];
}

export type ChavePrincipal = "impressoes" | "engajamento" | "cliquesLink";

export interface Estrategia extends Metricas {
  estrategia: string;
  grupo: "Always On" | "Campanha especial";
  principal: ChavePrincipal;
  campanhas: number;
  /** Mais de uma campanha: o alcance é a soma do alcance de cada uma (não é único). */
  alcanceSomado: boolean;
  meses: string[];
  /** Alguma campanha da estratégia começou antes de 2026. */
  comecouAntes: boolean;
}

export interface Campanha extends Metricas {
  id: string;
  nome: string;
  nomeCurto: string;
  estrategia: string;
  grupo: string;
  objetivo: string;
  inicioConfig: string;
  fimConfig: string;
  /** Meses com veiculação no período ("2026-01"…). */
  meses: string[];
  comecouAntes: boolean;
}

export interface CelulaGrade extends Metricas {
  estrategia: string;
  mes: string;
  campanhas: string[];
}

export interface Grade {
  meses: string[];
  linhas: string[];
  celulas: CelulaGrade[];
}

export interface PublicoLinha {
  idade: string;
  genero: "female" | "male";
  investimento: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  cliquesLink: number;
  engajamento: number;
}

export interface Criativo extends Metricas {
  id: string;
  nome: string;
  titulo: string;
  estrategia: string;
  campanha: string;
  formato: "video" | "imagem";
  /** https://www.facebook.com/{effective_object_story_id}; vazio quando não há. */
  link: string;
  /** Cópia local em public/criativos/. */
  imagem: string;
  /** Hash curto da imagem (para não repetir a mesma peça entre estratégias). */
  chaveImagem: string;
}

export interface Snapshot {
  cliente: string;
  titulo: string;
  periodo: Periodo;
  atualizadoEm: string;
  totais: Totais;
  meses: Mes[];
  estrategias: Estrategia[];
  grade: Grade;
  campanhas: Campanha[];
  publico: PublicoLinha[];
  publicoNota: { impressoesNaoInformadas: number; pctNaoInformado: number };
  criativos: Criativo[];
  /** Notas do build; só aparecem em dev, no rodapé. */
  avisos: string[];
}
