# Admin Finance + Curadoria Production Smoke

- Date: `2026-03-11 23:01:02 -03:00`
- Environment: `production`
- Base URL: `https://belapopoficial.com.br`
- Command:
  - `npm run smoke:admin:prod`

## Objective

Validate the restricted admin surfaces tied to the new finance drill-down and discovery curation schema:

- `/admin/dashboard`
- `/admin/finance`
- `/admin/curadoria`
- `/api/admin/finance`
- `/api/admin/finance?entryType=commission_reversal`
- `/api/admin/finance?entryType=chargeback_fee`
- `/api/admin/curadoria`

## Execution model

- Temporary authenticated admin user created in Supabase Auth
- `profiles`, `user_roles`, and `user_role_memberships` seeded for the smoke
- Session synchronized through `/api/auth/sync-session`
- Cleanup executed at the end of the run

## Result

Status: `success`

## Evidence

```json
{
  "baseUrl": "https://belapopoficial.com.br",
  "admin": {
    "dashboardOk": true,
    "financePageOk": true,
    "curationPageOk": true
  },
  "finance": {
    "summaryKeys": [
      "receivable_cents",
      "payout",
      "risk",
      "reconciliation",
      "ops_alerts",
      "ledger",
      "drilldown"
    ],
    "activeEntryTypeFilter": null,
    "dedicatedFilters": [
      {
        "entry_type": "commission_reversal",
        "count": 0
      },
      {
        "entry_type": "chargeback_fee",
        "count": 0
      }
    ],
    "recentLedgerEntries": 8,
    "recentTransactions": 3,
    "reconciliationReports": 3,
    "reconciliationIssues": 0
  },
  "commissionReversalFilter": {
    "activeEntryTypeFilter": "commission_reversal",
    "filteredLedgerEntries": 0
  },
  "chargebackFeeFilter": {
    "activeEntryTypeFilter": "chargeback_fee",
    "filteredLedgerEntries": 0
  },
  "curation": {
    "kinds": 6,
    "collections": 5,
    "availableProducts": 8
  }
}
```

## Interpretation

- Admin restricted pages rendered correctly with an authenticated admin session.
- `/api/admin/finance` exposed the expected operational summary keys.
- The dedicated finance filters are wired and selectable:
  - `commission_reversal`
  - `chargeback_fee`
- The current production dataset has `0` rows for both filters, which is acceptable for this smoke because the objective here was route integrity and filter activation, not financial event volume.
- `/api/admin/curadoria` is reading the new discovery schema with:
  - `6` kinds
  - `5` collections
  - `8` available products

## Follow-up

- If needed, run a synthetic financial event in staging again to validate non-zero rows through the production-like admin filter path.
