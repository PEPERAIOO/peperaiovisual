import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

// =============================================================================
// TIPOS
// =============================================================================

export interface ItemProposta {
  id: string;
  descricao: string;
  detalhes?: string;
  quantidade: number;
  valor_unitario: number;
}

export interface PropostaData {
  cliente: string;
  empresa: string;
  numeroProposta: string;
  dataEmissao: string;
  validadeProposta: string;
  prazoProducao: string;
  prazoInstalacao: string;
  entradaPercentual: string;
  observacoes?: string;
  itens: ItemProposta[];
  descricaoServico?: string;
  escopoFornecimento?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
};

// Função simples para valor por extenso (sem dependência externa)
const valorPorExtenso = (valor: number): string => {
  try {
    // Importação dinâmica para evitar problemas de carregamento
    return formatCurrency(valor);
  } catch {
    return formatCurrency(valor);
  }
};

const calcularTotal = (itens: ItemProposta[]): number => {
  return itens.reduce((acc, item) => acc + item.quantidade * item.valor_unitario, 0);
};

// =============================================================================
// ESTILOS
// =============================================================================

type PropostaTheme = 'dark' | 'light';

const THEME_TOKENS = {
  dark: {
    bg: '#181818',
    textPrimary: '#FFFFFF',
    textSecondary: '#E0E0E0',
    textBody: '#CCCCCC',
    textMuted: '#AAAAAA',
    textSubtle: '#888888',
    textFaint: '#666666',
    borderStrong: '#FFFFFF',
    border: '#444444',
    borderLight: '#333333',
    surface: '#1E1E1E',
    surfaceAlt: '#2A2A2A',
    surfaceStrong: '#1A1A1A',
    surfaceElevated: '#222222',
    accentGreen: '#009B3A',
    accentRed: '#CF2734',
    accentYellow: '#CF2734',
    stripeNeutral: '#FFFFFF',
  },
  light: {
    bg: '#FFFFFF',
    textPrimary: '#111111',
    textSecondary: '#1A1A1A',
    textBody: '#222222',
    textMuted: '#333333',
    textSubtle: '#555555',
    textFaint: '#666666',
    borderStrong: '#111111',
    border: '#BDBDBD',
    borderLight: '#D0D0D0',
    surface: '#F5F5F5',
    surfaceAlt: '#EDEDED',
    surfaceStrong: '#F0F0F0',
    surfaceElevated: '#F7F7F7',
    accentGreen: '#009B3A',
    accentRed: '#CF2734',
    accentYellow: '#CF2734',
    stripeNeutral: '#D9D9D9',
  },
} as const;

const createStyles = (theme: PropostaTheme) => {
  const colors = THEME_TOKENS[theme];

  return StyleSheet.create({
  // PÁGINA
  page: {
    backgroundColor: colors.bg,
    color: colors.textSecondary,
    fontFamily: 'Helvetica',
    padding: 0,
  },
  contentContainer: {
    paddingHorizontal: 40,
    paddingTop: 40,
    paddingBottom: 80,
  },

  // HEADER & LOGO
  header: { marginBottom: 25 },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  logoTextLarge: {
    fontSize: 52,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
  },

  // FAIXAS ITALIANAS
  stripesWrapper: {
    flexDirection: 'column',
    marginTop: 8,
    gap: 3,
  },
  stripesWrapperCover: {
    flexDirection: 'column',
    marginTop: 8,
    gap: 3,
    width: 270,
    alignSelf: 'center',
  },
  stripeGreen: { height: 4, backgroundColor: colors.accentGreen },
  stripeWhite: { height: 4, backgroundColor: colors.stripeNeutral },
  stripeRed: { height: 4, backgroundColor: colors.accentRed },

  // TIPOGRAFIA
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: colors.textPrimary,
    marginBottom: 15,
    marginTop: 10,
    letterSpacing: 1,
  },
  subsectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  text: {
    fontSize: 9,
    lineHeight: 1.6,
    textAlign: 'justify',
    marginBottom: 6,
    color: colors.textBody,
  },
  textSmall: {
    fontSize: 8,
    lineHeight: 1.5,
    color: colors.textBody,
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  highlight: {
    fontWeight: 'bold',
    color: colors.accentYellow,
  },

  // CAPA
  coverPage: {
    flex: 1,
    padding: 25,
  },
  coverBorder: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 30,
    position: 'relative',
  },
  coverLogoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverSubtitle: {
    fontSize: 14,
    textTransform: 'uppercase',
    color: colors.textPrimary,
    letterSpacing: 4,
    marginTop: 8,
    textAlign: 'center',
  },
  coverFooter: {
    position: 'absolute',
    bottom: 30,
    left: 30,
  },
  coverFooterSection: {
    marginBottom: 15,
  },
  coverFooterTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  coverFooterText: {
    fontSize: 9,
    color: colors.textMuted,
    marginBottom: 2,
  },

  // RODAPÉ DAS PÁGINAS
  pageFooter: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pageFooterText: {
    fontSize: 8,
    color: colors.textFaint,
    marginBottom: 1,
    textAlign: 'center',
  },
  pageFooterBold: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 2,
  },

  // SUMÁRIO
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 3,
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingLeft: 20,
  },
  summaryBullet: {
    width: 8,
    height: 8,
    backgroundColor: colors.textPrimary,
    borderRadius: 4,
    marginRight: 15,
  },
  summaryText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // TABELA DE PREÇOS
  tableContainer: {
    marginTop: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableRowTotal: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceStrong,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  colDesc: { flex: 2.5, paddingRight: 8 },
  colQtd: { flex: 0.8, textAlign: 'center' },
  colUnit: { flex: 1.5, textAlign: 'right', paddingRight: 8 },
  colTotal: { flex: 1.5, textAlign: 'right' },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textTransform: 'uppercase',
  },
  tableCellText: {
    fontSize: 9,
    color: colors.textBody,
  },
  tableCellBold: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  tableCellHighlight: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.accentYellow,
  },

  // SEPARADOR
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  separatorText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginHorizontal: 15,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },

  // DADOS DA PROPOSTA
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.textPrimary,
    width: 70,
  },
  fieldValue: {
    fontSize: 9,
    color: colors.textBody,
    flex: 1,
  },

  // ASSINATURA
  signatureBlock: {
    marginTop: 30,
  },
  signatureName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  signatureRole: {
    fontSize: 9,
    color: colors.textBody,
    marginBottom: 2,
  },
  signatureContact: {
    fontSize: 9,
    color: colors.textMuted,
  },

  // CLÁUSULAS
  clauseNumber: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  clauseText: {
    fontSize: 9,
    lineHeight: 1.6,
    color: colors.textBody,
    marginBottom: 10,
    textAlign: 'justify',
  },

  // PROTEÇÃO JURÍDICA
  protecaoJuridica: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: colors.surface,
    borderRadius: 4,
    borderLeft: 3,
    borderLeftColor: colors.accentRed,
  },
  juridicoParagrafo: {
    fontSize: 8,
    color: colors.textMuted,
    lineHeight: 1.5,
    marginBottom: 8,
    textAlign: 'justify',
  },
  juridicoTitulo: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 10,
    marginBottom: 5,
  },

  // CAMPO DE ASSINATURA
  assinaturaContainer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 4,
    borderTop: 2,
    borderTopColor: colors.accentGreen,
  },
  assinaturaTitulo: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  assinaturaLinha: {
    width: '80%',
    borderTop: 1,
    borderTopColor: colors.borderStrong,
    marginBottom: 8,
    height: 40,
    alignSelf: 'center',
  },
  assinaturaTexto: {
    fontSize: 9,
    color: colors.textBody,
    textAlign: 'center',
    marginBottom: 4,
  },
  assinaturaData: {
    fontSize: 8,
    color: colors.textSubtle,
    textAlign: 'center',
    marginTop: 15,
  },
  });
};

