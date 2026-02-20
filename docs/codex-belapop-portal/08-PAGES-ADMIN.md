# Admin Pages

## `/admin` (oculto)
- Entrada interna sem link em UI pública
- Redireciona para visão operacional principal

## `/admin/curadoria`
- Fila de aprovação e revisão de itens

## `/admin/parceiros`
- Aprovação de parceiros e alteração de role

## `/admin/produtos`
- Gestão de produtos e status editoriais

## `/admin/pedidos`
- Fluxo de pedidos e incidentes

## `/admin/diario`
- Conteúdo editorial e publicação

## `/admin/config`
- Configurações institucionais e operacionais

## Segurança
- Guard server-side obrigatório para `role=admin`
- Sem exposição no header/footer públicos
- Noindex para toda árvore `/admin/*`
