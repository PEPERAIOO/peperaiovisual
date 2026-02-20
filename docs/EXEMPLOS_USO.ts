/**
 * EXEMPLO DE USO DO MÓDULO DE FORMAÇÃO DE PREÇO
 * 
 * Este arquivo demonstra como integrar o módulo em seu sistema
 */

import { useFormacaoPreco } from '../hooks/useFormacaoPreco';

// ============================================================================
// EXEMPLO 1: Uso Básico
// ============================================================================

export const ExemploBasico = () => {
  const {
    adicionarCargo,
    resumoFinanceiro,
  } = useFormacaoPreco();

  const criarOrcamentoSimples = () => {
    // Adicionar engenheiro
    adicionarCargo({
      cargo: 'Engenheiro Eletricista',
      salarioBase: 8000,
      qtdPessoas: 1,
      diasNaObra: 22,
      horasNormais: 220,
      horasExtras50: 0,
      horasExtras100: 0,
    });

    // Adicionar técnico
    adicionarCargo({
      cargo: 'Técnico Eletricista',
      salarioBase: 3500,
      qtdPessoas: 2,
      diasNaObra: 22,
      horasNormais: 220,
      horasExtras50: 20,
      horasExtras100: 0,
    });

    console.log('Preço Final:', resumoFinanceiro.precoFinalVenda);
  };

  return <button onClick={criarOrcamentoSimples}>Criar Orçamento</button>;
};

// ============================================================================
// EXEMPLO 2: Orçamento Completo com Logística
// ============================================================================

export const ExemploCompleto = () => {
  const {
    adicionarCargo,
    adicionarHospedagem,
    adicionarTransporte,
    adicionarMaterial,
    atualizarParametrosFinanceiros,
    resumoFinanceiro,
  } = useFormacaoPreco();

  const criarOrcamentoCompleto = () => {
    // 1. Configurar parâmetros financeiros
    atualizarParametrosFinanceiros({
      bdi: 0.25,         // 25% de BDI
      margemLucro: 0.20, // 20% de margem
      taxaImpostos: 0.165, // 16.5% de impostos
      contingencia: 0.08,  // 8% de contingência
    });

    // 2. Adicionar equipe de mão de obra
    adicionarCargo({
      cargo: 'Engenheiro de Projetos',
      salarioBase: 12000,
      qtdPessoas: 1,
      diasNaObra: 30,
      horasNormais: 220,
      horasExtras50: 30,
      horasExtras100: 0,
    });

    adicionarCargo({
      cargo: 'Eletricista Sênior',
      salarioBase: 4500,
      qtdPessoas: 3,
      diasNaObra: 25,
      horasNormais: 200,
      horasExtras50: 40,
      horasExtras100: 10,
    });

    // 3. Adicionar logística
    adicionarHospedagem({
      descricao: 'Hotel + Alimentação',
      valorDiaria: 180,
      diasViajados: 25,
      qtdPessoas: 4,
    });

    adicionarTransporte({
      descricao: 'Van para equipe',
      distanciaKm: 1200, // Ida e volta
      consumoKmPorLitro: 8,
      precoCombustivel: 6.20,
      pedagios: 85,
      qtdViagens: 2,
    });

    // 4. Adicionar materiais
    adicionarMaterial({
      descricao: 'Cabos elétricos',
      unidade: 'm',
      quantidade: 500,
      precoUnitario: 8.50,
      categoria: 'material',
    });

    adicionarMaterial({
      descricao: 'Quadro elétrico',
      unidade: 'unid',
      quantidade: 5,
      precoUnitario: 3200,
      categoria: 'equipamento',
    });

    // 5. Consultar resultado
    console.log('=== RESUMO FINANCEIRO ===');
    console.log('Custo Mão de Obra:', resumoFinanceiro.custoMaoDeObra);
    console.log('Custo Logística:', resumoFinanceiro.custoLogistica);
    console.log('Custo Materiais:', resumoFinanceiro.custoMateriais);
    console.log('---');
    console.log('Custo Total:', resumoFinanceiro.custoTotal);
    console.log('BDI:', resumoFinanceiro.bdi);
    console.log('Margem Lucro:', resumoFinanceiro.margemLucro);
    console.log('Impostos:', resumoFinanceiro.impostos);
    console.log('---');
    console.log('PREÇO FINAL:', resumoFinanceiro.precoFinalVenda);
    console.log('Margem Contribuição:', resumoFinanceiro.margemContribuicao, '%');
  };

  return <button onClick={criarOrcamentoCompleto}>Criar Orçamento Completo</button>;
};

// ============================================================================
// EXEMPLO 3: Cálculo Manual Passo a Passo
// ============================================================================

