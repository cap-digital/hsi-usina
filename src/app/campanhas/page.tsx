import type { Metadata } from "next";
import { KpiTile } from "@/components/core/kpi-tile";
import { Reveal } from "@/components/core/reveal";
import { Section } from "@/components/core/section";
import { PageHero } from "@/components/hero/page-hero";
import { ComposicaoEngajamento, InteracoesMini } from "@/components/paginas/composicao-engajamento";
import { CriativosGrid } from "@/components/paginas/criativos";
import { PortasCards } from "@/components/paginas/portas";
import { SplitBar } from "@/components/viz/small";
import { NOTA_2025, casasCusto, fmtBRL, fmtCompact, fmtCusto, fmtDec, fmtLista, fmtMeses, fmtMil, fmtNum, fmtPct, metricaPrincipal } from "@/data/format";
import snapshot from "@/data/snapshot.json";
import type { Campanha, Estrategia, Snapshot } from "@/data/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Campanhas · Hospital Santa Izabel · Relatório de Desempenho Meta 2026" };

const s = snapshot as Snapshot;

/** Tons das estratégias na barra do Always On (verde principal → verde-escuro → verdes claros). */
const COR_ESTRATEGIA: Record<string, string> = {
  Alcance: "var(--verde)",
  Engajamento: "var(--verde-escuro)",
  "Tráfego": "var(--copper)",
  "Posts de oportunidade": "var(--verde-claro)",
};

const TEXTO: Record<string, string> = {
  Alcance: "Levar a marca do hospital ao maior número de pessoas pelo menor custo por mil impressões.",
  Engajamento: "Gerar interação com os conteúdos do hospital: reações, comentários, compartilhamentos e salvamentos.",
  "Tráfego": "Levar o público dos cortes de vídeo para o site do hospital.",
  "Posts de oportunidade": "Impulsionar posts do momento para ampliar a entrega de pautas do dia a dia do hospital.",
  "Curativos Especiais": "Campanha de alcance para o serviço de Curativos Especiais.",
  "Faz Bem": "Campanha de engajamento do Faz Bem.",
};

const campanhasDa = (e: string) => s.campanhas.filter((c) => c.estrategia === e).sort((a, b) => (a.meses[0] ?? "").localeCompare(b.meses[0] ?? ""));
const criativosDa = (e: string) => s.criativos.filter((c) => c.estrategia === e).sort((a, b) => b.impressoes - a.impressoes);

export default function Campanhas() {
  const t = s.totais;
  const ao = s.estrategias.filter((e) => e.grupo === "Always On");
  const esp = s.estrategias.filter((e) => e.grupo === "Campanha especial");
  const invAo = ao.reduce((a, e) => a + e.investimento, 0);
  const campAo = ao.reduce((a, e) => a + e.campanhas, 0);
  let n = 1;
  const idx = () => String(++n).padStart(2, "0");

  return (
    <main>
      <PageHero
        eyebrow={`Campanhas · ${fmtNum(t.campanhas)} campanhas com veiculação`}
        title={
          <>
            Always On e <em>campanhas especiais.</em>
          </>
        }
        description={`O Always On manteve o hospital presente ao longo do ano com ${fmtMil(invAo)} em ${campAo} campanhas. ${fmtLista(
          esp.map((e) => `${e.estrategia} recebeu ${fmtMil(e.investimento)}`),
        )}.`}
        kpis={
          <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:grid-cols-3">
            <KpiTile label="Always On" value={invAo} format="compactCurrency" decimals={1} hint={`${fmtPct(invAo / t.investimento, 0)} do investimento · ${campAo} campanhas`} />
            {esp.map((e, i) => (
              <KpiTile
                key={e.estrategia}
                label={e.estrategia}
                value={e.investimento}
                format="compactCurrency"
                decimals={1}
                tone="dusk"
                hint={`${fmtPct(e.investimento / t.investimento, 0)} do investimento · ${fmtMeses(e.meses)}`}
                className={i === esp.length - 1 && esp.length % 2 === 0 ? "min-[400px]:col-span-2 md:col-span-1" : undefined}
              />
            ))}
          </div>
        }
      />

      <Section
        index="01"
        eyebrow="Always On"
        nota={NOTA_2025}
        title={
          <>
            {ao.length} estratégias, <em>o ano todo.</em>
          </>
        }
        description="A divisão do investimento do Always On entre as estratégias, com o que cada uma entregou na sua métrica principal."
      >
        <Reveal className="hub-card p-7 md:p-9">
          <span className="eyebrow text-[var(--verde-escuro)]">Investimento do Always On por estratégia</span>
          <span className="display mt-4 block text-[clamp(2.2rem,3.6vw,3.25rem)] font-black leading-none text-[var(--verde)] tabular">{fmtBRL(invAo)}</span>
          <div className="mt-8">
            <SplitBar soPct parts={ao.map((e) => ({ label: `${e.estrategia} · ${fmtMil(e.investimento)}`, value: e.investimento, color: COR_ESTRATEGIA[e.estrategia] }))} />
          </div>
        </Reveal>
        <div className="mt-4">
          <PortasCards
            portas={ao.map((e) => {
              const p = metricaPrincipal(e, e.principal);
              return {
                titulo: e.estrategia,
                numero: fmtCompact(p.valor, 1),
                legenda: `${p.rotulo} · ${p.custoRotulo} ${fmtCusto(p.custo)}`,
                nota: `${fmtMil(e.investimento)} · ${e.campanhas} ${e.campanhas === 1 ? "campanha" : "campanhas"} · ${fmtMeses(e.meses)}`,
                texto: TEXTO[e.estrategia] ?? "",
                tom: "amber" as const,
              };
            })}
          />
        </div>
      </Section>

      {ao.map((e) => (
        <SecaoEstrategia key={e.estrategia} e={e} index={idx()} />
      ))}

      {esp.map((e) => (
        <SecaoEstrategia key={e.estrategia} e={e} index={idx()} especial />
      ))}
    </main>
  );
}

