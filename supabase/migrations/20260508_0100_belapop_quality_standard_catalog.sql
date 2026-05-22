-- BelaPop Quality Standard: persisted catalog governance layer.
-- Keeps UI/domain contracts stable while moving seller and SKU standards out of in-memory fixtures.

create table if not exists public.catalog_standard_sellers (
  id text primary key,
  tenant_id uuid,
  catalog_segment text not null default 'default',
  seller_id text not null unique,
  brand_name text not null,
  legal_name text not null,
  cnpj text not null,
  commercial_responsible text not null,
  contact jsonb not null default '{}'::jsonb,
  shipping_origin_address text not null,
  shipping_policy jsonb not null default '{}'::jsonb,
  return_policy jsonb not null default '{}'::jsonb,
  authenticity_policy jsonb not null default '{}'::jsonb,
  brands_sold text[] not null default '{}'::text[],
  categories_served text[] not null default '{}'::text[],
  category text not null,
  main_category text not null,
  region text not null,
  institutional_description text not null,
  logo_url text not null,
  banner_url text not null,
  packaging_policy text not null,
  invoice_issuance_confirmed boolean not null default false,
  product_authenticity_confirmed boolean not null default false,
  responsibility_term_accepted_at timestamptz,
  history jsonb not null default '{}'::jsonb,
  score_breakdown jsonb not null default '{}'::jsonb,
  quality_score integer not null default 0 check (quality_score between 0 and 100),
  status text not null check (status in ('approved', 'review', 'pending', 'blocked')),
  verification_status text not null check (verification_status in ('pending', 'in-review', 'approved', 'rejected', 'suspended', 'verified-belapop')),
  verification_badges text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_standard_products (
  id text primary key,
  tenant_id uuid,
  catalog_segment text not null default 'default',
  product_id text not null unique,
  seller_id text not null,
  internal_sku text not null,
  gtin text,
  name text not null,
  normalized_name text not null,
  brand text not null,
  line text,
  category text not null,
  subcategory text not null,
  product_type text not null,
  volume text not null,
  price numeric(12, 2) not null default 0,
  stock integer not null default 0,
  main_benefit text not null,
  secondary_benefits text[] not null default '{}'::text[],
  claims text[] not null default '{}'::text[],
  usage_instructions text[] not null default '{}'::text[],
  skin_types text[] not null default '{}'::text[],
  needs text[] not null default '{}'::text[],
  texture text not null,
  ingredients text[] not null default '{}'::text[],
  warnings text[] not null default '{}'::text[],
  dispatch_deadline text not null,
  return_policy_id text not null,
  return_policy_summary text not null,
  origin text not null,
  tags text[] not null default '{}'::text[],
  missing_fields text[] not null default '{}'::text[],
  images jsonb not null default '[]'::jsonb,
  packaging jsonb not null default '{}'::jsonb,
  authenticity jsonb not null default '{}'::jsonb,
  authenticity_status text not null check (authenticity_status in ('not-verified', 'in-review', 'verified', 'rejected', 'authentic-belapop')),
  seo jsonb not null default '{}'::jsonb,
  validation_alerts jsonb not null default '[]'::jsonb,
  quality_score integer not null default 0 check (quality_score between 0 and 100),
  quality_level text not null check (quality_level in ('excellent', 'good', 'attention', 'blocked')),
  status text not null check (status in ('approved', 'review', 'pending', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists catalog_standard_sellers_tenant_segment_idx
  on public.catalog_standard_sellers (tenant_id, catalog_segment);
create index if not exists catalog_standard_sellers_status_idx
  on public.catalog_standard_sellers (status, verification_status);
create index if not exists catalog_standard_sellers_badges_gin_idx
  on public.catalog_standard_sellers using gin (verification_badges);

create index if not exists catalog_standard_products_tenant_segment_idx
  on public.catalog_standard_products (tenant_id, catalog_segment);
create index if not exists catalog_standard_products_seller_idx
  on public.catalog_standard_products (seller_id);
create index if not exists catalog_standard_products_status_idx
  on public.catalog_standard_products (status, authenticity_status, quality_level);
create index if not exists catalog_standard_products_category_idx
  on public.catalog_standard_products (category, subcategory);
create index if not exists catalog_standard_products_tags_gin_idx
  on public.catalog_standard_products using gin (tags);
create index if not exists catalog_standard_products_claims_gin_idx
  on public.catalog_standard_products using gin (claims);

create or replace function public.set_catalog_standard_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_catalog_standard_sellers_updated_at on public.catalog_standard_sellers;
create trigger trg_catalog_standard_sellers_updated_at
before update on public.catalog_standard_sellers
for each row execute function public.set_catalog_standard_updated_at();

drop trigger if exists trg_catalog_standard_products_updated_at on public.catalog_standard_products;
create trigger trg_catalog_standard_products_updated_at
before update on public.catalog_standard_products
for each row execute function public.set_catalog_standard_updated_at();

alter table public.catalog_standard_sellers enable row level security;
alter table public.catalog_standard_products enable row level security;

grant select on public.catalog_standard_sellers to anon, authenticated;
grant select on public.catalog_standard_products to anon, authenticated;
grant all on public.catalog_standard_sellers to service_role;
grant all on public.catalog_standard_products to service_role;

drop policy if exists "catalog_standard_sellers_read" on public.catalog_standard_sellers;
create policy "catalog_standard_sellers_read"
on public.catalog_standard_sellers
for select
using (true);

drop policy if exists "catalog_standard_products_read" on public.catalog_standard_products;
create policy "catalog_standard_products_read"
on public.catalog_standard_products
for select
using (true);

drop policy if exists "catalog_standard_sellers_service_write" on public.catalog_standard_sellers;
create policy "catalog_standard_sellers_service_write"
on public.catalog_standard_sellers
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "catalog_standard_products_service_write" on public.catalog_standard_products;
create policy "catalog_standard_products_service_write"
on public.catalog_standard_products
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

insert into public.catalog_standard_sellers (
  id, seller_id, brands_sold, brand_name, categories_served, legal_name, cnpj,
  commercial_responsible, contact, shipping_origin_address, shipping_policy,
  return_policy, authenticity_policy, banner_url, category, history,
  institutional_description, invoice_issuance_confirmed, logo_url, main_category,
  packaging_policy, product_authenticity_confirmed, quality_score, region,
  responsibility_term_accepted_at, score_breakdown, status, verification_badges,
  verification_status
) values
(
  'std-seller-aurora',
  'sel-aurora',
  array['Aurora Maison', 'BelaPop Clinical'],
  'Aurora Maison',
  array['Skincare', 'Dermocosmeticos', 'Pele sensivel'],
  'Aurora Maison Cosmeticos Ltda.',
  '12.345.678/0001-90',
  'Helena Duarte',
  '{"email":"operacao@auroramaison.com.br","name":"Helena Duarte","phone":"+55 11 99999-0101"}',
  'Rua Bela Cintra, 1200 - Sao Paulo, SP',
  '{"averageDeliveryDays":"2 a 5 dias uteis","carrierMethod":"Correios, Loggi Premium ou transportadora parceira","coverageRegions":["Sudeste","Sul","Centro-Oeste"],"freightRules":"Envio com rastreio, embalagem protegida e SLA maximo de 24h.","id":"ship-aurora","originAddress":"Rua Bela Cintra, 1200 - Sao Paulo, SP","preparationCopy":"Pedido conferido, embalado com protecao e preparado em ate 24h.","postingSlaHours":24,"premiumShipping":true,"trackingRequired":true}',
  '{"damagedProductRules":"Avarias seguem triagem com foto e suporte BelaPop.","divergentProductRules":"Produto divergente tem troca ou devolucao assistida.","exchangeRules":"Troca por avaria, divergencia ou arrependimento dentro da janela legal.","fullPolicyHref":"/termos-e-condicoes","id":"return-aurora","packagingCondition":"Preferencialmente com embalagem original e itens recebidos.","remorseRules":"Arrependimento em ate 7 dias conforme politica da plataforma.","returnWindowDays":7,"reverseLogistics":"Etiqueta reversa emitida pelo atendimento BelaPop.","summary":"Devolucao orientada por concierge e conferida por lote.","supportChannel":"concierge@belapop.com"}',
  '{"batchControl":"when-available","complianceHistory":["NF validada","Seller aprovado manualmente","Lote rastreavel para linhas clinicas"],"invoiceRequired":true,"manualApprovalRequired":true,"originDescription":"Distribuicao oficial com nota fiscal vinculada ao pedido.","summary":"Produto original com procedencia auditavel."}',
  '/catalog/premium-product-placeholder.svg',
  'Skincare',
  '{"incidents90d":0,"lastAuditAt":"2026-04-22","notes":["Catalogo revisado","Imagem principal aprovada","SLA consistente"],"returnRatePct":1.4}',
  'Laboratorio boutique de skincare com formulas objetivas e apelo clinico discreto.',
  true,
  '/catalog/premium-product-placeholder.svg',
  'Dermocosmeticos',
  'Produto protegido contra vazamento e quebra, caixa limpa, NF inclusa e identificacao correta do pedido.',
  true,
  96,
  'Sao Paulo, SP',
  '2026-04-01T12:00:00Z',
  '{"catalogQuality":96,"complaints":96,"reliability":98,"responseTime":94,"returnRate":95,"reviews":96,"shipment":97,"visualStandardization":95}',
  'approved',
  array['seller-verified', 'premium-shipping', 'invoice-guaranteed', 'belapop-curation'],
  'verified-belapop'
),
(
  'std-seller-velvet',
  'sel-velvet',
  array['Velvet Lab'],
  'Velvet Lab',
  array['Maquiagem', 'Presentes', 'Atelier'],
  'Velvet Lab Beauty Ltda.',
  '23.456.789/0001-12',
  'Marina Rocha',
  '{"email":"seller@velvetlab.com.br","name":"Marina Rocha","phone":"+55 21 99999-0202"}',
  'Rua Dias Ferreira, 90 - Rio de Janeiro, RJ',
  '{"averageDeliveryDays":"3 a 6 dias uteis","carrierMethod":"Correios ou transportadora parceira","coverageRegions":["Sudeste","Sul","Nordeste"],"freightRules":"Postagem em ate 36h com rastreio obrigatorio.","id":"ship-velvet","originAddress":"Rua Dias Ferreira, 90 - Rio de Janeiro, RJ","preparationCopy":"Pedido separado com conferencia de lacre e embalagem de protecao.","postingSlaHours":36,"premiumShipping":true,"trackingRequired":true}',
  '{"damagedProductRules":"Avarias ou embalagem violada devem ser reportadas com foto.","divergentProductRules":"Divergencia de item segue troca assistida.","exchangeRules":"Troca condicionada a lacre preservado, avaria ou erro de separacao.","fullPolicyHref":"/termos-e-condicoes","id":"return-velvet","packagingCondition":"Lacre preservado quando aplicavel.","remorseRules":"Arrependimento em ate 7 dias para itens elegiveis.","returnWindowDays":7,"reverseLogistics":"Logistica reversa aprovada apos triagem.","summary":"Politica clara para maquiagem e itens de higiene.","supportChannel":"seller@velvetlab.com.br"}',
  '{"batchControl":"when-available","complianceHistory":["NF obrigatoria","Claims em revisao editorial"],"invoiceRequired":true,"manualApprovalRequired":true,"originDescription":"Venda direta de marca parceira aprovada.","summary":"Procedencia declarada e auditada em amostra."}',
  '/catalog/premium-product-placeholder.svg',
  'Makeup',
  '{"incidents90d":1,"lastAuditAt":"2026-04-18","notes":["Ajustar claims de duracao","Padrao visual aprovado"],"returnRatePct":2.2}',
  'Marca editorial de maquiagem com foco em acabamento sofisticado e uso real.',
  true,
  '/catalog/premium-product-placeholder.svg',
  'Maquiagem',
  'Itens lacrados quando aplicavel, protecao contra impacto e apresentacao limpa.',
  true,
  89,
  'Rio de Janeiro, RJ',
  '2026-04-08T15:20:00Z',
  '{"catalogQuality":88,"complaints":90,"reliability":90,"responseTime":86,"returnRate":88,"reviews":91,"shipment":89,"visualStandardization":94}',
  'review',
  array['seller-verified', 'invoice-guaranteed', 'belapop-curation'],
  'in-review'
),
(
  'std-seller-lumi',
  'sel-lumi',
  array['Lumiere Rituals'],
  'Lumiere Rituals',
  array['Perfumaria', 'Corpo e banho'],
  'Lumiere Fragrancias e Rituais Ltda.',
  '34.567.890/0001-23',
  'Clara Monteiro',
  '{"email":"qualidade@lumiererituals.com.br","name":"Clara Monteiro","phone":"+55 31 99999-0303"}',
  'Avenida do Contorno, 2200 - Belo Horizonte, MG',
  '{"averageDeliveryDays":"5 a 9 dias uteis","carrierMethod":"Correios","coverageRegions":["Sudeste"],"freightRules":"Postagem declarada em 48h, com ocorrencias recentes de atraso.","id":"ship-lumi","originAddress":"Avenida do Contorno, 2200 - Belo Horizonte, MG","preparationCopy":"Pedido preparado em ate 48h, sujeito a revisao operacional.","postingSlaHours":48,"premiumShipping":false,"trackingRequired":true}',
  '{"damagedProductRules":"Vazamento ou quebra exige foto da embalagem e frasco.","divergentProductRules":"Produto divergente volta para revisao de separacao.","exchangeRules":"Troca por avaria, vazamento ou divergencia.","fullPolicyHref":"/termos-e-condicoes","id":"return-lumi","packagingCondition":"Embalagem e frasco devem ser preservados para triagem.","remorseRules":"Arrependimento em ate 7 dias quando elegivel.","returnWindowDays":7,"reverseLogistics":"Solicitacao manual pelo concierge.","summary":"Politica publicada, mas precisa detalhar perfume e embalagem.","supportChannel":"qualidade@lumiererituals.com.br"}',
  '{"batchControl":"required","complianceHistory":["NF obrigatoria","IFRA pendente para linha Noir"],"invoiceRequired":true,"manualApprovalRequired":true,"originDescription":"Producao nacional com lote obrigatorio por fragrancia.","summary":"Aprovacao condicionada a documentacao tecnica."}',
  '/catalog/premium-product-placeholder.svg',
  'Perfumaria',
  '{"incidents90d":3,"lastAuditAt":"2026-04-15","notes":["Documentacao tecnica pendente","SLA precisa recuperar estabilidade"],"returnRatePct":4.8}',
  'Casa de fragrancias com proposta sensorial e assinatura olfativa autoral.',
  true,
  '/catalog/premium-product-placeholder.svg',
  'Perfumaria',
  'Frascos com protecao extra obrigatoria; politica em revisao para reduzir risco de vazamento.',
  false,
  75,
  'Belo Horizonte, MG',
  '2026-04-10T09:00:00Z',
  '{"catalogQuality":74,"complaints":72,"reliability":76,"responseTime":78,"returnRate":70,"reviews":79,"shipment":68,"visualStandardization":82}',
  'pending',
  array['belapop-curation'],
  'pending'
)
on conflict (id) do update set
  seller_id = excluded.seller_id,
  brands_sold = excluded.brands_sold,
  brand_name = excluded.brand_name,
  categories_served = excluded.categories_served,
  legal_name = excluded.legal_name,
  cnpj = excluded.cnpj,
  commercial_responsible = excluded.commercial_responsible,
  contact = excluded.contact,
  shipping_origin_address = excluded.shipping_origin_address,
  shipping_policy = excluded.shipping_policy,
  return_policy = excluded.return_policy,
  authenticity_policy = excluded.authenticity_policy,
  banner_url = excluded.banner_url,
  category = excluded.category,
  history = excluded.history,
  institutional_description = excluded.institutional_description,
  invoice_issuance_confirmed = excluded.invoice_issuance_confirmed,
  logo_url = excluded.logo_url,
  main_category = excluded.main_category,
  packaging_policy = excluded.packaging_policy,
  product_authenticity_confirmed = excluded.product_authenticity_confirmed,
  quality_score = excluded.quality_score,
  region = excluded.region,
  responsibility_term_accepted_at = excluded.responsibility_term_accepted_at,
  score_breakdown = excluded.score_breakdown,
  status = excluded.status,
  verification_badges = excluded.verification_badges,
  verification_status = excluded.verification_status;

with base_images as (
  select
    '[{"background":"clean","hasPromotionalText":false,"hasWatermark":false,"height":1600,"isCentered":true,"kind":"main","lighting":"good","ratio":"4/5","url":"/catalog/premium-product-placeholder.svg","width":1280},{"background":"clean","hasPromotionalText":false,"hasWatermark":false,"height":1500,"isCentered":true,"kind":"secondary","lighting":"good","ratio":"1/1","url":"/catalog/premium-product-placeholder.svg","width":1500},{"background":"clean","hasPromotionalText":false,"hasWatermark":false,"height":1400,"isCentered":true,"kind":"texture","lighting":"good","ratio":"1/1","url":"/catalog/premium-product-placeholder.svg","width":1400}]'::jsonb as images,
    '{"cleanPackage":true,"cleanPresentation":true,"damagedBoxBlocked":true,"extraGlassProtection":true,"invoiceIncluded":true,"orderIdentification":true,"leakProtection":true,"premiumIdentity":true,"protectedProduct":true,"sampleWhenPossible":true,"sealedWhenApplicable":true,"thankYouCardOptional":true,"tissuePaperRecommended":true,"unboxingScore":92}'::jsonb as default_packaging,
    '{"cleanPackage":true,"cleanPresentation":true,"damagedBoxBlocked":true,"invoiceIncluded":true,"orderIdentification":true,"leakProtection":false,"premiumIdentity":false,"protectedProduct":true,"sealedWhenApplicable":false,"thankYouCardOptional":false,"unboxingScore":68}'::jsonb as review_packaging
)
insert into public.catalog_standard_products (
  id, product_id, seller_id, internal_sku, gtin, name, normalized_name, brand, line,
  category, subcategory, product_type, volume, price, stock, main_benefit,
  secondary_benefits, claims, usage_instructions, skin_types, needs, texture,
  ingredients, warnings, dispatch_deadline, return_policy_id, return_policy_summary,
  origin, tags, missing_fields, images, packaging, authenticity, authenticity_status,
  seo, validation_alerts, quality_score, quality_level, status
)
select * from (
  values
  (
    'std-prd-001', 'prd-001', 'sel-aurora', 'prd-001', '7890000000001',
    'Aurora Maison Clinical Serum Niacinamida 30ml',
    'Aurora Maison Clinical Serum Niacinamida 30ml',
    'Aurora Maison', 'Clinical', 'Skincare', 'Tratamento', 'Serum', '30ml',
    289.00, 96, 'Luminosidade controlada',
    array['Conforto', 'Aplicacao simples'],
    array['Hidratacao', 'Glow', 'Uniformizacao'],
    array['Use com a pele limpa e seca.', 'Aplique em camada fina, seguindo a frequencia indicada.', 'Finalize a rotina conforme necessidade da pele.'],
    array['normal', 'mista', 'sensivel'],
    array['Rotina consistente', 'Luminosidade controlada'],
    'Leve e confortavel',
    array['Niacinamida', 'Base sensorial controlada'],
    array[]::text[],
    '24h a 36h', 'return-aurora', 'Trocas e devolucoes com politica clara e acompanhamento BelaPop.',
    'Distribuicao oficial',
    array['clinical', 'luxury', 'curated-icon'],
    array[]::text[],
    (select images from base_images),
    (select default_packaging from base_images),
    '{"approvedSeller":true,"batchControl":"confirmed","expiryDate":"2027-12-31","invoiceAvailable":true,"invoiceRequired":true,"lot":"LOT-PRD-001","origin":"Origem validada com NF","proofAvailable":true,"responsibleValidator":"Curadoria BelaPop","standardStatus":"authentic-belapop","status":"verified"}'::jsonb,
    'authentic-belapop',
    '{"description":"Aurora Maison Serum com curadoria BelaPop e informacoes de origem, uso e envio.","slug":"aurora-maison-clinical-serum-niacinamida-30ml","title":"Aurora Maison Clinical Serum Niacinamida 30ml"}'::jsonb,
    '[]'::jsonb,
    93, 'excellent', 'approved'
  ),
  (
    'std-prd-010', 'prd-010', 'sel-aurora', 'prd-010', '7890000000010',
    'Aurora Maison Barrier Creme Ceramidas 50g',
    'Aurora Maison Barrier Creme Ceramidas 50g',
    'Aurora Maison', 'Barrier', 'Skincare', 'Tratamento', 'Creme', '50g',
    219.00, 96, 'Barreira cutanea',
    array['Conforto', 'Aplicacao simples'],
    array['Fortalecimento da barreira', 'Conforto', 'Baixa irritabilidade'],
    array['Use com a pele limpa e seca.', 'Aplique em camada fina, seguindo a frequencia indicada.', 'Finalize a rotina conforme necessidade da pele.'],
    array['normal', 'mista', 'sensivel'],
    array['Rotina consistente', 'Barreira cutanea'],
    'Leve e confortavel',
    array['Ceramidas', 'Base sensorial controlada'],
    array[]::text[],
    '24h a 36h', 'return-aurora', 'Trocas e devolucoes com politica clara e acompanhamento BelaPop.',
    'Distribuicao oficial',
    array['sensitive-skin', 'clinical', 'routine'],
    array[]::text[],
    (select images from base_images),
    (select default_packaging from base_images),
    '{"approvedSeller":true,"batchControl":"confirmed","expiryDate":"2027-12-31","invoiceAvailable":true,"invoiceRequired":true,"lot":"LOT-PRD-010","origin":"Origem validada com NF","proofAvailable":true,"responsibleValidator":"Curadoria BelaPop","standardStatus":"authentic-belapop","status":"verified"}'::jsonb,
    'authentic-belapop',
    '{"description":"Aurora Maison Creme com curadoria BelaPop e informacoes de origem, uso e envio.","slug":"aurora-maison-barrier-creme-ceramidas-50g","title":"Aurora Maison Barrier Creme Ceramidas 50g"}'::jsonb,
    '[]'::jsonb,
    93, 'excellent', 'approved'
  ),
  (
    'std-prd-004', 'prd-004', 'sel-velvet', 'prd-004', null,
    'Velvet Lab Atelier Paleta Soft Focus 12g',
    'Velvet Lab Atelier Paleta Soft Focus 12g',
    'Velvet Lab', 'Atelier', 'Makeup', 'Makeup', 'Paleta', '12g',
    329.00, 24, 'Acabamento uniforme',
    array['Conforto', 'Aplicacao simples'],
    array['Glow', 'Textura mais macia'],
    array['Use com a pele limpa e seca.', 'Aplique em camada fina, seguindo a frequencia indicada.', 'Finalize a rotina conforme necessidade da pele.'],
    array['todos'],
    array['Rotina consistente', 'Acabamento uniforme'],
    'Sensorial',
    array['Soft focus', 'Base sensorial controlada'],
    array['Anexar evidencia de duracao antes de destacar em campanha.'],
    '24h a 36h', 'return-velvet', 'Trocas e devolucoes com politica clara e acompanhamento BelaPop.',
    'Distribuicao oficial',
    array['luxury', 'gift', 'discovery'],
    array[]::text[],
    (select images from base_images),
    (select default_packaging from base_images),
    '{"approvedSeller":true,"batchControl":"confirmed","expiryDate":"2027-12-31","invoiceAvailable":true,"invoiceRequired":true,"lot":"LOT-PRD-004","origin":"Origem validada com NF","proofAvailable":false,"responsibleValidator":"Qualidade BelaPop","standardStatus":"in-review","status":"pending"}'::jsonb,
    'in-review',
    '{"description":"Velvet Lab Paleta com curadoria BelaPop e informacoes de origem, uso e envio.","slug":"velvet-lab-atelier-paleta-soft-focus-12g","title":"Velvet Lab Atelier Paleta Soft Focus 12g"}'::jsonb,
    '[{"code":"claim-evidence-needed","detail":"Anexar evidencia de duracao antes de destacar em campanha.","field":"claims","label":"Evidencia pendente","severity":"warning"}]'::jsonb,
    85, 'good', 'review'
  ),
  (
    'std-prd-005', 'prd-005', 'sel-lumi', 'prd-005', null,
    'LUMIERE NOIR PERFUME RESULTADO IMEDIATO GARANTIDO 100ML',
    'Lumiere Rituals Noir Eau de Parfum Musk ambarado 100ml',
    'Lumiere Rituals', 'Noir', 'Perfumaria', 'Perfumaria', 'Eau de Parfum', '100ml',
    520.00, 24, 'Assinatura olfativa',
    array['Conforto', 'Aplicacao simples'],
    array['Resultado imediato garantido'],
    array['Use com a pele limpa e seca.', 'Aplique em camada fina, seguindo a frequencia indicada.', 'Finalize a rotina conforme necessidade da pele.'],
    array['todos'],
    array['Rotina consistente', 'Assinatura olfativa'],
    'Sensorial',
    array['Musk ambarado', 'Base sensorial controlada'],
    array['Claim bloqueado detectado: Resultado imediato garantido'],
    '48h em revisao', 'return-lumi', 'Troca por avaria, vazamento ou divergencia.',
    'Brasil, lote em validacao',
    array['luxury', 'discovery'],
    array['guia de ativos', 'lote', 'seo'],
    '[{"background":"colored","hasPromotionalText":true,"hasWatermark":false,"height":900,"isCentered":false,"kind":"main","lighting":"poor","ratio":"16/9","url":"/catalog/premium-product-placeholder.svg","width":1200},{"background":"clean","hasPromotionalText":false,"hasWatermark":false,"height":1500,"isCentered":true,"kind":"secondary","lighting":"good","ratio":"1/1","url":"/catalog/premium-product-placeholder.svg","width":1500},{"background":"clean","hasPromotionalText":false,"hasWatermark":false,"height":1400,"isCentered":true,"kind":"texture","lighting":"good","ratio":"1/1","url":"/catalog/premium-product-placeholder.svg","width":1400}]'::jsonb,
    (select review_packaging from base_images),
    '{"approvedSeller":true,"batchControl":"pending","invoiceAvailable":false,"invoiceRequired":true,"origin":"Origem nacional com lote pendente","proofAvailable":false,"responsibleValidator":"Qualidade BelaPop","standardStatus":"in-review","status":"pending"}'::jsonb,
    'in-review',
    '{"description":"Lumiere Rituals Eau de Parfum com curadoria BelaPop e informacoes de origem, uso e envio.","slug":"lumiere-noir-perfume-resultado-imediato-garantido-100ml","title":"Lumiere Rituals Noir Eau de Parfum Musk ambarado 100ml"}'::jsonb,
    '[{"code":"blocked-claim","detail":"Claim proibido detectado: Resultado imediato garantido.","field":"claims","label":"Claim bloqueado","severity":"critical"},{"code":"image-promotional-text","detail":"Imagem principal nao pode conter texto promocional.","field":"images","label":"Texto promocional na imagem","severity":"warning"}]'::jsonb,
    58, 'attention', 'pending'
  ),
  (
    'std-p1', 'p1', 's1', 'p1', '7890000000000',
    'BelaPop Radiance Serum Peptideos 30ml',
    'BelaPop Radiance Serum Peptideos 30ml',
    'BelaPop', 'Radiance', 'Skincare', 'Tratamento', 'Serum', '30ml',
    289.00, 96, 'Luminosidade suave',
    array['Conforto', 'Aplicacao simples'],
    array['Hidratacao', 'Glow'],
    array['Use com a pele limpa e seca.', 'Aplique em camada fina, seguindo a frequencia indicada.', 'Finalize a rotina conforme necessidade da pele.'],
    array['normal', 'mista', 'sensivel'],
    array['Rotina consistente', 'Luminosidade suave'],
    'Leve e confortavel',
    array['Peptideos', 'Base sensorial controlada'],
    array[]::text[],
    '24h a 36h', 'return-aurora', 'Trocas e devolucoes com politica clara e acompanhamento BelaPop.',
    'Distribuicao oficial',
    array['curated-icon', 'clinical', 'luxury'],
    array[]::text[],
    (select images from base_images),
    (select default_packaging from base_images),
    '{"approvedSeller":true,"batchControl":"confirmed","expiryDate":"2027-12-31","invoiceAvailable":true,"invoiceRequired":true,"lot":"LOT-P1","origin":"Origem validada com NF","proofAvailable":true,"responsibleValidator":"Curadoria BelaPop","standardStatus":"authentic-belapop","status":"verified"}'::jsonb,
    'authentic-belapop',
    '{"description":"BelaPop Serum com curadoria BelaPop e informacoes de origem, uso e envio.","slug":"belapop-radiance-serum-peptideos-30ml","title":"BelaPop Radiance Serum Peptideos 30ml"}'::jsonb,
    '[]'::jsonb,
    93, 'excellent', 'approved'
  ),
  (
    'std-p11', 'p11', 's1', 'p11', '7890000000011',
    'BelaPop Aurora Patch Olhos Cafeina 30 pares',
    'BelaPop Aurora Patch Olhos Cafeina 30 pares',
    'BelaPop', 'Aurora', 'Skincare', 'Tratamento', 'Patch', '30 pares',
    198.00, 96, 'Olhar descansado',
    array['Conforto', 'Aplicacao simples'],
    array['Hidratacao', 'Conforto'],
    array['Use com a pele limpa e seca.', 'Aplique em camada fina, seguindo a frequencia indicada.', 'Finalize a rotina conforme necessidade da pele.'],
    array['normal', 'mista', 'sensivel'],
    array['Rotina consistente', 'Olhar descansado'],
    'Leve e confortavel',
    array['Cafeina', 'Base sensorial controlada'],
    array[]::text[],
    '24h a 36h', 'return-aurora', 'Trocas e devolucoes com politica clara e acompanhamento BelaPop.',
    'Distribuicao oficial',
    array['sensitive-skin', 'routine', 'discovery'],
    array[]::text[],
    (select images from base_images),
    (select default_packaging from base_images),
    '{"approvedSeller":true,"batchControl":"confirmed","expiryDate":"2027-12-31","invoiceAvailable":true,"invoiceRequired":true,"lot":"LOT-P11","origin":"Origem validada com NF","proofAvailable":true,"responsibleValidator":"Curadoria BelaPop","standardStatus":"authentic-belapop","status":"verified"}'::jsonb,
    'authentic-belapop',
    '{"description":"BelaPop Patch com curadoria BelaPop e informacoes de origem, uso e envio.","slug":"belapop-aurora-patch-olhos-cafeina-30-pares","title":"BelaPop Aurora Patch Olhos Cafeina 30 pares"}'::jsonb,
    '[]'::jsonb,
    93, 'excellent', 'approved'
  )
) as product_rows (
  id, product_id, seller_id, internal_sku, gtin, name, normalized_name, brand, line,
  category, subcategory, product_type, volume, price, stock, main_benefit,
  secondary_benefits, claims, usage_instructions, skin_types, needs, texture,
  ingredients, warnings, dispatch_deadline, return_policy_id, return_policy_summary,
  origin, tags, missing_fields, images, packaging, authenticity, authenticity_status,
  seo, validation_alerts, quality_score, quality_level, status
)
on conflict (id) do update set
  product_id = excluded.product_id,
  seller_id = excluded.seller_id,
  internal_sku = excluded.internal_sku,
  gtin = excluded.gtin,
  name = excluded.name,
  normalized_name = excluded.normalized_name,
  brand = excluded.brand,
  line = excluded.line,
  category = excluded.category,
  subcategory = excluded.subcategory,
  product_type = excluded.product_type,
  volume = excluded.volume,
  price = excluded.price,
  stock = excluded.stock,
  main_benefit = excluded.main_benefit,
  secondary_benefits = excluded.secondary_benefits,
  claims = excluded.claims,
  usage_instructions = excluded.usage_instructions,
  skin_types = excluded.skin_types,
  needs = excluded.needs,
  texture = excluded.texture,
  ingredients = excluded.ingredients,
  warnings = excluded.warnings,
  dispatch_deadline = excluded.dispatch_deadline,
  return_policy_id = excluded.return_policy_id,
  return_policy_summary = excluded.return_policy_summary,
  origin = excluded.origin,
  tags = excluded.tags,
  missing_fields = excluded.missing_fields,
  images = excluded.images,
  packaging = excluded.packaging,
  authenticity = excluded.authenticity,
  authenticity_status = excluded.authenticity_status,
  seo = excluded.seo,
  validation_alerts = excluded.validation_alerts,
  quality_score = excluded.quality_score,
  quality_level = excluded.quality_level,
  status = excluded.status;
