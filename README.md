# Relatório de Desempenho · Meta 2026 · Hospital Santa Izabel

Relatório web (Next.js) do desempenho do Hospital Santa Izabel no Facebook e no Instagram, de 1º de janeiro a 31 de outubro de 2026, com exportação em PDF.

```bash
npm install
python3 scripts/pull-meta.py       # requer META_TOKEN em .env.local
python3 scripts/build-snapshot.py
npm run dev                        # http://localhost:3000
```

- Páginas: `/` (Início), `/midia`, `/campanhas`; PDF em `/api/pdf` (`HSI-Relatorio-Meta-2026.pdf`).
- Detalhes de dados, regras e identidade visual: [BRIEF.md](BRIEF.md).
