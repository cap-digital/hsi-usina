import { ChartFrame } from "@/components/core/chart-frame";
import { KpiTile } from "@/components/core/kpi-tile";
import { Reveal } from "@/components/core/reveal";
import { Section } from "@/components/core/section";
import { PageHero } from "@/components/hero/page-hero";
import { BotaoExportarPdf } from "@/components/paginas/exportar-pdf";
import { PortasCards } from "@/components/paginas/portas";
import { GradeEstrategias } from "@/components/viz/grade-estrategias";
import { MonthlyChart } from "@/components/viz/monthly-chart";
import { SplitBar } from "@/components/viz/small";
import { fmtBRL, fmtCompact, fmtDec, fmtExtenso, fmtLista, fmtMil, fmtNum, fmtPct } from "@/data/format";
import snapshot from "@/data/snapshot.json";
import type { Snapshot } from "@/data/types";

const s = snapshot as Snapshot;

export default function Home() {
  const t = s.totais;
  const meses = s.meses;
  const nomes = meses.map((m) => m.nome);
  const primeiroTri = meses.filter((m) => m.mes < "2026-04");
  const invTri = primeiroTri.reduce((a, m) => a + m.investimento, 0);
  const out = meses.find((m) => m.mes === "2026-10");
  const maiorMes = [...meses].sort((a, b) => b.investimento - a.investimento)[0];
  const alwaysOn = s.estrategias.filter((e) => e.grupo === "Always On").reduce((a, e) => a + e.investimento, 0);
  const especiais = t.investimento - alwaysOn;

  return (
    <main>
      <PageHero
        variante="verde"
        eyebrow={`${s.cliente} · Facebook + Instagram`}
        title={<>Relatório de desempenho</>}
        selo="Meta · 2026"
        description={
          <>
            O balanço do ano na Meta: {fmtMil(t.investimento)} investidos de 1º de janeiro a 31 de outubro colocaram o hospital{" "}
            {fmtCompact(t.impressoes, 1)} de vezes na tela de {fmtCompact(t.alcance, 1)} de pessoas e geraram {fmtCompact(t.engajamento, 2)} de
            engajamentos com os posts.
          </>
        }
        kpis={
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <KpiTile label="Investimento" value={t.investimento} format="compactCurrency" decimals={1} hint={fmtBRL(t.investimento)} />
            <KpiTile label="Impressões" value={t.impressoes} format="compact" decimals={1} hint={`CPM de ${fmtBRL(t.cpm)}`} />
            <KpiTile label="Alcance" value={t.alcance} format="compact" decimals={2} hint={`Pessoas únicas · frequência ${fmtDec(t.frequencia, 1)}`} />
            <KpiTile label="Engajamento" value={t.engajamento} format="compact" decimals={2} hint="Interações com os posts" />
            <KpiTile label="Cliques" value={t.cliques} format="compact" decimals={1} hint={`CTR de ${fmtPct(t.ctr, 2)}`} />
            <KpiTile label="Cliques no link" value={t.cliquesLink} format="compact" decimals={1} hint={`CPC de ${fmtBRL(t.cpc)}`} />
          </div>
        }
      >
        <BotaoExportarPdf />
      </PageHero>

      <Section
        index="01"
        eyebrow="Big numbers"
        title={
          <>
            {fmtCompact(t.impressoes, 1)} de impressões, <em>{fmtCompact(t.alcance, 1)} de pessoas.</em>
          </>
        }
        description={`Cada pessoa alcançada viu os anúncios do hospital, em média, ${fmtDec(t.frequencia, 1)} vezes. Mil impressões custaram ${fmtBRL(t.cpm)} e cada engajamento, ${fmtBRL(t.custoEngajamento, { decimals: 3 })}.`}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Fato valor={fmtBRL(t.cpm)} rotulo="CPM: o custo de mil impressões" />
          <Fato valor={fmtDec(t.frequencia, 1)} rotulo="frequência média: vezes que cada pessoa viu os anúncios" />
          <Fato valor={fmtNum(t.campanhas)} rotulo={`campanhas com veiculação e ${fmtNum(t.anuncios)} anúncios`} />
          <Fato valor={fmtExtenso(t.meses)} rotulo={`meses com veiculação: ${fmtLista(nomes)}`} />
        </div>
        <Reveal className="hub-card mt-4 p-7 md:p-9">
          <span className="eyebrow text-[var(--verde-escuro)]">Investimento por tipo de campanha</span>
          <span className="display mt-4 block text-[clamp(2.2rem,3.6vw,3.25rem)] font-black leading-none text-[var(--verde)] tabular">{fmtBRL(t.investimento)}</span>
          <div className="mt-8">
            <SplitBar
              soPct
              parts={[
                { label: `Always On · ${fmtMil(alwaysOn)}`, value: alwaysOn, color: "var(--verde)" },
                { label: `Campanhas especiais (Curativos Especiais e Faz Bem) · ${fmtMil(especiais)}`, value: especiais, color: "var(--verde-escuro)" },
              ]}
            />
          </div>
        </Reveal>
      </Section>

      <Section
        index="02"
        eyebrow="Mês a mês"
        title={
          <>
            {maiorMes.nome[0].toUpperCase() + maiorMes.nome.slice(1)} abriu o ano <em>com o maior investimento.</em>
          </>
        }
        description={`${fmtPct(invTri / t.investimento, 0)} do investimento ficou no primeiro trimestre, com ${maiorMes.nome} à frente (${fmtMil(maiorMes.investimento)}). ${
          out ? `Em outubro foram ${fmtMil(out.investimento)} e ${fmtCompact(out.impressoes, 1)} de impressões, com a estreia da estratégia de tráfego.` : ""
        }`}
      >
        <ChartFrame eyebrow="Investimento e impressões por mês" title="Os meses com veiculação" subtitle="Barras: investimento. Linha: impressões." span={3} minHeight={420}>
          <MonthlyChart meses={meses} />
        </ChartFrame>
      </Section>

      <Section
        index="03"
        eyebrow="Estratégia × mês"
        title={
          <>
            O que rodou <em>em cada mês.</em>
          </>
        }
        description={`Cada linha é uma estratégia e cada coluna um mês com veiculação; quanto mais escura a célula, maior o investimento. ${fmtLista(
          meses.map((m) => `${m.rotulo}: ${m.estrategias.length}`),
        )} estratégias no ar.`}
      >
        <ChartFrame
          eyebrow="Investimento por estratégia e mês"
          title="A grade do ano"
          subtitle={<span className="no-print">Passe o cursor numa célula para ver a métrica principal e as campanhas.</span>}
          span={3}
          minHeight={380}
        >
          <GradeEstrategias grade={s.grade} estrategias={s.estrategias} />
        </ChartFrame>
      </Section>

      <Section index="04" eyebrow="Explore" title={<>Duas leituras do <em>mesmo ano.</em></>}>
        <PortasCards
          portas={[
            {
              href: "/midia",
              titulo: "Mídia",
              numero: fmtCompact(t.impressoes, 1),
              legenda: "impressões no Facebook e no Instagram",
              texto: "Estratégias e o que cada uma entregou, o público por idade e gênero e os criativos que mais apareceram.",
              tom: "amber",
            },
            {
              href: "/campanhas",
              titulo: "Campanhas",
              numero: `${fmtNum(t.campanhas)} campanhas`,
              legenda: "Always On + Curativos Especiais + Faz Bem",
              texto: "O Always On por estratégia e as duas campanhas especiais: investimento, entrega, custos e criativos de cada uma.",
              tom: "dusk",
            },
          ]}
        />
      </Section>
    </main>
  );
}

function Fato({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <Reveal className="hub-card flex flex-col justify-between gap-6 p-6 md:p-7" y={24}>
      <span className="display text-[clamp(2.4rem,3.8vw,3.5rem)] font-black leading-none text-[var(--verde)] tabular first-letter:uppercase">{valor}</span>
      <span className="text-[14px] leading-snug text-text-2">{rotulo}</span>
    </Reveal>
  );
}