type PropostaStyles = ReturnType<typeof createStyles>;

// =============================================================================
// COMPONENTES AUXILIARES
// =============================================================================

const ItalianStripes: React.FC<{ isCover?: boolean; styles: PropostaStyles }> = ({
  isCover = false,
  styles,
}) => (
  <View style={isCover ? styles.stripesWrapperCover : styles.stripesWrapper}>
    <View style={styles.stripeGreen} />
    <View style={styles.stripeWhite} />
    <View style={styles.stripeRed} />
  </View>
);

const PageHeader: React.FC<{ styles: PropostaStyles }> = ({ styles }) => (
  <View style={styles.header}>
    <Text style={styles.logoText}>PEPERAIO</Text>
    <View style={[styles.stripesWrapper, { width: 170 }]}>
      <View style={styles.stripeGreen} />
      <View style={styles.stripeWhite} />
      <View style={styles.stripeRed} />
    </View>
  </View>
);

const PageFooterDefault: React.FC<{ styles: PropostaStyles }> = ({ styles }) => (
  <View style={styles.pageFooter}>
    <Text style={styles.pageFooterBold}>PEPERAIO COMUNICAÇÃO VISUAL</Text>
    <Text style={styles.pageFooterText}>Sua imagem, nosso compromisso!</Text>
  </View>
);

const PageFooterMarcos: React.FC<{ styles: PropostaStyles }> = ({ styles }) => (
  <View style={styles.pageFooter}>
    <Text style={styles.pageFooterBold}>MARCOS PEPERAIO</Text>
    <Text style={styles.pageFooterText}>Vendedor Técnico/Comercial</Text>
    <Text style={styles.pageFooterText}>(61) 98196-6308 | contato@peperaiovisual.com.br</Text>
  </View>
);

const PageFooterIsaac: React.FC<{ styles: PropostaStyles }> = ({ styles }) => (
  <View style={styles.pageFooter}>
    <Text style={styles.pageFooterBold}>ISAAC PEPERAIO</Text>
    <Text style={styles.pageFooterText}>Depto. Engenharia e Montagem</Text>
    <Text style={styles.pageFooterText}>(62) 98427-4856 | contato@peperaiovisual.com.br</Text>
  </View>
);

const SectionSeparator: React.FC<{ title: string; styles: PropostaStyles }> = ({ title, styles }) => (
  <View style={styles.separator}>
    <View style={styles.separatorLine} />
    <Text style={styles.separatorText}>{title}</Text>
    <View style={styles.separatorLine} />
  </View>
);

// =============================================================================
// PÁGINAS DO PDF
// =============================================================================

// PÁGINA 1: CAPA
const CoverPage: React.FC<{ styles: PropostaStyles }> = ({ styles }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.coverPage}>
      <View style={styles.coverBorder}>
        <View style={styles.coverLogoContainer}>
          <Text style={styles.logoTextLarge}>PEPERAIO</Text>
          <ItalianStripes isCover styles={styles} />
          <Text style={styles.coverSubtitle}>COMUNICAÇÃO VISUAL</Text>
        </View>
        <View style={styles.coverFooter}>
          <View style={styles.coverFooterSection}>
            <Text style={styles.coverFooterTitle}>Vendedor Técnico/Comercial</Text>
            <Text style={styles.coverFooterText}>Marcos Paulo Peperaio</Text>
            <Text style={styles.coverFooterText}>(61) 98196-6308</Text>
          </View>
          <View style={styles.coverFooterSection}>
            <Text style={styles.coverFooterTitle}>DEPTO. Engenharia e Montagem</Text>
            <Text style={styles.coverFooterText}>Isaac Peperaio</Text>
            <Text style={styles.coverFooterText}>(62) 98427-4856</Text>
          </View>
        </View>
      </View>
    </View>
  </Page>
);

