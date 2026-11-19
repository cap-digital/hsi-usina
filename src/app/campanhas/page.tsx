import type { Metadata } from "next";
import { KpiTile } from "@/components/core/kpi-tile";
import { Reveal } from "@/components/core/reveal";
import { Section } from "@/components/core/section";
import { PageHero } from "@/components/hero/page-hero";
import { CriativosGrid } from "@/components/paginas/criativos";
import { PortasCards } from "@/components/paginas/portas";
import { SplitBar } from "@/components/viz/small";
import { NOTA_2025, fmtBRL, fmtCompact, fmtCusto, fmtDec, fmtLista, fmtMeses, fmtMil, fmtNum, fmtPct, metricaPrincipal } from "@/data/format";
import snapshot from "@/data/snapshot.json";
import type { Campanha, Estrategia, Snapshot } from "@/data/types";

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
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
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
                className={i === esp.length - 1 && esp.length % 2 === 0 ? "col-span-2 md:col-span-1" : undefined}
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
                legenda: `${p.rotulo} · ${p.custoRotulo} ${fmtCusto(p.custo, e.principal)}`,
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
        description={`${TEXTO[e.estrategia] ?? ""} ${fmtMil(e.investimento)} ${unica ? "" : `em ${campanhas.length} campanhas `}de ${fmtMeses(e.meses)}, com ${p.custoRotulo.toLowerCase() === "cpm" || p.custoRotulo === "CPC" ? p.custoRotulo : p.custoRotulo.toLowerCase()} de ${fmtCusto(p.custo, e.principal)}.`}
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiTile label="Investimento" value={e.investimento} format="compactCurrency" decimals={1} hint={fmtBRL(e.investimento)} />
          <KpiTile label={p.rotulo[0].toUpperCase() + p.rotulo.slice(1)} value={p.valor} format="compact" decimals={p.valor >= 1e6 ? 2 : 1} />
          <KpiTile label={p.custoRotulo} value={p.custo} format="currency" decimals={e.principal === "engajamento" && p.custo < 0.1 ? 3 : 2} />
          {e.principal === "impressoes" ? (
            <KpiTile label={alcanceRotulo} value={e.alcance} format="compact" decimals={1} hint={e.alcanceSomado ? "Soma do alcance de cada campanha" : `Frequência ${fmtDec(e.frequencia, 1)}`} />
          ) : (
            <KpiTile label="Impressões" value={e.impressoes} format="compact" decimals={1} hint={`CPM de ${fmtBRL(e.cpm)}`} />
          )}
        </div>

        {campanhas.length > 1 && (
          <Reveal className="hub-card mt-4 overflow-x-auto p-2 md:p-3" y={20}>
            <TabelaCampanhas campanhas={campanhas} e={e} />
          </Reveal>
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

function TabelaCampanhas({ campanhas, e }: { campanhas: Campanha[]; e: Estrategia }) {
  const p = metricaPrincipal(e, e.principal);
  return (
    <table className="w-full min-w-[640px] border-collapse text-left text-[13.5px]">
      <thead>
        <tr className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-text-3">
          <th className="px-4 py-3 font-semibold">Campanha</th>
          <th className="px-4 py-3 font-semibold">Veiculação</th>
          <th className="px-4 py-3 text-right font-semibold">Investimento</th>
          <th className="px-4 py-3 text-right font-semibold">{p.rotulo}</th>
          <th className="px-4 py-3 text-right font-semibold">{p.custoRotulo}</th>
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
              <td className="px-4 py-3 text-right tabular">{fmtCusto(m.custo, e.principal)}</td>
            </tr>
          );
        })}
      </tbody>
      {campanhas.some((c) => c.comecouAntes) && (
        <tfoot>
          <tr>
            <td colSpan={5} className="px-4 pb-2 pt-3 text-[11px] text-text-3">
              * Começou em 2025; aqui só o veiculado em 2026.
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}
