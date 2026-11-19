# Relatório de Desempenho · Meta 2026 · Hospital Santa Izabel

Relatório de desempenho do **Hospital Santa Izabel na Meta (Facebook + Instagram)**, de **01/01/2026 a 31/10/2026**. Tom de balanço do ano. Agregado: big numbers, comparações e destaques — sem leitura dia a dia nem filtros de data.

Next 16 (App Router). Antes de escrever código, leia o `AGENTS.md` (manda consultar `node_modules/next/dist/docs/`).

---

## Regras absolutas

- **Nenhuma menção à empresa que produziu o relatório**, a agência nenhuma, nem a "gestão": textos, logo, favicon, footer, metadata/OG, título da aba, nome do PDF, alt de imagens. Antes de publicar, grep em `src/`, `public/` e no texto do PDF — tem que dar zero.
- **Só Meta.** Nada de Google, YouTube, palavras-chave, valores contratados, metas, % de meta, escala para contrato ou comparativo com ano anterior.
- **Investimento = `spend` exatamente como vem da API** (o valor do Gerenciador). Sem margem, sem ajuste.
- **Período 01 jan → 31 out 2026.** Veiculação só em jan, fev, mar e out: gráficos mês a mês mostram só esses quatro meses, sem destacar o vazio (no máximo a legenda discreta "Meses com veiculação").
- Três campanhas começaram em 2025 (Curativos Especiais, Faz Bem, Always On 2025 – Oportunidade): mostrar só o gasto de 2026, com a nota discreta `NOTA_2025` (`src/data/format.ts`).

## Dados

```
python3 scripts/pull-meta.py        # Graph API → data/meta-raw/*.json + data/criativos-raw/*.jpg (token em .env.local: META_TOKEN)
python3 scripts/build-snapshot.py   # data/meta-raw/ → src/data/snapshot.json + public/criativos/
```

- `data/` e `.env*` estão no `.gitignore`. Nunca commitar o token.
- `src/data/snapshot.json` é a única fonte da interface (estático, gerado no build). Tipos em `src/data/types.ts`.
- **Alcance**: o total vem de `conta_total.json` (único no período) e nunca é somado. Por estratégia com várias campanhas, o alcance é a soma das campanhas (`alcanceSomado: true`) e a interface diz isso.
- **Engajamento** = action `post_engagement`. **Cliques no link** = `inline_link_clicks`. **CPC** = investimento ÷ cliques no link. **CTR** = cliques ÷ impressões.
- **Composição do engajamento** (campo `actions`, em total, estratégia, campanha, mês, célula da grade e anúncio): curtidas e reações = `post_reaction`, comentários = `comment`, compartilhamentos = `post`, salvamentos = `onsite_conversion.post_save`, cliques no link = `link_click`, visualizações de vídeo (3s) = `video_view`, visualizações de foto = `photo_view`. Somam exatamente o `post_engagement` em todos os níveis (`outros` = 0; só aparece se > 0, e negativo vira aviso no build). Curtidas na página = `like` (seguidores) ficam à parte, fora do total.
- **Custos unitários**: 3 casas quando < R$ 0,10 (`casasCusto`/`fmtCusto`), nunca arredondar para zero.
- **Não destacar quantidade de meses** em lugar nenhum (só a legenda "Meses com veiculação" nos gráficos).
- **Público**: idade × gênero de `publico_idade_genero.json`; idade/gênero desconhecidos ficam fora e os % são sobre o informado.

**Números de referência** (conferidos com o Gerenciador)

| Métrica | Valor |
|---|---|
| Investimento | R$ 39.775,22 |
| Impressões | 22.380.396 |
| Alcance (único) | 5.609.947 · frequência 3,99 |
| Cliques / cliques no link | 66.618 / 38.913 |
| Engajamento com o post | 1.135.080 = 33.413 reações + 304 comentários + 516 compartilhamentos + 300 salvamentos + 38.913 cliques no link + 1.061.215 vídeo (3s) + 419 foto |
| Curtidas na página | 65 (fora do engajamento com o post) |
| Mês a mês | jan R$ 13.525,35 · fev R$ 11.139,94 · mar R$ 7.555,17 · out R$ 7.554,76 |
| Campanhas com veiculação | 13 |

## Estratégias (pelo nome da campanha)

| Estratégia | Grupo | Métrica principal |
|---|---|---|
| Alcance (Always On … Alcance) | Always On | impressões/alcance + CPM |
| Engajamento (Always On … Engajamento) | Always On | engajamentos + custo por engajamento |
| Tráfego (Always On Outubro – Tráfego/Cortes) | Always On | cliques no link + CPC |
| Posts de oportunidade (… Oportunidade …) | Always On | impressões/alcance + CPM |
| Curativos Especiais | Campanha especial | impressões/alcance + CPM |
| Faz Bem | Campanha especial | engajamentos + custo por engajamento |

## Páginas

- **Início** (`/`): hero em bloco verde (capa), big numbers, mês a mês, grade estratégia × mês, portas.
- **Mídia** (`/midia`): estratégias (cartões + rankings), público (seletor Impressões/Alcance/Engajamento/Investimento), criativos (8 na tela + "Ver todos"; "Ver anúncio" → `https://www.facebook.com/{effective_object_story_id}`).
- **Campanhas** (`/campanhas`): Always On por estratégia + Curativos Especiais + Faz Bem, com tabela de campanhas e criativos de cada uma.
- **PDF** (`/api/pdf`): abre `/relatorio` (as três páginas) num Chrome headless; cada seção vira uma página 1440×1018. Arquivo `HSI-Relatorio-Meta-2026.pdf`.

## Identidade visual

- Verde exatamente `#2EB038`, verde-escuro exatamente `#00631A` (sem overlay/grão por cima — o grão foi removido por lavar o verde), menta `#F6FFF2` (fundo), verde-claro `#CFEBBE`, branco nos cards; texto `#0B2A12` / `#00631A`. Tokens em `src/app/globals.css` (os nomes antigos `amber`/`dusk`/`copper` são aliases: verde, verde-escuro, verde médio).
- Work Sans (`next/font`): títulos Black/ExtraBold em caixa alta (`titulo-secao`), corpo Regular, rótulos com letter-spacing largo (`eyebrow`), pílulas verde-escuro (`selo`).
- Motivo das linhas em "casa" (`src/components/core/casa.tsx`), como o contorno do logo.
- Logos em `public/logo-hsi-verde.png` (fundo claro) e `public/logo-hsi-branco.png` (fundo verde). Favicon e apple-icon em `src/app/` a partir do logo.
- Animações herdadas (preloader, cortina de transição, SplitHeading, contadores, Lenis) — manter.