// PÁGINA 2: SUMÁRIO
const SummaryPage: React.FC<{ styles: PropostaStyles }> = ({ styles }) => {
  const items = [
    'Escopo de fornecimento',
    'Exclusões / Lista de serviços',
    'Notas Técnicas',
    'Preços',
    'Condições gerais De Venda',
    'Termo de garantia de produtos engenhados',
  ];

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.contentContainer}>
        <PageHeader styles={styles} />
        <Text style={styles.summaryTitle}>CONTEÚDO</Text>
        {items.map((item, index) => (
          <View key={index} style={styles.summaryItem}>
            <View style={styles.summaryBullet} />
            <Text style={styles.summaryText}>{item}</Text>
          </View>
        ))}
      </View>
      <PageFooterDefault styles={styles} />
    </Page>
  );
};

// PÁGINA 3: PROPOSTA TÉCNICA E COMERCIAL
const ProposalIntroPage: React.FC<{ data: PropostaData; styles: PropostaStyles }> = ({ data, styles }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.contentContainer}>
      <PageHeader styles={styles} />

      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>DE:</Text>
        <Text style={styles.fieldValue}>Peperaio comunicação visual</Text>
      </View>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>PARA:</Text>
        <Text style={styles.fieldValue}>{data.empresa || data.cliente}</Text>
      </View>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>Proposta:</Text>
        <Text style={[styles.fieldValue, styles.highlight]}>{data.numeroProposta}</Text>
      </View>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>Emissão:</Text>
        <Text style={styles.fieldValue}>{formatDate(data.dataEmissao)}</Text>
      </View>

      <SectionSeparator title="PROPOSTA TÉCNICA E COMERCIAL" styles={styles} />

      <Text style={styles.text}>
        Prezado senhor(a) <Text style={styles.bold}>{data.cliente}</Text>, atendendo a sua consulta, temos a satisfação 
        de apresentar-lhe nossa Proposta Técnica / Comercial para o fornecimento da{' '}
        <Text style={styles.bold}>{data.descricaoServico || 'comunicação visual solicitada'}</Text>, os quais serão 
        construídos de acordo com as características técnicas mencionadas na proposta técnica. Esperamos desta forma 
        ter correspondido às suas expectativas e colocamo-nos ao seu inteiro dispor para quaisquer esclarecimentos 
        complementares. Atenciosamente;
      </Text>

      <View style={styles.signatureBlock}>
        <Text style={styles.signatureName}>MARCOS PEPERAIO</Text>
        <Text style={styles.signatureRole}>Vendedor Técnico/Comercial</Text>
        <Text style={styles.signatureContact}>(61) 98196-6308</Text>
        <Text style={styles.signatureContact}>E-mail: contato@peperaiovisual.com.br</Text>
      </View>
    </View>
    <PageFooterMarcos styles={styles} />
  </Page>
);

// PÁGINA 4: ESCOPO DE FORNECIMENTO
const ScopePage: React.FC<{ data: PropostaData; styles: PropostaStyles }> = ({ data, styles }) => {
  const total = calcularTotal(data.itens);
  const restante = 100 - parseInt(data.entradaPercentual || '50');

  const renderAutoScope = () => (
    <>
      <Text style={styles.subsectionTitle}>1. Objeto</Text>
      <Text style={styles.text}>Fornecimento, produção e acabamento de:</Text>
      {data.itens.map((item) => (
        <Text key={item.id} style={styles.text}>
          • {item.quantidade}x {item.descricao}{item.detalhes ? ` - ${item.detalhes}` : ''}
        </Text>
      ))}
      <Text style={[styles.text, { marginTop: 10 }]}>
        Todos os itens serão produzidos com padrão profissional, acabamento refinado e materiais de alta durabilidade.
      </Text>

      {data.itens.map((item, index) => (
        <View key={item.id}>
          <Text style={styles.subsectionTitle}>{index + 2}. {item.descricao}</Text>
          <Text style={styles.text}>Quantidade: {item.quantidade} unidade(s)</Text>
          {item.detalhes && <Text style={styles.text}>Descrição Técnica: {item.detalhes}</Text>}
          <Text style={styles.text}>
            Valor: <Text style={styles.highlight}>{formatCurrency(item.quantidade * item.valor_unitario)}</Text>
          </Text>
        </View>
      ))}

      <Text style={[styles.subsectionTitle, { marginTop: 20 }]}>VALOR TOTAL DO ESCOPO:</Text>
      <Text style={[styles.text, styles.highlight]}>
        {formatCurrency(total)} ({valorPorExtenso(total)}).
      </Text>

      <Text style={[styles.text, { marginTop: 15 }]}>
        Condições de Pagamento: {data.entradaPercentual}% de entrada no ato da contratação; {restante}% restante 
        ao término da obra, mediante nota fiscal e/ou boleto bancário.
      </Text>
    </>
  );

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.contentContainer}>
        <PageHeader styles={styles} />
        <Text style={styles.sectionTitle}>1- ESCOPO DE FORNECIMENTO</Text>
        
        {data.escopoFornecimento ? (
          <Text style={styles.text}>{data.escopoFornecimento}</Text>
        ) : (
          renderAutoScope()
        )}
      </View>
      <PageFooterMarcos styles={styles} />
    </Page>
  );
};

