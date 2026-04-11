-- Initial backfill for scoring engine.
-- Safe to re-run.

select public.refresh_product_metrics_30d();
select public.refresh_seller_scores();
select public.refresh_product_scores();
select public.refresh_product_ranking_snapshot('search', null);

