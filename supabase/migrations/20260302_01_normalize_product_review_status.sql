-- Normalize legacy product status values to canonical "review".
update public.products
set status = 'review'
where status = 'pending_review';
