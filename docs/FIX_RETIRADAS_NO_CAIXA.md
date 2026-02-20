# Corrigir retiradas antigas para aparecerem no caixa

## Por que isso acontece?
As retiradas de sócios são gravadas na tabela `transacoes` com `categoria = 'Retirada de Lucro'` e `status = 'pago'`.

Se existir RLS (Row Level Security) no Supabase restringindo leitura por `user_id`, retiradas antigas que foram criadas sem `user_id` podem:
- não aparecer no Financeiro (caixa)
- não entrar nos totais do mês

## Opção A (pelo app)
Na tela **Sócios**, use o botão **“Corrigir retiradas antigas”**.
Ele tenta preencher `user_id` nas transações de retirada que estão com `user_id` nulo.

Se aparecer mensagem de erro falando em RLS, use a opção B.

Se a sua intenção é que o Financeiro seja **compartilhado** (todos usuários veem todos os lançamentos), aplique também a opção C.

## Opção B (SQL no Supabase)
Rode este SQL no Supabase (SQL Editor).

1) Descubra o `user_id` do usuário admin (Auth > Users).
2) Rode o update abaixo substituindo `SEU_USER_ID_AQUI`.

```sql
update transacoes
set user_id = 'SEU_USER_ID_AQUI'
where categoria = 'Retirada de Lucro'
  and user_id is null;
```

Opcional (mais restrito): somente retiradas pagas

```sql
update transacoes
set user_id = 'SEU_USER_ID_AQUI'
where categoria = 'Retirada de Lucro'
  and status = 'pago'
  and user_id is null;
```

Depois disso, volte no app e abra o Financeiro do mês correspondente.

## Opção C (recomendado p/ Financeiro compartilhado)
Se você quer que **qualquer usuário autenticado** veja todas as transações (não apenas as próprias), crie uma política de `SELECT` compartilhada.

Veja o passo a passo em [docs/SUPABASE_RLS_FINANCEIRO_COMPARTILHADO.md](docs/SUPABASE_RLS_FINANCEIRO_COMPARTILHADO.md).
