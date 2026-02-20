# 📊 Módulo de Formação de Preço de Venda para Engenharia

Sistema de orçamentação **Bottom-up** para projetos de engenharia, replicando a lógica complexa de planilhas de custos.

---

## 🏗️ Arquitetura do Sistema

### Stack Tecnológica
- **Frontend:** React + TypeScript + Material UI
- **Backend:** Supabase (PostgreSQL)
- **Gerenciamento de Estado:** React Hooks customizados

### Estrutura de Arquivos

```
src/
├── types/
│   └── formacao-preco.ts          # Interfaces e tipos TypeScript
├── hooks/
│   └── useFormacaoPreco.ts        # Hook principal com lógica de cálculo
├── components/
│   └── formacao-preco/
│       ├── TabelaMaoDeObra.tsx           # Exibe custos de mão de obra
│       ├── FormularioCargo.tsx           # Form para adicionar cargos
│       ├── ResumoFinanceiroCard.tsx      # Card com resumo final
│       ├── ConfiguracoesFinanceiras.tsx  # Config de BDI, margem, impostos
│       └── index.ts
└── pages/
    └── FormacaoPreco.tsx          # Página principal do módulo
```

---

## 📐 Regras de Negócio e Fórmulas

### 1. Mão de Obra (Homem Hora - HH)

#### Entrada de Dados:
- Cargo (ex: Engenheiro, Eletricista)
- Salário Base Mensal (R$)
- Quantidade de Pessoas
- Dias na Obra
- Horas Normais
- Horas Extras 50%
- Horas Extras 100%

#### Constantes:
```typescript
ENCARGOS_SOCIAIS = 70% (0.7)
HORAS_MENSAIS = 220
ADICIONAL_HE_50 = 1.5
ADICIONAL_HE_100 = 2.0
```

#### Fórmulas:

**1. Encargos Sociais:**
```
Encargos = Salário Base × 0.70
```

**2. Salário com Encargos:**
```
Salário Total = Salário Base + Encargos
Salário Total = Salário Base × (1 + 0.70)
Salário Total = Salário Base × 1.70
```

**3. Custo por Homem Hora (HH):**
```
Custo HH = Salário Total ÷ 220 horas
Custo HH = (Salário Base × 1.70) ÷ 220
```

**4. Custo de Horas Trabalhadas:**
```
Custo Horas Normais = Custo HH × Horas Normais × Qtd Pessoas
Custo HE 50% = Custo HH × 1.5 × Horas Extras 50% × Qtd Pessoas
Custo HE 100% = Custo HH × 2.0 × Horas Extras 100% × Qtd Pessoas
```

**5. Custo Total do Cargo:**
```
Custo Total Cargo = Custo Horas Normais + Custo HE 50% + Custo HE 100%
```

**Exemplo Prático:**
```
Cargo: Engenheiro Eletricista
Salário Base: R$ 8.000,00
Qtd Pessoas: 2
Horas Normais: 220h
Horas Extras 50%: 20h

Cálculo:
- Encargos: R$ 8.000 × 0.70 = R$ 5.600,00
- Salário Total: R$ 8.000 + R$ 5.600 = R$ 13.600,00
- Custo HH: R$ 13.600 ÷ 220 = R$ 61,82/hora
- Custo Horas Normais: R$ 61,82 × 220 × 2 = R$ 27.200,00
- Custo HE 50%: R$ 61,82 × 1.5 × 20 × 2 = R$ 3.709,20
- TOTAL CARGO: R$ 30.909,20
```

---

### 2. Logística e Mobilização

#### Hospedagem e Alimentação:
```
Custo Hospedagem = Valor Diária × Dias Viajados × Qtd Pessoas
```

**Exemplo:**
```
Diária: R$ 150,00
Dias: 22
Pessoas: 3
Custo = R$ 150 × 22 × 3 = R$ 9.900,00
```

#### Transporte:
```
Custo Combustível = (Distância ÷ Consumo) × Preço Combustível
Custo Total = (Custo Combustível + Pedágios) × Qtd Viagens
```

**Exemplo:**
```
Distância: 800 km (ida e volta)
Consumo: 10 km/L
Preço Combustível: R$ 6,00/L
Pedágios: R$ 50,00
Viagens: 2

Cálculo:
- Combustível por viagem: (800 ÷ 10) × 6 = R$ 480,00
- Total por viagem: R$ 480 + R$ 50 = R$ 530,00
- Total: R$ 530 × 2 = R$ 1.060,00
```

---

### 3. Engenharia Financeira (Fechamento)

#### Custos Diretos:
```
Custos Diretos = Mão de Obra + Logística + Materiais
```