// PÁGINA 5: EXCLUSÕES E NOTAS TÉCNICAS
const ExclusionsPage: React.FC<{ styles: PropostaStyles }> = ({ styles }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.contentContainer}>
      <PageHeader styles={styles} />

      <Text style={styles.sectionTitle}>2- EXCLUSÕES / LISTA DE DESVIOS</Text>
      
      <Text style={styles.clauseNumber}>2.1 - Serviços de instalação elétrica</Text>
      <Text style={styles.clauseText}>
        Não estão inclusos serviços de instalação elétrica, ficando a cargo do cliente a contratação 
        de profissional habilitado para este fim.
      </Text>

      <Text style={styles.clauseNumber}>2.2 - Escopo limitado</Text>
      <Text style={styles.clauseText}>
        Apenas letras e painéis do projeto estão inclusos nesta proposta.
      </Text>

      <Text style={styles.clauseNumber}>2.3 - Serviços listados</Text>
      <Text style={styles.clauseText}>
        Apenas os serviços listados nesta proposta serão executados.
      </Text>

      <Text style={styles.clauseNumber}>2.4 - Luminárias</Text>
      <Text style={styles.clauseText}>
        Luminárias não estão inclusas nesta proposta, salvo especificação contrária.
      </Text>

      <Text style={styles.clauseNumber}>2.5 - Materiais não mencionados</Text>
      <Text style={styles.clauseText}>
        Materiais e/ou serviços não mencionados explicitamente nesta proposta não estão inclusos.
      </Text>

      <Text style={[styles.sectionTitle, { marginTop: 25 }]}>3- NOTAS TÉCNICAS</Text>

      <Text style={styles.clauseNumber}>3.1 - Documentações técnicas</Text>
      <Text style={styles.clauseText}>
        Foram consideradas as documentações técnicas fornecidas pelo cliente para elaboração desta proposta.
      </Text>

      <Text style={styles.clauseNumber}>3.2 - Garantia do material</Text>
      <Text style={styles.clauseText}>
        O material utilizado possui garantia de 5 (cinco) anos contra defeitos de fabricação.
      </Text>

      <Text style={styles.clauseNumber}>3.3 - Direitos autorais</Text>
      <Text style={styles.clauseText}>
        Os direitos autorais do projeto são de propriedade da Peperaio Comunicação Visual.
      </Text>

      <Text style={styles.clauseNumber}>3.4 - Garantia do serviço</Text>
      <Text style={styles.clauseText}>
        A garantia do serviço é equivalente à garantia do material utilizado.
      </Text>

      <Text style={styles.clauseNumber}>3.5 - Divergências</Text>
      <Text style={styles.clauseText}>
        Eventuais divergências entre o projeto e a execução podem ser ajustadas mediante acordo entre as partes.
      </Text>
    </View>
    <PageFooterDefault styles={styles} />
  </Page>
);

// PÁGINA 6: PREÇOS (TABELA)
const PricingPage: React.FC<{ data: PropostaData; styles: PropostaStyles }> = ({ data, styles }) => {
  const total = calcularTotal(data.itens);

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.contentContainer}>
        <PageHeader styles={styles} />
        <Text style={styles.sectionTitle}>4- Preços</Text>

        <View style={styles.tableContainer}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <View style={styles.colDesc}>
              <Text style={styles.tableHeaderText}>DESCRIÇÃO:</Text>
            </View>
            <View style={styles.colQtd}>
              <Text style={[styles.tableHeaderText, { textAlign: 'center' }]}>QTDE.</Text>
            </View>
            <View style={styles.colUnit}>
              <Text style={[styles.tableHeaderText, { textAlign: 'right' }]}>VL. UNIT.</Text>
            </View>
            <View style={styles.colTotal}>
              <Text style={[styles.tableHeaderText, { textAlign: 'right' }]}>VL. TOTAL</Text>
            </View>
          </View>

          {/* Rows */}
          {data.itens.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <View style={styles.colDesc}>
                <Text style={styles.tableCellText}>{item.descricao}</Text>
              </View>
              <View style={styles.colQtd}>
                <Text style={[styles.tableCellText, { textAlign: 'center' }]}>{item.quantidade}</Text>
              </View>
              <View style={styles.colUnit}>
                <Text style={[styles.tableCellText, { textAlign: 'right' }]}>
                  {formatCurrency(item.valor_unitario)}
                </Text>
              </View>
              <View style={styles.colTotal}>
                <Text style={[styles.tableCellText, { textAlign: 'right' }]}>
                  {formatCurrency(item.quantidade * item.valor_unitario)}
                </Text>
              </View>
            </View>
          ))}

          {/* Total */}
          <View style={styles.tableRowTotal}>
            <View style={styles.colDesc}>
              <Text style={styles.tableCellBold}>VALOR TOTAL</Text>
            </View>
            <View style={styles.colQtd}>
              <Text style={[styles.tableCellText, { textAlign: 'center' }]}>1</Text>
            </View>
            <View style={styles.colUnit}>
              <Text style={styles.tableCellText}></Text>
            </View>
            <View style={styles.colTotal}>
              <Text style={[styles.tableCellHighlight, { textAlign: 'right' }]}>
                {formatCurrency(total)}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.text, { marginTop: 15 }]}>
          Importa a presente proposta o valor final total de{' '}
          <Text style={styles.highlight}>{formatCurrency(total)}</Text> ({valorPorExtenso(total)}).
        </Text>
      </View>
      <PageFooterMarcos styles={styles} />
    </Page>
  );
};

