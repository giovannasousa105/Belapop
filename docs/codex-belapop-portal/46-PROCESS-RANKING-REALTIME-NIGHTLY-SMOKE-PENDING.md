# Internal Jobs Cron - Nightly Scheduled Smoke Evidence (Pending)

## Status
- Estado atual: `pending`
- Este arquivo e o working record da proxima madrugada.
- O script `npm run docs:close:nightly-smoke` escreve neste caminho por padrao.

## Purpose
- Registrar automaticamente a proxima run real `event=schedule` do workflow `Internal Jobs Cron`
- Fechar a evidencia operacional do job `refresh_risk_recon_t1`
- Evitar sobrescrever a evidencia historica ja fechada

## Command
```bash
npm run docs:close:nightly-smoke
```

## Historical evidence
- Evidencia fechada atual:
  - `42-INTERNAL-JOBS-NIGHTLY-CRON-SMOKE-2026-03-09.md`

## Template source
- Template preservado separadamente em:
  - `44-INTERNAL-JOBS-NIGHTLY-CRON-SMOKE-TEMPLATE.md`