function SecaoEstrategia({ e, index, especial = false }: { e: Estrategia; index: string; especial?: boolean }) {
  const p = metricaPrincipal(e, e.principal);
  const campanhas = campanhasDa(e.estrategia);
  const criativos = criativosDa(e.estrategia);
  const unica = campanhas.length === 1 ? campanhas[0] : null;
  const poucos = criativos.length <= 4;
  const alcanceRotulo = e.alcanceSomado ? "Alcance somado" : "Alcance";

  return (
    <>
      <Section
        index={index}
        eyebrow={especial ? `Campanha especial · ${e.estrategia}` : `Always On · ${e.estrategia}`}
        nota={e.comecouAntes ? NOTA_2025 : undefined}
        title={
          <>
            {`${e.estrategia}:`} <em>{fmtCompact(p.valor, 1)} {p.rotulo}.</em>
          </>
        }
        description={`${TEXTO[e.estrategia] ?? ""} ${fmtMil(e.investimento)} ${unica ? "" : `em ${campanhas.length} campanhas `}de ${fmtMeses(e.meses)}, com ${p.custoRotulo.toLowerCase() === "cpm" || p.custoRotulo === "CPC" ? p.custoRotulo : p.custoRotulo.toLowerCase()} de ${fmtCusto(p.custo)}.`}
      >
        <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:grid-cols-4">
          <KpiTile label="Investimento" value={e.investimento} format="compactCurrency" decimals={1} hint={fmtBRL(e.investimento)} />
          <KpiTile label={p.rotulo[0].toUpperCase() + p.rotulo.slice(1)} value={p.valor} format="compact" decimals={p.valor >= 1e6 ? 2 : 1} />
          <KpiTile label={p.custoRotulo} value={p.custo} format="currency" decimals={casasCusto(p.custo)} />
          {e.principal === "impressoes" ? (
            <KpiTile label={alcanceRotulo} value={e.alcance} format="compact" decimals={1} hint={e.alcanceSomado ? "Soma do alcance de cada campanha" : `Frequência ${fmtDec(e.frequencia, 1)}`} />
          ) : (
            <KpiTile label="Impressões" value={e.impressoes} format="compact" decimals={1} hint={`CPM de ${fmtBRL(e.cpm)}`} />
          )}
        </div>

        {e.principal === "engajamento" && (
          <Reveal className="hub-card mt-4 p-5 md:p-6" y={20}>
            <span className="eyebrow text-[var(--verde-escuro)]">Interações com os posts</span>
            <div className="mt-4">
              <ComposicaoEngajamento dados={[{ rotulo: e.estrategia, m: e }]} compacto />
            </div>
          </Reveal>
        )}

        {campanhas.length > 1 && (
          <>
            {/* Celular: cards empilhados (sem rolagem lateral). Tablet/desktop e PDF: tabela. */}
            <CardsCampanhas campanhas={campanhas} e={e} />
            <Reveal className="hub-card mt-4 hidden overflow-x-auto p-3 md:block" y={20}>
              <TabelaCampanhas campanhas={campanhas} e={e} />
            </Reveal>
          </>
        )}

        {poucos && criativos.length > 0 && (
          <div className="mt-[clamp(32px,4vw,56px)]">
            <span className="eyebrow text-[var(--verde-escuro)]">{criativos.length === 1 ? "O criativo" : `Os ${criativos.length} criativos`} com mais entrega</span>
            <div className="mt-5">
              <CriativosGrid criativos={criativos} mostrarEstrategia={false} />
            </div>
          </div>
        )}
      </Section>

      {!poucos && (
        <Section eyebrow={`${e.estrategia} · criativos com mais entrega`}>
          <CriativosGrid criativos={criativos} mostrarEstrategia={false} />
        </Section>
      )}
    </>
  );
}