// PÁGINA 7: CONDIÇÕES GERAIS DE VENDA
const TermsPage: React.FC<{ data: PropostaData; styles: PropostaStyles }> = ({ data, styles }) => {
  const restante = 100 - parseInt(data.entradaPercentual || '50');

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.contentContainer}>
        <PageHeader styles={styles} />
        <Text style={styles.sectionTitle}>5- CONDIÇÕES GERAIS DE VENDA</Text>

        <Text style={styles.clauseNumber}>5.1 - DATA BASE DA PROPOSTA</Text>
        <Text style={styles.clauseText}>{formatDate(data.dataEmissao)}</Text>

        <Text style={styles.clauseNumber}>5.2 - CONDIÇÕES DE PAGAMENTO</Text>
        <Text style={styles.clauseText}>
          {data.entradaPercentual}% de entrada no ato da contratação. {restante}% restante ao término 
          da obra, mediante nota fiscal e/ou boleto bancário.
        </Text>

        <Text style={styles.clauseNumber}>5.3 - IMPOSTOS</Text>
        <Text style={styles.clauseText}>
          A Peperaio Comunicação Visual é optante pelo Simples Nacional. CNPJ: 34.004.933/0001-79. 
          Todos os impostos já estão inclusos no valor da proposta.
        </Text>

        <Text style={styles.clauseNumber}>5.4 - PRAZO DE ENTREGA</Text>
        <Text style={styles.clauseText}>
          Prazo de produção: {data.prazoProducao || 'A definir'}. 
          {data.prazoInstalacao && ` Prazo de instalação: ${data.prazoInstalacao}.`}
        </Text>

        <Text style={styles.clauseNumber}>5.5 - VALIDADE DESTA PROPOSTA</Text>
        <Text style={styles.clauseText}>
          Esta proposta é válida por {data.validadeProposta || '30 dias'} a partir da data de emissão. 
          Após este período, os valores e condições podem ser alterados sem aviso prévio. 
          A não aprovação dentro do prazo caracteriza cancelamento automático da proposta.
        </Text>

        <Text style={styles.clauseNumber}>5.6 - FRETE E ENTREGA</Text>
        <Text style={styles.clauseText}>
          O frete e a entrega dos materiais estão inclusos no valor da proposta para a região metropolitana. 
          Para outras localidades, será calculado custo adicional de frete mediante consulta.
        </Text>

        <Text style={styles.clauseNumber}>5.7 - LOCAL DE INSTALAÇÃO</Text>
        <Text style={styles.clauseText}>
          O local de instalação deverá estar preparado e acessível para a equipe técnica. 
          Custos adicionais decorrentes de dificuldades de acesso ou necessidade de equipamentos especiais 
          (guindastes, plataformas elevatórias, etc.) serão cobrados à parte mediante orçamento prévio.
        </Text>

        <Text style={styles.clauseNumber}>5.8 - CONDIÇÕES GERAIS DE FORNECIMENTO</Text>
        <Text style={styles.clauseText}>
          O fornecimento será realizado conforme especificações técnicas desta proposta. Alterações 
          solicitadas após aprovação poderão gerar custos adicionais e prazos diferenciados.
        </Text>

        <Text style={styles.clauseNumber}>5.9 - ATRASO NO PAGAMENTO</Text>
        <Text style={styles.clauseText}>
          Em caso de atraso no pagamento, serão cobrados multa de 2% sobre o valor em atraso e juros 
          de 1% ao mês, calculados pro rata die, além de correção monetária pelo IGPM-FGV.
        </Text>

        <Text style={styles.clauseNumber}>5.10 - REAJUSTE DE PREÇOS</Text>
        <Text style={styles.clauseText}>
          Os preços apresentados são fixos durante o prazo de validade desta proposta. Após a aprovação, 
          caso haja atraso na execução por motivos alheios à CONTRATADA, os valores poderão ser reajustados 
          proporcionalmente pela variação do IGPM-FGV ou outro índice que o substitua.
        </Text>

        <Text style={styles.clauseNumber}>5.11 - APROVAÇÃO DE PROJETO</Text>
        <Text style={styles.clauseText}>
          O cliente deverá aprovar formalmente o projeto/arte antes do início da produção. 
          Após a aprovação, alterações solicitadas poderão gerar custos adicionais e alteração de prazos.
        </Text>

        <Text style={styles.clauseNumber}>5.12 - RESPONSABILIDADE POR APROVAÇÕES LEGAIS</Text>
        <Text style={styles.clauseText}>
          É de responsabilidade do cliente obter todas as aprovações e licenças necessárias junto aos órgãos 
          competentes (Prefeitura, Corpo de Bombeiros, Defesa Civil, Condomínio, etc.). A Peperaio poderá 
          auxiliar tecnicamente, mas a responsabilidade legal é do contratante.
        </Text>

        <Text style={styles.clauseNumber}>5.13 - INÍCIO DA PRODUÇÃO</Text>
        <Text style={styles.clauseText}>
          A produção será iniciada somente após: (i) confirmação do pagamento da entrada; 
          (ii) aprovação formal do projeto pelo cliente; (iii) liberação do local para medições/instalação, 
          quando aplicável.
        </Text>

        <Text style={styles.clauseNumber}>5.14 - CASOS FORTUITOS E FORÇA MAIOR</Text>
        <Text style={styles.clauseText}>
          A Peperaio não se responsabiliza por atrasos decorrentes de casos fortuitos ou força maior, 
          tais como: greves, epidemias, pandemias, fenômenos climáticos, falta de energia elétrica, 
          falta de matéria-prima no mercado, ou qualquer outro evento fora de seu controle.
        </Text>

        {data.observacoes && (
          <>
            <Text style={[styles.clauseNumber, { marginTop: 15 }]}>OBSERVAÇÕES</Text>
            <Text style={styles.clauseText}>{data.observacoes}</Text>
          </>
        )}
      </View>
      <PageFooterDefault styles={styles} />
    </Page>
  );
};