#### Custos Indiretos:
```
BDI = Custos Diretos × Taxa BDI
Contingência = Custos Diretos × Taxa Contingência
Custos Indiretos = BDI + Contingência
```

#### Custo Total:
```
Custo Total = Custos Diretos + Custos Indiretos
```

#### Formação de Preço:
```
Margem Lucro (R$) = Custo Total × Taxa Margem
Preço Ante Impostos = Custo Total + Margem Lucro
```

#### **Cálculo de Impostos "Por Fora" (Gross Up):**

Esta é a parte mais importante! Os impostos são calculados "por fora", ou seja, o preço final é ajustado para que, após retirar os impostos, sobre exatamente o valor com a margem de lucro desejada.

```
Preço Final = Preço Ante Impostos ÷ (1 - Taxa Impostos)
Impostos (R$) = Preço Final - Preço Ante Impostos
```

**Por que dividir por (1 - Taxa Impostos)?**

Se você tem um preço de R$ 100 e quer que, após pagar 16,5% de impostos, sobre R$ 100, você não pode simplesmente somar R$ 16,50. Você precisa calcular:

```
X - (X × 0.165) = 100
X × (1 - 0.165) = 100
X × 0.835 = 100
X = 100 ÷ 0.835
X = R$ 119,76
```

Assim, R$ 119,76 × 16,5% = R$ 19,76 de impostos, sobrando R$ 100,00.

**Exemplo Completo:**

```
Custos Diretos: R$ 50.000,00
BDI (20%): R$ 10.000,00
Contingência (5%): R$ 2.500,00
Custo Total: R$ 62.500,00

Margem Lucro (15%): R$ 9.375,00
Preço Ante Impostos: R$ 71.875,00

Taxa Impostos: 16,5%
Preço Final: R$ 71.875 ÷ (1 - 0.165) = R$ 71.875 ÷ 0.835 = R$ 86.077,84

Impostos: R$ 86.077,84 - R$ 71.875,00 = R$ 14.202,84

✅ Prova: R$ 86.077,84 × 0.165 = R$ 14.202,84 (16,5% do preço final)
```

---

## 🎯 Como Usar

### 1. Importar o Hook

```typescript
import { useFormacaoPreco } from '../hooks/useFormacaoPreco';

const {
  proposta,
  custosTotalMaoDeObra,
  totalMaoDeObra,
  resumoFinanceiro,
  adicionarCargo,
  atualizarParametrosFinanceiros,
} = useFormacaoPreco();
```

### 2. Adicionar Cargos

```typescript
adicionarCargo({
  cargo: 'Engenheiro Eletricista',
  salarioBase: 8000,
  qtdPessoas: 2,
  diasNaObra: 22,
  horasNormais: 220,
  horasExtras50: 20,
  horasExtras100: 0,
});
```

### 3. Configurar Parâmetros Financeiros

```typescript
atualizarParametrosFinanceiros({
  bdi: 0.20,         // 20%
  margemLucro: 0.15, // 15%
  taxaImpostos: 0.165, // 16.5%
  contingencia: 0.05,  // 5%
});
```

### 4. Obter Resultado Final

```typescript
console.log(resumoFinanceiro.precoFinalVenda); // Preço final calculado
console.log(resumoFinanceiro.margemContribuicao); // Margem em %
```

---

## 📊 Interface do Usuário

A página possui 4 abas principais:

1. **Mão de Obra** - Adicionar cargos e visualizar custos de HH
2. **Logística** - Hospedagem, alimentação e transporte
3. **Materiais** - Materiais, equipamentos e serviços
4. **Resumo Final** - Fechamento financeiro completo

---

## 🔧 Próximos Passos (Roadmap)

- [ ] Implementar CRUD de Logística (hospedagem/transporte)
- [ ] Implementar CRUD de Materiais
- [ ] Integração com Supabase (persistência de dados)
- [ ] Exportação para PDF
- [ ] Histórico de versões da proposta
- [ ] Aprovação/Rejeição com workflow
- [ ] Comparação entre propostas
- [ ] Dashboard de análise de margem

---

## 📚 Referências Técnicas

- **React Hooks**: [React Docs](https://react.dev/reference/react)
- **TypeScript**: [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- **Material UI**: [MUI Docs](https://mui.com/)

---

## 👨‍💻 Autor

Sistema desenvolvido seguindo as melhores práticas de **Clean Code**, **SOLID** e **DRY**.

**Características do Código:**
- ✅ Totalmente tipado (TypeScript)
- ✅ Comentários explicando fórmulas financeiras
- ✅ Componentes reutilizáveis
- ✅ Lógica separada da apresentação
- ✅ Cálculos em tempo real (useMemo)
- ✅ Performance otimizada

---

**Versão:** 1.0.0  
**Data:** Dezembro 2025
