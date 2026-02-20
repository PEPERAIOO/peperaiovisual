# Novas Funcionalidades Implementadas

## 📋 Visão Geral

Foram implementadas três grandes funcionalidades no sistema:

1. **Rastreamento de Usuário nas Transações**
2. **Página de Configurações Completa**
3. **Sistema de Anotações com Expiração Automática**

---

## 1. 👤 Rastreamento de Usuário nas Transações

### O que foi feito:
- Adicionado campo `user_nome` na tabela `transacoes`
- Todas as transações agora registram automaticamente o nome do usuário que a criou
- Interface atualizada para exibir o nome do usuário em cada transação

### Como funciona:
Quando um usuário lança uma transação no sistema:
1. O sistema busca automaticamente o nome completo do usuário (do perfil)
2. Salva o nome junto com a transação
3. Exibe o nome na listagem de transações financeiras

### Onde aparece:
- **Página Financeiro**: Cada card de transação mostra o ícone de pessoa + nome do usuário
- Formato: `👤 Nome do Usuário`

---

## 2. ⚙️ Página de Configurações

### Funcionalidades:

#### 📌 Aba: Perfil
- Visualização e edição do nome completo
- Atualização da URL do avatar
- Exibição do e-mail (não editável)
- Badge do nível de acesso (Admin/Sócio/Usuário)

#### 🏢 Aba: Empresa
- Nome da empresa
- CNPJ
- Telefone
- E-mail empresarial
- Endereço completo
- URL da logo

#### 🎨 Aba: Preferências
**Notificações:**
- Ativar/desativar notificações por e-mail
- Ativar/desativar notificações do sistema

**Regionalização:**
- Seleção de idioma (Português/Inglês)
- Formato de moeda (Real/Dólar)
- Formato de data (DD/MM/AAAA ou MM/DD/AAAA)

### Acesso:
- Menu lateral: Botão "Configurações" (ícone de engrenagem)
- Rota: `/configuracoes`

### Tabelas criadas:
- `configuracoes_usuario`: Preferências individuais de cada usuário
- `configuracoes_empresa`: Dados gerais da empresa (compartilhado)

---

## 3. 📝 Sistema de Anotações

### Funcionalidades:

#### Criar Anotações
- **Título**: Nome curto da anotação
- **Conteúdo**: Texto livre (multilinhas)
- **Tempo de Expiração**: Escolha entre:
  - 1 dia
  - 3 dias
  - 1 semana (padrão)
  - 2 semanas
  - 1 mês
  - 2 meses
  - 3 meses

#### Visualização
- Cards visuais organizados em grid responsivo
- Indicador de dias restantes com cores:
  - 🟢 Verde: Mais de 3 dias
  - 🟠 Laranja: 2-3 dias
  - 🔴 Vermelho: 1 dia ou menos
- Mostra autor da anotação
- Data de criação

#### Gerenciamento
- ✏️ Editar anotação (título, conteúdo, prazo)
- 🗑️ Excluir manualmente
- 🧹 Limpar todas as expiradas de uma vez
- ⚡ Atualização automática

### Como funciona a expiração:
1. Ao criar anotação, você define quantos dias ela ficará visível
2. O sistema calcula automaticamente a `data_expiracao`
3. Anotações expiradas são automaticamente excluídas quando:
   - Você clica em "Limpar expiradas"
   - Ou pode configurar um cron job no Supabase (opcional)

### Acesso:
- Menu lateral: "Anotações" (ícone de nota adesiva)
- Rota: `/anotacoes`

### Tabela criada:
- `anotacoes`: Armazena todas as anotações com seus metadados

---

## 🗄️ Estrutura do Banco de Dados

### Novas Tabelas:

```sql
-- Anotações
anotacoes (
  id, titulo, conteudo, user_id, user_nome,
  dias_expiracao, data_criacao, data_expiracao,
  created_at, updated_at
)

-- Configurações de Usuário
configuracoes_usuario (
  id, user_id, tema, notificacoes_email,
  notificacoes_sistema, idioma, formato_moeda,
  formato_data, created_at, updated_at
)

-- Configurações da Empresa
configuracoes_empresa (
  id, nome_empresa, cnpj, telefone, email,
  endereco, logo_url, created_at, updated_at
)
```

### Campo Adicionado:
```sql
-- Em transacoes
ALTER TABLE transacoes ADD COLUMN user_nome TEXT;
```

---

## 🔒 Segurança (RLS)

Todas as tabelas possuem Row Level Security (RLS) ativado:

### Anotações:
- Usuários só veem suas próprias anotações
- Não podem acessar anotações de outros usuários

### Configurações de Usuário:
- Cada usuário acessa apenas suas próprias configurações

### Configurações da Empresa:
- Todos podem visualizar
- Apenas **admins** podem modificar

---

## 📦 Arquivos Criados/Modificados

### Novos Arquivos:
```
src/
  pages/
    - Anotacoes.tsx          # Página de anotações
    - Configuracoes.tsx      # Página de configurações
  types/
    - anotacoes.ts           # Tipos TypeScript para anotações
    - configuracoes.ts       # Tipos TypeScript para configurações
  hooks/
    - useAnotacoes.ts        # Hook para gerenciar anotações
docs/
  - SCHEMA_ANOTACOES_CONFIGURACOES.sql  # Script SQL completo
```

### Arquivos Modificados:
```
src/
  - App.tsx                  # Adicionadas rotas
  - layouts/MainLayout.tsx   # Adicionado menu Anotações e Configurações
  - types/financeiro.ts      # Campo user_nome em Transaction
  - hooks/useFinanceiro.ts   # Salvar user_nome ao criar transação
  - pages/Financeiro.tsx     # Exibir user_nome nos cards
```

---

## 🚀 Como Usar

### 1. Executar o Script SQL
Execute o arquivo `docs/SCHEMA_ANOTACOES_CONFIGURACOES.sql` no Supabase:
```sql
-- Copie e cole o conteúdo no SQL Editor do Supabase
-- Clique em "Run"
```

### 2. Acessar as Funcionalidades
- **Configurações**: Menu lateral > Configurações
- **Anotações**: Menu lateral > Anotações

### 3. Testar
1. Crie uma anotação com prazo de 1 dia
2. Configure suas preferências pessoais
3. Lance uma transação e veja seu nome aparecer
4. Configure dados da empresa (se for admin)

---

## 💡 Dicas de Uso

### Anotações:
- Use para lembretes de curto prazo
- Ideal para tarefas urgentes que expiram
- Anotações importantes: use prazos maiores

### Configurações:
- Configure uma vez e esqueça
- Dados da empresa aparecem em relatórios (futuro)
- Preferências afetam todo o sistema

### Transações:
- Agora você sabe quem lançou cada movimentação
- Útil para auditoria e rastreamento
- Histórico completo preservado

---

## 🔮 Melhorias Futuras Possíveis

1. **Anotações:**
   - Categorias/tags
   - Busca e filtros
   - Anexos de arquivos
   - Compartilhamento entre usuários

2. **Configurações:**
   - Upload de logo/avatar direto
   - Mais opções de personalização
   - Backup de configurações

3. **Transações:**
   - Filtrar por usuário
   - Relatórios por usuário
   - Estatísticas de lançamentos

---

## 📞 Suporte

Caso encontre algum problema:
1. Verifique se o script SQL foi executado
2. Confirme as permissões RLS no Supabase
3. Limpe o cache do navegador
4. Verifique o console do navegador para erros

---

**Desenvolvido com ❤️ para o Sistema Peperaio ERP**