// PÁGINA 8: TERMO DE GARANTIA
const WarrantyPage: React.FC<{ styles: PropostaStyles }> = ({ styles }) => (
  <Page size="A4" style={styles.page} wrap={false}>
    <View style={[styles.contentContainer, { paddingBottom: 70 }]}>
      <PageHeader styles={styles} />
      <Text style={styles.sectionTitle}>6- TERMO DE GARANTIA DE PRODUTOS ENGENHADOS</Text>

      <Text style={styles.clauseNumber}>6.1 - Prazo de garantia</Text>
      <Text style={styles.clauseText}>
        A Peperaio Comunicação Visual oferece garantia de 5 (cinco) anos para os produtos engenhados, 
        contados a partir da data de entrega/instalação.
      </Text>

      <Text style={styles.clauseNumber}>6.2 - Mão de obra de montagem</Text>
      <Text style={styles.clauseText}>
        A mão de obra para montagem/desmontagem em caso de acionamento da garantia fica a cargo do cliente.
      </Text>

      <Text style={styles.clauseNumber}>6.3 - Prazo para análise</Text>
      <Text style={styles.clauseText}>
        A Peperaio terá prazo de 30 (trinta) dias para análise e reparo do produto em garantia.
      </Text>

      <Text style={styles.clauseNumber}>6.4 - Procedimento para acionar garantia</Text>
      <Text style={styles.clauseText}>
        Para acionar a garantia, o cliente deve entrar em contato através dos canais oficiais, 
        informando o número da proposta e descrevendo o problema encontrado.
      </Text>

      <Text style={styles.clauseNumber}>6.5 - Encaminhamento do produto</Text>
      <Text style={styles.clauseText}>
        O produto deve ser encaminhado pelo cliente até a sede da Peperaio para análise.
      </Text>

      <Text style={styles.clauseNumber}>6.6 - Despesas de transporte</Text>
      <Text style={styles.clauseText}>
        As despesas de transporte do produto para análise e retorno são de responsabilidade do cliente.
      </Text>

      <Text style={styles.clauseNumber}>6.7 - Exclusões da garantia</Text>
      <Text style={styles.clauseText}>
        A garantia não cobre: uso inadequado do produto, alterações realizadas por terceiros, 
        danos causados por fenômenos naturais (raios, vendavais, granizo, enchentes), 
        instalação incorreta, falta de manutenção preventiva, desgaste natural de uso, 
        vandalismo, acidentes, impactos de veículos ou objetos.
      </Text>

      <Text style={styles.clauseNumber}>6.8 - Manutenção Preventiva</Text>
      <Text style={styles.clauseText}>
        Recomenda-se manutenção preventiva anual para garantir a durabilidade e o bom funcionamento 
        dos produtos. A manutenção preventiva deve incluir: limpeza, verificação de fixações, 
        inspeção de componentes elétricos (quando aplicável) e revisão geral do estado do produto.
      </Text>

      <Text style={styles.clauseNumber}>6.9 - Comprovação de Defeito</Text>
      <Text style={styles.clauseText}>
        A garantia somente será válida mediante comprovação de defeito de fabricação por laudo técnico 
        da Peperaio. Defeitos causados por terceiros, instalação inadequada ou uso indevido não são 
        cobertos pela garantia.
      </Text>

      <Text style={styles.clauseNumber}>6.10 - Produtos Substitutos</Text>
      <Text style={styles.clauseText}>
        Em caso de impossibilidade de reparo, a Peperaio se reserva o direito de substituir o produto 
        defeituoso por outro de características iguais ou superiores, a seu exclusivo critério técnico.
      </Text>

      <View style={[styles.signatureBlock, { marginTop: 40 }]}>
        <Text style={[styles.text, { fontStyle: 'italic', marginBottom: 15 }]}>Cordialmente,</Text>
        <Text style={styles.signatureName}>EQUIPE PEPERAIO COMUNICAÇÃO VISUAL</Text>
      </View>
    </View>
    <PageFooterIsaac styles={styles} />
  </Page>
);

