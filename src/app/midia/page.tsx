import type { Metadata } from "next";
import { ChartFrame } from "@/components/core/chart-frame";
import { KpiTile } from "@/components/core/kpi-tile";
import { Reveal } from "@/components/core/reveal";
import { Section } from "@/components/core/section";
import { PageHero } from "@/components/hero/page-hero";
import { CriativosGrid } from "@/components/paginas/criativos";
import { EntregaPublico } from "@/components/paginas/entrega-publico";
import { HBars } from "@/components/viz/hbars";
import { NOTA_2025, fmtBRL, fmtCompact, fmtCusto, fmtExtenso, fmtMeses, fmtMil, fmtNum, fmtPct, metricaPrincipal } from "@/data/format";
import snapshot from "@/data/snapshot.json";
import type { Criativo, Estrategia, Snapshot } from "@/data/types";

export const metadata: Metadata = { title: "Mídia · Hospital Santa Izabel · Relatório de Desempenho Meta 2026" };

const s = snapshot as Snapshot;

const COR_GRUPO: Record<string, string> = { "Always On": "var(--verde)", "Campanha especial": "var(--verde-escuro)" };

/** Criativos de todas as estratégias, por impressões, sem repetir a mesma peça. */
function criativosUnicos(lista: Criativo[]): Criativo[] {
  const vistos = new Set<string>();
  return [...lista]
    .sort((a, b) => b.impressoes - a.impressoes)
    .filter((c) => (vistos.has(c.chaveImagem) ? false : (vistos.add(c.chaveImagem), true)));
}

export default function Midia() {
  const t = s.totais;
  const porInvestimento = [...s.estrategias].sort((a, b) => b.investimento - a.investimento);
  const porImpressoes = [...s.estrategias].sort((a, b) => b.impressoes - a.impressoes);
  const maior = porInvestimento[0];
  const criativos = criativosUnicos(s.criativos);
  const pub = s.publico;
  const totPub = pub.reduce((a, p) => a + p.impressoes, 0) || 1;
  const mulheres = pub.filter((p) => p.genero === "female").reduce((a, p) => a + p.impressoes, 0) / totPub;

  return (
    <main>
      <PageHero
        eyebrow={`Mídia · ${s.estrategias.length} estratégias · Facebook + Instagram`}
        title={
          <>
            Onde o investimento <em>apareceu.</em>
          </>
        }
        description={`${fmtMil(t.investimento)} em ${fmtNum(t.campanhas)} campanhas e ${s.estrategias.length} estratégias: ${fmtCompact(t.impressoes, 1)} de impressões, ${fmtCompact(t.alcance, 1)} de pessoas alcançadas e ${fmtCompact(t.engajamento, 2)} de engajamentos.`}
        kpis={
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <KpiTile label="Investimento" value={t.investimento} format="compactCurrency" decimals={1} hint="Valor do Gerenciador de Anúncios" />
            <KpiTile label="CPM" value={t.cpm} format="currency" decimals={2} hint="Custo por mil impressões" />
            <KpiTile label="Custo por engajamento" value={t.custoEngajamento} format="currency" decimals={3} hint={`${fmtCompact(t.engajamento, 2)} engajamentos`} />
            <KpiTile label="CPC" value={t.cpc} format="currency" decimals={2} hint={`Por clique no link · ${fmtCompact(t.cliquesLink, 1)} cliques`} />
            <KpiTile label="CTR" value={t.ctr * 100} format="percent" decimals={2} hint="Cliques ÷ impressões" className="col-span-2 md:col-span-1" />
          </div>
        }
      />

      <Section
        index="01"
        eyebrow="Estratégias"
        nota={NOTA_2025}
        title={
          <>
            {fmtExtenso(s.estrategias.length, true)} estratégias, <em>cada uma</em> com a sua métrica.
          </>
        }
        description={`${maior.estrategia} recebeu a maior parte do investimento (${fmtPct(maior.investimento / t.investimento, 0)}). Alcance, Posts de oportunidade e Curativos Especiais são medidos por impressões e CPM; Engajamento e Faz Bem, por engajamentos e custo por engajamento; Tráfego, por cliques no link e CPC.`}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {s.estrategias.map((e, i) => (
            <CartaoEstrategia key={e.estrategia} e={e} i={i} />
          ))}
        </div>
      </Section>

      {/* Rankings em seção própria: no PDF a seção de estratégias cabe numa página sem zoom excessivo. */}
      <Section eyebrow="Estratégias · comparativo">
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartFrame eyebrow="Investimento por estratégia" title="Para onde foi o investimento" minHeight={340}>
            <HBars
              items={porInvestimento.map((x) => ({
                key: x.estrategia,
                label: x.estrategia,
                value: x.investimento,
                display: fmtBRL(x.investimento, { compact: true }),
                sub: `${x.grupo} · ${fmtPct(x.investimento / t.investimento, 1)} do total`,
                color: COR_GRUPO[x.grupo],
              }))}
            />
          </ChartFrame>
          <ChartFrame eyebrow="Impressões por estratégia" title="Quem mais apareceu" minHeight={340}>
            <HBars
              items={porImpressoes.map((x) => ({
                key: x.estrategia,
                label: x.estrategia,
                value: x.impressoes,
                display: fmtCompact(x.impressoes, 1),
                sub: `CPM ${fmtBRL(x.cpm)} · ${fmtCompact(x.engajamento)} engajamentos`,
                color: COR_GRUPO[x.grupo],
              }))}
            />
          </ChartFrame>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[12.5px] text-text-2">
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-[var(--verde)]" /> Always On
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-[var(--verde-escuro)]" /> Campanhas especiais
          </span>
        </div>
      </Section>

      <Section
        index="02"
        eyebrow="Público"
        title={
          <>
            Para <em>quem</em> a mídia foi entregue.
          </>
        }
        description={
          <>
            Entrega por gênero e faixa etária<span className="no-print">; escolha o indicador</span>. As mulheres receberam {fmtPct(mulheres, 0)} das
            impressões com idade e gênero informados.
          </>
        }
      >
        <ChartFrame eyebrow="Gênero × idade" title="Entrega por gênero e idade" minHeight={420}>
          <EntregaPublico linhas={pub} />
        </ChartFrame>
      </Section>

      <Section
        index="03"
        eyebrow="Criativos"
        nota={`Seleção por entrega: as peças com mais impressões entre os ${fmtNum(t.anuncios)} anúncios do período.`}
        title={
          <>
            As peças que <em>mais apareceram.</em>
          </>
        }
        description={
          <>
            Criativos ordenados por impressões. Nos de alcance aparece o CPM; nos de engajamento, o custo por engajamento; nos de tráfego, o CPC.
            <span className="no-print"> Abra o post em “Ver anúncio”.</span>
          </>
        }
      >
        <CriativosGrid criativos={criativos} />
      </Section>
    </main>
  );
}

