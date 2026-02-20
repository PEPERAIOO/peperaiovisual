/**
 * Types para o módulo de Formação de Preço de Venda
 * Sistema de Orçamentação Bottom-up para Engenharia
 */

// ============================================================================
// CONSTANTES DO SISTEMA
// ============================================================================

export const CONSTANTES_CALCULO = {
  HORAS_DIA: 8, // Base de cálculo para custo/hora a partir da diária
  ADICIONAL_HE_50: 1.5, // Hora extra 50%
  ADICIONAL_HE_100: 2.0, // Hora extra 100%
} as const;

// ============================================================================
// MÃO DE OBRA (HOMEM HORA)
// ============================================================================

export interface CargoMaoDeObra {
  id: string;
  cargo: string; // Ex: Engenheiro, Eletricista, Técnico
  valorDiaria: number; // Diária base (R$/dia)
  qtdPessoas: number; // Quantidade de pessoas neste cargo
  diasNaObra: number; // Dias trabalhados na obra
  horasNormais: number; // Horas normais trabalhadas
  horasExtras50: number; // Horas extras com adicional de 50%
  horasExtras100: number; // Horas extras com adicional de 100%
}

export interface CustoMaoDeObra {
  cargoId: string;
  cargo: string;
  valorDiaria: number;
  encargos: number; // Valor calculado (70% da diária)
  beneficios: number; // Benefícios sobre a diária
  diariaComEncargos: number; // Diária + Encargos
  diariaComEncargosBeneficios: number; // Diária + Encargos + Benefícios
  custoHora: number; // Custo por hora (diária com encargos / horas-dia)
  fatorProdutividade: number; // Ajuste de produtividade (>= 1)
  custoHorasNormais: number;
  custoHorasExtras50: number;
  custoHorasExtras100: number;
  custoTotalCargo: number; // Custo total deste cargo
  qtdPessoas: number;
}

// ============================================================================
// LOGÍSTICA E MOBILIZAÇÃO
// ============================================================================

export interface HospedagemAlimentacao {
  id: string;
  descricao: string; // Ex: Hotel, Alimentação
  valorDiaria: number; // Valor por diária (ex: quarto/pacote) por dia
  diasViajados: number; // Quantidade de dias
  qtdPessoas: number; // Quantidade de pessoas
}

export interface Transporte {
  id: string;
  descricao: string; // Ex: Veículo Leve, Caminhão
  distanciaKm: number; // Distância total (ida + volta)
  consumoKmPorLitro: number; // Eficiência do veículo
  precoCombustivel: number; // Preço por litro
  pedagios: number; // Valor total de pedágios
  qtdViagens: number; // Número de viagens
}

export interface CustoLogistica {
  hospedagemTotal: number;
  transporteTotal: number;
  totalLogistica: number;
}

// ============================================================================
// MATERIAIS E EQUIPAMENTOS
// ============================================================================

export interface Material {
  id: string;
  descricao: string;
  unidade: string; // Ex: m, kg, unid
  quantidade: number;
  precoUnitario: number;
  categoria: 'material' | 'equipamento' | 'servico_terceiro';
}

export interface CustoMateriais {
  materiais: Material[];
  totalMateriais: number;
  totalEquipamentos: number;
  totalServicosTerceiros: number;
  totalGeral: number;
}

// ============================================================================
// ENGENHARIA FINANCEIRA (FECHAMENTO)
// ============================================================================

export interface ParametrosFinanceiros {
  bdi: number; // Taxa de BDI (ex: 0.20 = 20%)
  margemLucro: number; // Margem de lucro desejada (ex: 0.15 = 15%)
  taxaImpostos: number; // Taxa de impostos (ex: 0.165 = 16.5%)
  contingencia: number; // Reserva técnica (ex: 0.05 = 5%)
  encargosSociais: number; // Encargos sociais sobre diária (ex: 0.70 = 70%)
  beneficios: number; // Benefícios sobre diária (ex: 0.12 = 12%)
  fatorProdutividade: number; // Ajuste de produtividade (ex: 1.08 = +8%)
}

export interface ResumoFinanceiro {
  // Custos Diretos
  custoMaoDeObra: number;
  custoLogistica: number;
  custoMateriais: number;
  subtotalCustosDirectos: number;

  // Custos Indiretos
  bdi: number; // Valor em R$
  contingencia: number; // Valor em R$
  subtotalCustosIndiretos: number;

  // Custo Total
  custoTotal: number;

  // Formação de Preço
  margemLucro: number; // Valor em R$
  precoAnteImpostos: number;
  impostos: number; // Valor em R$
  precoFinalVenda: number;

  // Métricas
  margemLucroPercentual: number;
  margemContribuicao: number;
  markupTotal: number; // (Preço Final / Custo Total - 1) * 100
  horasTotaisAjustadas: number; // Horas totais ajustadas por produtividade
  custoHoraMedio: number; // Custo médio de mão de obra por hora
}

// ============================================================================
// PROPOSTA COMPLETA
// ============================================================================

export interface PropostaFormacaoPreco {
  id?: string;
  nome: string; // Nome da proposta
  cliente: string;
  obra: string;
  dataElaboracao: Date;
  
  // Dados de entrada
  maoDeObra: CargoMaoDeObra[];
  hospedagens: HospedagemAlimentacao[];
  transportes: Transporte[];
  materiais: Material[];
  parametrosFinanceiros: ParametrosFinanceiros;

  // Dados calculados (gerados automaticamente)
  resumoFinanceiro?: ResumoFinanceiro;
  
  // Metadados
  criadoPor?: string;
  status: 'rascunho' | 'em_analise' | 'aprovada' | 'rejeitada';
  observacoes?: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type TipoCusto = 'mao_de_obra' | 'logistica' | 'materiais' | 'indiretos';

export interface DetalhesCusto {
  tipo: TipoCusto;
  descricao: string;
  valor: number;
  percentual: number; // Em relação ao total
}