// PÁGINA 9: PROTEÇÃO JURÍDICA (Parte 1)
const LegalProtectionPage1: React.FC<{ data: PropostaData; styles: PropostaStyles }> = ({ data, styles }) => {
  return (
    <Page size="A4" style={styles.page} wrap={false}>
      <View style={[styles.contentContainer, { paddingBottom: 70 }]}>
        <PageHeader styles={styles} />
        <Text style={styles.sectionTitle}>7- PROTEÇÃO JURÍDICA E TERMOS CONTRATUAIS</Text>

        {/* Proteção Jurídica - Parte 1 */}
        <View style={styles.protecaoJuridica}>
          <Text style={styles.juridicoTitulo}>DECLARAÇÃO DE ACEITAÇÃO E RESPONSABILIDADES</Text>
          
          <Text style={styles.juridicoParagrafo}>
            Ao assinar esta proposta, o CONTRATANTE declara ter lido, compreendido e aceitar integralmente 
            todas as condições, especificações técnicas, valores, prazos e cláusulas aqui estabelecidas, 
            constituindo este documento instrumento legal e vinculante entre as partes.
          </Text>

          <Text style={styles.juridicoTitulo}>OBRIGAÇÕES DE PAGAMENTO</Text>
          
          <Text style={styles.juridicoParagrafo}>
            O CONTRATANTE compromete-se ao pagamento das parcelas conforme estabelecido na cláusula 5.2 
            (Condições de Pagamento), sendo: {data.entradaPercentual}% de entrada no ato da contratação 
            e o saldo restante conforme acordado. O não cumprimento dos prazos de pagamento implicará 
            na suspensão imediata dos serviços até a regularização.
          </Text>

          <Text style={styles.juridicoParagrafo}>
            Em caso de atraso no pagamento de qualquer parcela, incidirá sobre o valor devido: 
            (i) multa moratória de 2% (dois por cento); 
            (ii) juros de mora de 1% (um por cento) ao mês, calculados pro rata die; 
            (iii) correção monetária pelo IGPM-FGV ou índice que vier a substituí-lo; 
            (iv) honorários advocatícios de 20% (vinte por cento) sobre o valor total do débito, 
            em caso de cobrança judicial ou extrajudicial.
          </Text>

          <Text style={styles.juridicoTitulo}>INADIMPLÊNCIA E RESCISÃO</Text>
          
          <Text style={styles.juridicoParagrafo}>
            O atraso superior a 15 (quinze) dias no pagamento de qualquer parcela faculta à CONTRATADA 
            o direito de suspender a execução dos serviços, sem prejuízo da cobrança das parcelas vencidas 
            acrescidas de multas e juros. O atraso superior a 30 (trinta) dias caracteriza inadimplência 
            grave e faculta à CONTRATADA a rescisão imediata do contrato, com retenção dos valores já pagos 
            a título de perdas e danos, além da cobrança integral do valor remanescente.
          </Text>

          <Text style={styles.juridicoParagrafo}>
            Na hipótese de rescisão por inadimplência do CONTRATANTE, este se obriga ao pagamento de multa 
            compensatória de 30% (trinta por cento) sobre o valor total do contrato, além de indenização 
            por lucros cessantes e danos materiais comprovados, incluindo mas não se limitando a: 
            materiais já adquiridos, horas técnicas despendidas, custos administrativos e prejuízos à 
            programação de outros contratos.
          </Text>

          <Text style={styles.juridicoTitulo}>PROTESTO E NEGATIVAÇÃO</Text>
          
          <Text style={styles.juridicoParagrafo}>
            O CONTRATANTE autoriza expressamente a CONTRATADA a protestar títulos não pagos no vencimento 
            e a incluir seus dados nos órgãos de proteção ao crédito (SPC, SERASA, etc.) em caso de 
            inadimplência superior a 10 (dez) dias, independentemente de notificação prévia, 
            em conformidade com o art. 43 da Lei nº 8.078/90 (Código de Defesa do Consumidor).
          </Text>

          <Text style={styles.juridicoTitulo}>PROPRIEDADE INTELECTUAL</Text>
          
          <Text style={styles.juridicoParagrafo}>
            Todos os projetos, desenhos técnicos, layouts, artes e especificações desenvolvidas pela 
            CONTRATADA são de sua propriedade exclusiva, protegidos pela Lei nº 9.610/98 (Lei de Direitos Autorais). 
            O CONTRATANTE tem direito de uso do produto final, mas não dos arquivos de produção, projetos ou 
            especificações técnicas, salvo acordo expresso em contrário mediante pagamento adicional.
          </Text>

          <Text style={styles.juridicoTitulo}>CONFIDENCIALIDADE</Text>
          
          <Text style={styles.juridicoParagrafo}>
            Todas as informações técnicas, comerciais e financeiras trocadas entre as partes durante a 
            execução deste contrato são consideradas confidenciais e não poderão ser divulgadas a terceiros 
            sem autorização prévia e expressa da outra parte, sob pena de indenização por perdas e danos.
          </Text>

          <Text style={styles.juridicoTitulo}>RESPONSABILIDADE CIVIL E SEGUROS</Text>
          
          <Text style={styles.juridicoParagrafo}>
            A CONTRATADA possui seguro de responsabilidade civil para cobrir eventuais danos causados 
            durante a execução dos serviços. O CONTRATANTE deve providenciar seguro próprio para o 
            patrimônio instalado após a entrega, ficando a CONTRATADA isenta de responsabilidade por 
            sinistros ocorridos após o aceite final.
          </Text>
        </View>
      </View>
      <PageFooterDefault styles={styles} />
    </Page>
  );
};

