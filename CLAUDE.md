@AGENTS.md
@BRIEF.md

## Projeto

Relatório de Desempenho · Meta 2026 do Hospital Santa Izabel (Next 16). Regras e dados no `BRIEF.md`.

- Dados: `python3 scripts/pull-meta.py` → `python3 scripts/build-snapshot.py` → `src/data/snapshot.json`.
- Antes de publicar: `npm run lint`, `npm run build`, gerar o PDF em `/api/pdf` e fazer grep de qualquer menção à empresa produtora/agência em `src/`, `public/` e no texto do PDF (tem que dar zero).
- Token da Meta só em `.env.local` (ignorado pelo git).
