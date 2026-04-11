# P0 Incident Record Templates

Date: 2026-03-15
Scope: templates preenchiveis para registrar incidentes P0 de checkout, frete, chargeback e reconciliacao.

Use junto com:
- [56-P0-RUNBOOKS-CHECKOUT-FRETE-CHARGEBACK-RECONCILIACAO.md](c:/Users/Gleiser/Desktop/BELAPOPSITE/docs/codex-belapop-portal/56-P0-RUNBOOKS-CHECKOUT-FRETE-CHARGEBACK-RECONCILIACAO.md)
- [57-P0-INCIDENT-EXECUTION-CHECKLISTS.md](c:/Users/Gleiser/Desktop/BELAPOPSITE/docs/codex-belapop-portal/57-P0-INCIDENT-EXECUTION-CHECKLISTS.md)

## Convencao de arquivo
- `YY-P0-CHECKOUT-INCIDENT-YYYY-MM-DD.md`
- `YY-P0-FRETE-INCIDENT-YYYY-MM-DD.md`
- `YY-P0-CHARGEBACK-INCIDENT-YYYY-MM-DD.md`
- `YY-P0-RECONCILIACAO-INCIDENT-YYYY-MM-DD.md`

---

## 1. Template — Checkout

```md
# P0 Checkout Incident

Date:
Environment: production | staging
Severity: P0
Owner:
Status: planned | in_progress | blocked | done

## Summary
- Trigger:
- User impact:
- Revenue impact:
- Detection source:

## Scope
- Affected route: `/api/stripe/payment-intent`
- Affected surfaces:
  - `/checkout`
  - cart to checkout handoff
  - payment session creation

## Diagnostic checklist
- [ ] logs reviewed
- [ ] `npm run smoke:checkout:hardening` executed
- [ ] Melhor Envio credentials checked
- [ ] seller origin checked
- [ ] `payment_method_types` checked
- [ ] rate limit / antifraud / idempotency checked

## Key evidence
- Primary error code:
- Sample order/cart:
- Sample seller:
- Smoke result:
- PaymentIntent result:

## Containment
- User-facing message:
- Temporary mitigation:
- Scope reduced? yes/no

## Root cause
- Technical cause:
- Why it reached production:

## Permanent fix
- Files changed:
- Config changed:
- Operational action:

## Closure criteria
- [ ] smoke green
- [ ] checkout created pending order/session again
- [ ] error rate stable for 30m

## Timeline
- Start:
- First mitigation:
- Permanent fix:
- Closed:
```

---

## 2. Template — Frete

```md
# P0 Frete Incident

Date:
Environment: production | staging
Severity: P0
Owner:
Status: planned | in_progress | blocked | done

## Summary
- Trigger:
- User impact:
- Seller impact:
- Detection source:

## Scope
- Affected route: `/api/shipping/quote`
- Affected sellers:
- Test CEPs:

## Diagnostic checklist
- [ ] logs reviewed
- [ ] Melhor Envio credential checked
- [ ] seller origin checked
- [ ] product dimensions checked
- [ ] provider vs quote-preparation isolated

## Key evidence
- Error code:
- Sample seller:
- Sample SKU:
- Failing quote:
- Successful quote after fix:

## Containment
- User-facing message:
- Temporary mitigation:
- Scope reduced? yes/no

## Root cause
- Technical cause:
- Why it reached production:

## Permanent fix
- Files changed:
- Config changed:
- Operational action:

## Closure criteria
- [ ] 3 real sellers quoted successfully
- [ ] checkout reaches PaymentIntent again
- [ ] no shipping 503 spike for 30m

## Timeline
- Start:
- First mitigation:
- Permanent fix:
- Closed:
```

---

## 3. Template — Chargeback

```md
# P0 Chargeback Incident

Date:
Environment: production | staging
Severity: P0
Owner:
Status: planned | in_progress | blocked | done

## Summary
- Trigger:
- User impact:
- Seller impact:
- Finance impact:
- Detection source:

## Scope
- `payment_intent_id`:
- `order_id`:
- `seller_id`:
- dispute / chargeback provider reference:

## Diagnostic checklist
- [ ] webhook reviewed
- [ ] `chargeback` journal found
- [ ] `chargeback_fee` journal found
- [ ] `commission_reversal` journal found
- [ ] admin drill-down confirmed

## Key evidence
- Journal IDs:
- Ledger entries:
- Ledger transactions:
- Admin drill-down result:
- Smoke result:

## Containment
- Temporary mitigation:
- Manual reprocess needed? yes/no
- Scope reduced? yes/no

## Root cause
- Technical cause:
- Why it reached production:

## Permanent fix
- Files changed:
- Config changed:
- Operational action:

## Closure criteria
- [ ] admin shows `chargeback`, `chargeback_fee`, `commission_reversal`
- [ ] staging smoke green
- [ ] ledger balanced

## Timeline
- Start:
- First mitigation:
- Permanent fix:
- Closed:
```

---

## 4. Template — Reconciliacao

```md
# P0 Reconciliacao Incident

Date:
Environment: production | staging
Severity: P0
Owner:
Status: planned | in_progress | blocked | done

## Summary
- Trigger:
- User impact:
- Finance impact:
- Detection source:

## Scope
- Provider:
- Base date:
- Report status:

## Diagnostic checklist
- [ ] `run_reconciliation` executed
- [ ] report reviewed
- [ ] issues reviewed
- [ ] ledger delta measured
- [ ] payout delta measured
- [ ] source classified

## Key evidence
- `cash_delta_cents`:
- `ledger_net_delta_cents`:
- `payout_delta_cents`:
- Open issues:
- Healthy report after fix:

## Containment
- Export/manual closeout frozen? yes/no
- Provider issue opened? yes/no
- Scope reduced? yes/no

## Root cause
- Technical cause:
- Why it reached production:

## Permanent fix
- Files changed:
- SQL / migration changed:
- Operational action:

## Closure criteria
- [ ] report back to `ok`
- [ ] issues resolved or justified
- [ ] admin reflects healthy state

## Timeline
- Start:
- First mitigation:
- Permanent fix:
- Closed:
```