function CardsCampanhas({ campanhas, e }: { campanhas: Campanha[]; e: Estrategia }) {
  const eng = e.principal === "engajamento";
  return (
    <ul className="mt-4 flex flex-col gap-3 md:hidden">
      {campanhas.map((c) => {
        const m = metricaPrincipal(c, e.principal);
        const quarto = e.principal === "impressoes" ? { rotulo: "Alcance", valor: fmtNum(c.alcance) } : { rotulo: "Impressões", valor: fmtNum(c.impressoes) };
        const itens = [
          { rotulo: "Investimento", valor: fmtBRL(c.investimento) },
          { rotulo: m.rotulo[0].toUpperCase() + m.rotulo.slice(1), valor: fmtNum(m.valor) },
          { rotulo: m.custoRotulo, valor: fmtCusto(m.custo) },
          quarto,
        ];
        return (
          <li key={c.id} className="hub-card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="text-[14px] font-bold leading-snug text-[var(--verde-escuro)]">
                {c.nomeCurto}
                {c.comecouAntes && <span className="ml-1 text-text-3">*</span>}
              </span>
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-text-3">{fmtMeses(c.meses)}</span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-3">
              {itens.map((it) => (
                <div key={it.rotulo} className="min-w-0">
                  <dt className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-text-3">{it.rotulo}</dt>
                  <dd className="mt-0.5 text-[15px] font-bold text-text tabular">{it.valor}</dd>
                </div>
              ))}
            </dl>
            {eng && <InteracoesMini m={c} className="mt-3 border-t border-line pt-3" />}
          </li>
        );
      })}
      {campanhas.some((c) => c.comecouAntes) && <li className="px-1 text-[11px] text-text-3">* Começou em 2025; aqui só o veiculado em 2026.</li>}
    </ul>
  );
}

function TabelaCampanhas({ campanhas, e }: { campanhas: Campanha[]; e: Estrategia }) {
  const p = metricaPrincipal(e, e.principal);
  const eng = e.principal === "engajamento";
  return (
    <table className={cn("w-full border-collapse text-left text-[13.5px]", eng ? "min-w-[900px]" : "min-w-[640px]")}>
      <thead>
        <tr className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-text-3">
          <th className="px-4 py-3 font-semibold">Campanha</th>
          <th className="px-4 py-3 font-semibold">Veiculação</th>
          <th className="px-4 py-3 text-right font-semibold">Investimento</th>
          <th className="px-4 py-3 text-right font-semibold">{p.rotulo}</th>
          <th className="px-4 py-3 text-right font-semibold">{p.custoRotulo}</th>
          {eng && (
            <>
              <th className="px-4 py-3 text-right font-semibold">Reações</th>
              <th className="px-4 py-3 text-right font-semibold">Comentários</th>
              <th className="px-4 py-3 text-right font-semibold">Compart.</th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {campanhas.map((c) => {
          const m = metricaPrincipal(c, e.principal);
          return (
            <tr key={c.id} className="border-t border-line">
              <td className="px-4 py-3 font-semibold text-[var(--verde-escuro)]">
                {c.nomeCurto}
                {c.comecouAntes && <span className="ml-1 text-text-3">*</span>}
              </td>
              <td className="px-4 py-3 text-text-2">{fmtMeses(c.meses)}</td>
              <td className="px-4 py-3 text-right font-semibold tabular">{fmtBRL(c.investimento)}</td>
              <td className="px-4 py-3 text-right tabular">{fmtNum(m.valor)}</td>
              <td className="px-4 py-3 text-right tabular">{fmtCusto(m.custo)}</td>
              {eng && (
                <>
                  <td className="px-4 py-3 text-right tabular">{fmtNum(c.reacoes)}</td>
                  <td className="px-4 py-3 text-right tabular">{fmtNum(c.comentarios)}</td>
                  <td className="px-4 py-3 text-right tabular">{fmtNum(c.compartilhamentos)}</td>
                </>
              )}
            </tr>
          );
        })}
      </tbody>
      {campanhas.some((c) => c.comecouAntes) && (
        <tfoot>
          <tr>
            <td colSpan={eng ? 8 : 5} className="px-4 pb-2 pt-3 text-[11px] text-text-3">
              * Começou em 2025; aqui só o veiculado em 2026.
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}
