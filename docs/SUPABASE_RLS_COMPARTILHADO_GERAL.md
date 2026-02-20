# Supabase RLS — Compartilhado geral (tudo igual para todos)

## Objetivo
Você pediu: **“tudo deve ser o mesmo pra todos”**.

Para isso, o Supabase precisa permitir que qualquer usuário autenticado (Marcos, Isaac, Davi, etc.) consiga **ler e também escrever** nos mesmos registros.

No código do app eu removi os *mocks/fakes*: agora, se um usuário estiver sem permissão (RLS), o app não inventa dados — ele mostra erro real.

## O que fazer no Supabase
Rode o script SQL abaixo no Supabase (SQL Editor):

- Script: [docs/supabase_rls_compartilhado_geral.sql](docs/supabase_rls_compartilhado_geral.sql)

Ele:
- Habilita RLS nas tabelas usadas pelo app (quando existirem)
- Cria políticas `SELECT/INSERT/UPDATE/DELETE` para o role `authenticated`

## Observações importantes
- Isso deixa o sistema **colaborativo**: qualquer usuário logado pode ver/editar/excluir os dados.
- Se você quiser um modelo mais seguro (ex.: só admin apaga), dá para ajustar as políticas por tabela depois.

## Checklist rápido de validação
1) Logue com Marcos/Isaac
2) Abra Pessoas/Empresas e confirme que vê os mesmos cadastros do Davi
3) Abra Financeiro/Obras/Propostas e confirme que tudo aparece igual

Se algum módulo ainda mostrar erro de RLS, me diga qual tela e eu incluo a tabela que estiver faltando no script.
