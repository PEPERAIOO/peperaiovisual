# 🎯 Módulo de Formação de Preço - Visão Geral

## ✅ O que foi criado

### 📁 Arquivos Principais

1. **[src/types/formacao-preco.ts](../src/types/formacao-preco.ts)**
   - Interfaces TypeScript completas
   - Constantes do sistema
   - Types para Mão de Obra, Logística, Materiais e Resumo Financeiro

2. **[src/hooks/useFormacaoPreco.ts](../src/hooks/useFormacaoPreco.ts)**
   - Hook customizado com toda a lógica de cálculo
   - Implementação de fórmulas financeiras
   - Cálculos reativos com `useMemo`
   - Métodos CRUD para manipulação de dados

3. **[src/components/formacao-preco/](../src/components/formacao-preco/)**
   - `TabelaMaoDeObra.tsx` - Exibe custos calculados
   - `FormularioCargo.tsx` - Form para adicionar cargos
   - `ResumoFinanceiroCard.tsx` - Card com fechamento financeiro
   - `ConfiguracoesFinanceiras.tsx` - Configuração de parâmetros

4. **[src/pages/FormacaoPreco.tsx](../src/pages/FormacaoPreco.tsx)**
   - Página principal com 4 abas
   - Interface completa e funcional
   - Integração de todos os componentes

5. **Documentação**
   - `FORMACAO_PRECO.md` - Documentação técnica completa
   - `EXEMPLOS_USO.ts` - Exemplos práticos de uso

---

## 🧮 Fórmulas Implementadas

### Mão de Obra
```typescript
// Custo por Homem Hora
custoHH = (salarioBase × 1.70) ÷ 220

// Custo total do cargo
custoTotal = (custoHH × horasNormais × qtdPessoas) +
             (custoHH × 1.5 × horasExtras50 × qtdPessoas) +
             (custoHH × 2.0 × horasExtras100 × qtdPessoas)
```

### Logística
```typescript
// Hospedagem
custoHospedagem = valorDiaria × diasViajados × qtdPessoas

// Transporte
custoTransporte = ((distanciaKm ÷ consumoKmL) × precoCombustivel + pedagios) × qtdViagens
```

### Fechamento Financeiro
```typescript
// Custos totais
custoTotal = custosDirectos + bdi + contingencia

// Preço com margem
precoAnteImpostos = custoTotal × (1 + margemLucro)

// Gross Up (impostos por fora)
precoFinal = precoAnteImpostos ÷ (1 - taxaImpostos)
```

---

## 🚀 Como Usar

### Passo 1: Importar o hook
```typescript
import { useFormacaoPreco } from '../hooks/useFormacaoPreco';

const { 
  adicionarCargo, 
  resumoFinanceiro,
  atualizarParametrosFinanceiros 
} = useFormacaoPreco();
```

### Passo 2: Adicionar dados
```typescript
// Adicionar cargo
adicionarCargo({
  cargo: 'Engenheiro Eletricista',
  salarioBase: 8000,
  qtdPessoas: 2,
  diasNaObra: 22,
  horasNormais: 220,
  horasExtras50: 20,
  horasExtras100: 0,
});

// Configurar parâmetros
atualizarParametrosFinanceiros({
  bdi: 0.20,
  margemLucro: 0.15,
  taxaImpostos: 0.165,
  contingencia: 0.05,
});
```

### Passo 3: Obter resultado
```typescript
console.log(resumoFinanceiro.precoFinalVenda);
console.log(resumoFinanceiro.margemContribuicao);
```

---

## 📊 Exemplo de Saída

Para um orçamento com:
- 1 Engenheiro (R$ 8.000/mês) × 2 pessoas × 220h
- BDI 20%, Margem 15%, Impostos 16.5%

**Resultado:**
```
Mão de Obra: R$ 27.200,00
BDI (20%): R$ 5.440,00
Custo Total: R$ 32.640,00
Margem (15%): R$ 4.896,00
Preço Ante Impostos: R$ 37.536,00
Impostos: R$ 7.457,43
━━━━━━━━━━━━━━━━━━━━━━━━━
PREÇO FINAL: R$ 44.993,43
```

---

## 🎨 Interface

### Abas Disponíveis:
1. **Mão de Obra** - Gerenciar equipe e ver custos de HH
2. **Logística** - Hospedagem e transporte (em desenvolvimento)
3. **Materiais** - Materiais e equipamentos (em desenvolvimento)
4. **Resumo Final** - Fechamento financeiro completo

### Features:
- ✅ Tabela de custos em tempo real
- ✅ Formulário modal para adicionar cargos
- ✅ Card de resumo financeiro visual
- ✅ Configuração de parâmetros (BDI, margem, impostos)
- ✅ Cálculos automáticos com React hooks
- ✅ Formatação de moeda brasileira
- ✅ Legendas explicativas das fórmulas

---

## 🔧 Próximas Implementações

### Prioridade Alta:
- [ ] Módulo de Logística completo
- [ ] Módulo de Materiais completo
- [ ] Integração com Supabase
- [ ] Exportação para PDF

### Prioridade Média:
- [ ] Edição de cargos existentes
- [ ] Duplicar proposta
- [ ] Histórico de versões
- [ ] Workflow de aprovação

### Prioridade Baixa:
- [ ] Dashboard de análise
- [ ] Comparação entre propostas
- [ ] Importação de planilhas Excel
- [ ] Templates de propostas

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────┐
│         FormacaoPreco.tsx (Page)        │
│  - UI Principal                         │
│  - Controle de Abas                     │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│     useFormacaoPreco (Hook)             │
│  - Estado da proposta                   │
│  - Lógica de cálculo                    │
│  - Métodos CRUD                         │
└─────────────────┬───────────────────────┘
                  │
      ┌───────────┼───────────┐
      ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Tabela   │ │ Resumo   │ │ Config   │
│ Mão Obra │ │Financeiro│ │Financial │
└──────────┘ └──────────┘ └──────────┘
```

---

## 💡 Diferenciais Técnicos

1. **Código Limpo e Documentado**
   - Comentários explicativos em todas as fórmulas
   - Nomenclatura clara e em português
   - Separação de responsabilidades

2. **Performance Otimizada**
   - Uso de `useMemo` para cálculos pesados
   - `useCallback` para funções estáveis
   - Re-renders minimizados

3. **Type Safety**
   - 100% TypeScript
   - Interfaces bem definidas
   - Validação em tempo de compilação

4. **Fórmulas Financeiras Corretas**
   - Implementação do Gross Up
   - Cálculo de HH com encargos
   - BDI e contingência separados

5. **Componentização Reutilizável**
   - Componentes independentes
   - Props bem definidas
   - Fácil manutenção

---

## 📖 Documentação Relacionada

- [Documentação Técnica Completa](FORMACAO_PRECO.md)
- [Exemplos de Uso](EXEMPLOS_USO.ts)

---

## 🤝 Integração com o Sistema Atual

Este módulo se integra perfeitamente com a estrutura existente:

```typescript
// Já compatível com:
- contexts/AuthContext.tsx
- hooks/usePropostas.ts
- pages/PropostaEditor.tsx
- components/propostas/PropostaPDF.tsx

// Pode ser facilmente integrado em:
- Módulo de Obras
- Módulo de Propostas
- Dashboard
```

---

**Status:** ✅ Módulo Funcional (Mão de Obra)  
**Versão:** 1.0.0  
**Última Atualização:** Dezembro 2025
