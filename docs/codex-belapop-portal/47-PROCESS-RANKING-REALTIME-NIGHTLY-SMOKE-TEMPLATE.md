# Process Ranking Realtime - Nightly Scheduled Smoke Evidence Template

## Status
- Estado atual: `pending`
- Este arquivo e o template base.
- Ele nao deve ser sobrescrito pelo processo operacional diario.

## Usage
- Working file padrao:
  - `46-PROCESS-RANKING-REALTIME-NIGHTLY-SMOKE-PENDING.md`
- Fechamento automatico:
```bash
npm run docs:close:ranking-nightly-smoke
```

## Placeholder structure
- Run ID: `TBD`
- Run URL: `TBD`
- Created at UTC: `TBD`
- Updated at UTC: `TBD`
- Equivalent in `America/Sao_Paulo`: `TBD`
- Final status: `TBD`
- Final conclusion: `TBD`

## Checklist
- Confirmar `event=schedule`
- Confirmar `process_ranking_realtime` com `success`
- Confirmar ausencia de erro de autorizacao interna
- Confirmar horario e URL da run
- Registrar jobs observados

## Notes
- Evidencias historicas fechadas devem usar nome com data.
- Este template existe para preservar a estrutura entre madrugadas.