// PÁGINA 10: PROTEÇÃO JURÍDICA (Parte 2) E ASSINATURA
const LegalProtectionPage2: React.FC<{ data: PropostaData; styles: PropostaStyles }> = ({ data, styles }) => {
  const total = calcularTotal(data.itens);
  
  return (
    <Page size="A4" style={styles.page} wrap={false}>
      <View style={[styles.contentContainer, { paddingBottom: 70 }]}>
        <PageHeader styles={styles} />
        <Text style={styles.sectionTitle}>7- PROTEÇÃO JURÍDICA E TERMOS CONTRATUAIS (CONTINUAÇÃO)</Text>

        {/* Proteção Jurídica - Parte 2 */}
        <View style={styles.protecaoJuridica}>
          <Text style={styles.juridicoTitulo}>VALIDADE E CONDIÇÕES ESPECIAIS</Text>
          
          <Text style={styles.juridicoParagrafo}>
            Esta proposta tem validade de {data.validadeProposta || '30 dias'}. Após este prazo, 
            os valores, prazos e condições poderão ser reajustados sem aviso prévio. A não manifestação 
            do CONTRATANTE dentro do prazo de validade implica em cancelamento automático da proposta, 
            não gerando qualquer direito ou obrigação para as partes.
          </Text>

          <Text style={styles.juridicoParagrafo}>
            Alterações solicitadas após a aprovação da proposta que impliquem em modificação de escopo, 
            materiais, prazos ou especificações técnicas serão objeto de aditivo contratual e poderão 
            gerar custos adicionais, a serem orçados separadamente.
          </Text>

          <Text style={styles.juridicoTitulo}>FORO E LEGISLAÇÃO APLICÁVEL</Text>
          
          <Text style={styles.juridicoParagrafo}>
            As partes elegem o foro da comarca de Brasília/DF como competente para dirimir quaisquer 
            questões oriundas deste instrumento, com exclusão de qualquer outro, por mais privilegiado 
            que seja. Este contrato rege-se pelas leis da República Federativa do Brasil, aplicando-se 
            subsidiariamente as disposições do Código Civil (Lei nº 10.406/2002), Código de Defesa do 
            Consumidor (Lei nº 8.078/90) e legislação comercial vigente.
          </Text>

          <Text style={styles.juridicoParagrafo}>
            Este documento possui validade legal conforme disposto nos artigos 104, 107, 221 e 425 do 
            Código Civil Brasileiro, na Lei nº 13.874/2019 (Declaração de Direitos de Liberdade Econômica) 
            e na Medida Provisória nº 2.200-2/2001 que institui a Infraestrutura de Chaves Públicas 
            Brasileira (ICP-Brasil), tendo força de título executivo extrajudicial.
          </Text>

          <Text style={styles.juridicoTitulo}>COMUNICAÇÕES E NOTIFICAÇÕES</Text>
          
          <Text style={styles.juridicoParagrafo}>
            Todas as comunicações e notificações relacionadas a este contrato deverão ser realizadas 
            por escrito, através de e-mail com confirmação de leitura, carta registrada ou entrega pessoal 
            mediante protocolo. Consideram-se válidos os seguintes canais: para a CONTRATADA, o e-mail 
            contato@peperaiovisual.com.br; para o CONTRATANTE, os dados informados no cadastro.
          </Text>

          <Text style={styles.juridicoTitulo}>ANTICORRUPÇÃO E COMPLIANCE</Text>
          
          <Text style={styles.juridicoParagrafo}>
            As partes declaram conhecer e se comprometem a cumprir integralmente as disposições da 
            Lei nº 12.846/2013 (Lei Anticorrupção) e demais normas correlatas, abstendo-se de praticar 
            atos de corrupção, suborno, fraude ou quaisquer condutas ilícitas. O descumprimento desta 
            cláusula enseja rescisão imediata do contrato, sem prejuízo das sanções legais cabíveis.
          </Text>

          <Text style={styles.juridicoTitulo}>DISPOSIÇÕES GERAIS</Text>
          
          <Text style={styles.juridicoParagrafo}>
            A tolerância de qualquer das partes quanto ao descumprimento de quaisquer obrigações ora assumidas 
            não implicará em novação, renúncia de direitos ou alteração das condições pactuadas. Nenhuma 
            modificação deste instrumento terá validade se não for formalizada por escrito e assinada por 
            ambas as partes.
          </Text>

          <Text style={styles.juridicoParagrafo}>
            Se qualquer disposição deste contrato for considerada inválida ou inexequível, as demais 
            cláusulas permanecerão em pleno vigor e efeito. As partes se comprometem a negociar de boa-fé 
            a substituição da cláusula inválida por outra que preserve, na medida do possível, a intenção 
            original das partes.
          </Text>
        </View>

        {/* Campo de Assinatura */}
        <View style={styles.assinaturaContainer} wrap={false}>
          <Text style={styles.assinaturaTitulo}>Aceite e Aprovação da Proposta</Text>
          
          <View style={styles.assinaturaLinha} />
          
          <Text style={styles.assinaturaTexto}>
            ASSINATURA DO CONTRATANTE
          </Text>
          <Text style={styles.assinaturaTexto}>
            {data.cliente || '_____________________________________'}
          </Text>
          <Text style={styles.assinaturaTexto}>
            CPF/CNPJ: _____________________________________
          </Text>
          
          <Text style={styles.assinaturaData}>
            Data: _____ / _____ / _________
          </Text>

          <Text style={[styles.juridicoParagrafo, { marginTop: 20, textAlign: 'center' }]}>
            Ao assinar este documento, declaro ter lido e concordado com todos os termos, condições, 
            valores (Valor Total: {formatCurrency(total)}) e cláusulas estabelecidas nesta proposta 
            comercial nº {data.numeroProposta}, datada de {formatDate(data.dataEmissao)}.
          </Text>
        </View>
      </View>
      <PageFooterDefault styles={styles} />
    </Page>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL DO PDF
// =============================================================================

interface PropostaPDFProps {
  data: PropostaData;
  theme?: PropostaTheme;
}

const PropostaPDF: React.FC<PropostaPDFProps> = ({ data, theme = 'dark' }) => {
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <Document>
      <CoverPage styles={styles} />
      <SummaryPage styles={styles} />
      <ProposalIntroPage data={data} styles={styles} />
      <ScopePage data={data} styles={styles} />
      <ExclusionsPage styles={styles} />
      <PricingPage data={data} styles={styles} />
      <TermsPage data={data} styles={styles} />
      <WarrantyPage styles={styles} />
      <LegalProtectionPage1 data={data} styles={styles} />
      <LegalProtectionPage2 data={data} styles={styles} />
    </Document>
  );
};

export default PropostaPDF;