export const calcularManualmente = () => {
  // Dados de entrada
  const salarioBase = 8000;
  const qtdPessoas = 2;
  const horasNormais = 220;
  const horasExtras50 = 20;

  // Passo 1: Calcular encargos
  const encargos = salarioBase * 0.70; // R$ 5.600,00
  console.log('Encargos:', encargos);

  // Passo 2: Calcular salário com encargos
  const salarioComEncargos = salarioBase + encargos; // R$ 13.600,00
  console.log('Salário com Encargos:', salarioComEncargos);

  // Passo 3: Calcular custo por hora
  const custoHH = salarioComEncargos / 220; // R$ 61,82
  console.log('Custo HH:', custoHH);

  // Passo 4: Calcular custos de horas trabalhadas
  const custoHorasNormais = custoHH * horasNormais * qtdPessoas; // R$ 27.200,00
  const custoHorasExtras50 = custoHH * 1.5 * horasExtras50 * qtdPessoas; // R$ 3.709,20
  console.log('Custo Horas Normais:', custoHorasNormais);
  console.log('Custo HE 50%:', custoHorasExtras50);

  // Passo 5: Custo total do cargo
  const custoTotalCargo = custoHorasNormais + custoHorasExtras50; // R$ 30.909,20
  console.log('CUSTO TOTAL CARGO:', custoTotalCargo);

  // Passo 6: Aplicar BDI
  const custoDireto = custoTotalCargo;
  const bdi = custoDireto * 0.20; // R$ 6.181,84
  const custoComBDI = custoDireto + bdi; // R$ 37.091,04
  console.log('BDI (20%):', bdi);
  console.log('Custo com BDI:', custoComBDI);

  // Passo 7: Aplicar margem de lucro
  const margemLucro = custoComBDI * 0.15; // R$ 5.563,66
  const precoAnteImpostos = custoComBDI + margemLucro; // R$ 42.654,70
  console.log('Margem Lucro (15%):', margemLucro);
  console.log('Preço Ante Impostos:', precoAnteImpostos);

  // Passo 8: Calcular impostos "por fora" (GROSS UP)
  const taxaImpostos = 0.165; // 16.5%
  const precoFinal = precoAnteImpostos / (1 - taxaImpostos); // R$ 51.084,85
  const impostos = precoFinal - precoAnteImpostos; // R$ 8.430,15
  console.log('Taxa Impostos:', taxaImpostos);
  console.log('Impostos (R$):', impostos);
  console.log('PREÇO FINAL:', precoFinal);

  // Verificação: os impostos devem ser 16.5% do preço final
  const verificacao = precoFinal * taxaImpostos; // R$ 8.430,15
  console.log('Verificação (impostos = preço final × taxa):', verificacao);
  console.log('Correto?', Math.abs(verificacao - impostos) < 0.01);
};

// ============================================================================
// EXEMPLO 4: Cenários de Comparação
// ============================================================================

export const compararCenarios = () => {
  const { adicionarCargo, resumoFinanceiro, limparProposta } = useFormacaoPreco();

  // Cenário 1: Equipe Enxuta
  console.log('=== CENÁRIO 1: EQUIPE ENXUTA ===');
  adicionarCargo({
    cargo: 'Engenheiro',
    salarioBase: 10000,
    qtdPessoas: 1,
    diasNaObra: 20,
    horasNormais: 200,
    horasExtras50: 0,
    horasExtras100: 0,
  });
  console.log('Preço:', resumoFinanceiro.precoFinalVenda);

  // Limpar para próximo cenário
  limparProposta();

  // Cenário 2: Equipe Grande com HE
  console.log('=== CENÁRIO 2: EQUIPE GRANDE ===');
  adicionarCargo({
    cargo: 'Engenheiro',
    salarioBase: 10000,
    qtdPessoas: 1,
    diasNaObra: 30,
    horasNormais: 220,
    horasExtras50: 40,
    horasExtras100: 0,
  });
  adicionarCargo({
    cargo: 'Técnico',
    salarioBase: 4000,
    qtdPessoas: 4,
    diasNaObra: 30,
    horasNormais: 220,
    horasExtras50: 40,
    horasExtras100: 10,
  });
  console.log('Preço:', resumoFinanceiro.precoFinalVenda);
};

// ============================================================================
// EXEMPLO 5: Validações
// ============================================================================

export const validarDados = (cargo: any) => {
  const erros: string[] = [];

  if (!cargo.cargo || cargo.cargo.trim() === '') {
    erros.push('Nome do cargo é obrigatório');
  }

  if (cargo.salarioBase <= 0) {
    erros.push('Salário base deve ser maior que zero');
  }

  if (cargo.qtdPessoas < 1) {
    erros.push('Quantidade de pessoas deve ser no mínimo 1');
  }

  if (cargo.horasNormais < 0 || cargo.horasExtras50 < 0 || cargo.horasExtras100 < 0) {
    erros.push('Horas não podem ser negativas');
  }

  if (erros.length > 0) {
    console.error('Erros de validação:', erros);
    return false;
  }

  return true;
};