function CartaoEstrategia({ e, i }: { e: Estrategia; i: number }) {
  const p = metricaPrincipal(e, e.principal);
  return (
    <Reveal className="hub-card flex flex-col gap-5 p-6 md:p-7" y={24} delay={(i % 3) * 0.05}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="eyebrow text-[var(--verde-escuro)]">{e.grupo}</span>
          <h3 className="display titulo-secao mt-2 text-[1.45rem] text-[var(--verde-escuro)]">{e.estrategia}</h3>
        </div>
        <span className="selo shrink-0 !px-3 !text-[10px]">{fmtMeses(e.meses)}</span>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="display block text-[2.3rem] font-black leading-none text-[var(--verde)] tabular">{fmtCompact(p.valor, 1)}</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-3">{p.rotulo}</span>
        </div>
        <div className="text-right">
          <span className="block text-[1.2rem] font-bold text-[var(--verde-escuro)] tabular">{fmtCusto(p.custo, e.principal)}</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-3">{p.custoRotulo}</span>
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-3 border-t border-line pt-4 text-[12px]">
        <div>
          <dt className="text-text-3">Investimento</dt>
          <dd className="font-bold text-text tabular">{fmtBRL(e.investimento, { compact: true })}</dd>
        </div>
        <div>
          <dt className="text-text-3">{e.principal === "impressoes" ? "Alcance" : "Impressões"}</dt>
          <dd className="font-bold text-text tabular">
            {fmtCompact(e.principal === "impressoes" ? e.alcance : e.impressoes, 1)}
            {e.principal === "impressoes" && e.alcanceSomado ? "*" : ""}
          </dd>
        </div>
        <div>
          <dt className="text-text-3">Campanhas</dt>
          <dd className="font-bold text-text tabular">{e.campanhas}</dd>
        </div>
      </dl>
      {e.principal === "impressoes" && e.alcanceSomado && (
        <p className="-mt-2 text-[10.5px] text-text-3">* soma do alcance de cada campanha</p>
      )}    </Reveal>
  );
}
