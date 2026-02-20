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

export interface ReciboPagamentoData {
  numeroRecibo: string;
  dataEmissao: string;
  beneficiario: {
    nome: string;
    documento?: string;
    endereco?: string;
    telefone?: string;
  };
  pagador: {
    nome: string;
    documento: string;
    endereco?: string;
  };
  valor: number;
  descricao: string;
  obra?: string;
  formaPagamento: string;
  observacoes?: string;
  geradoPor: string;
  horaGeracao: string;
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

const valorPorExtenso = (valor: number): string => {
  // Implementação simplificada - em produção use uma biblioteca
  const parteInteira = Math.floor(valor);
  const centavos = Math.round((valor - parteInteira) * 100);
  
  return `${formatCurrency(valor)} (${parteInteira} reais${centavos > 0 ? ` e ${centavos} centavos` : ''})`;
};

// =============================================================================
// ESTILOS - Tema Italiano Escuro
// =============================================================================

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#181818',
    color: '#E0E0E0',
    fontFamily: 'Helvetica',
    padding: 0,
  },
  contentContainer: {
    paddingHorizontal: 40,
    paddingTop: 40,
    paddingBottom: 100,
  },

  // HEADER
  header: {
    marginBottom: 25,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stripesWrapper: {
    flexDirection: 'column',
    marginTop: 8,
    gap: 3,
  },
  stripeGreen: { height: 4, backgroundColor: '#009B3A' },
  stripeWhite: { height: 4, backgroundColor: '#FFFFFF' },
  stripeRed: { height: 4, backgroundColor: '#CF2734' },

  // TÍTULO DO RECIBO
  reciboTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 3,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  reciboNumero: {
    fontSize: 11,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 30,
  },

  // CAIXA DE VALOR
  valorBox: {
    backgroundColor: '#222222',
    padding: 20,
    borderRadius: 6,
    marginBottom: 30,
    borderLeft: 4,
    borderLeftColor: '#009B3A',
    alignItems: 'center',
  },
  valorLabel: {
    fontSize: 10,
    color: '#888888',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  valorNumero: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#009B3A',
    marginBottom: 8,
  },
  valorExtenso: {
    fontSize: 10,
    color: '#CCCCCC',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // SEÇÃO DE DADOS
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 1,
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dataLabel: {
    fontSize: 9,
    color: '#888888',
    width: '30%',
    textTransform: 'uppercase',
  },
  dataValue: {
    fontSize: 9,
    color: '#FFFFFF',
    width: '70%',
  },

  // TEXTO DECLARAÇÃO
  declaracao: {
    backgroundColor: '#222222',
    padding: 15,
    borderRadius: 4,
    marginVertical: 25,
    borderTop: 2,
    borderTopColor: '#C8E600',
  },
  declaracaoText: {
    fontSize: 10,
    color: '#CCCCCC',
    lineHeight: 1.6,
    textAlign: 'justify',
  },

  // TEXTO JURÍDICO
  textoJuridico: {
    marginVertical: 20,
    padding: 15,
    backgroundColor: '#1E1E1E',
    borderRadius: 4,
    borderLeft: 3,
    borderLeftColor: '#CF2734',
  },
  textoJuridicoWrapper: {
    minPresenceAhead: 100,
  },
  juridicoParagrafo: {
    fontSize: 8,
    color: '#AAAAAA',
    lineHeight: 1.5,
    marginBottom: 8,
    textAlign: 'justify',
  },
  juridicoTitulo: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
    marginBottom: 5,
  },

  // ASSINATURA
  assinaturaSection: {
    marginTop: 40,
  },
  assinaturaBox: {
    borderTop: 1,
    borderTopColor: '#444444',
    paddingTop: 15,
    alignItems: 'center',
  },
  assinaturaLinha: {
    width: '70%',
    borderTop: 1,
    borderTopColor: '#FFFFFF',
    marginBottom: 8,
    height: 40,
  },
  assinaturaNome: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  assinaturaDocumento: {
    fontSize: 9,
    color: '#888888',
  },
  assinaturaData: {
    fontSize: 8,
    color: '#666666',
    marginTop: 10,
  },

  // RODAPÉ
  pageFooter: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pageFooterText: {
    fontSize: 7,
    color: '#666666',
    marginBottom: 1,
    textAlign: 'center',
  },
  pageFooterBold: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});

// =============================================================================
// COMPONENTE
// =============================================================================

const ReciboPagamentoPDF: React.FC<{ data: ReciboPagamentoData }> = ({ data }) => {
  const Footer = () => (
    <View style={styles.pageFooter} fixed>
      <Text style={styles.pageFooterBold}>PEPERAIO</Text>
      <Text style={styles.pageFooterText}>Recibo de Pagamento • Documento Válido</Text>
      <Text style={styles.pageFooterText}>
        Gerado em {data.dataEmissao} às {data.horaGeracao} por {data.geradoPor}
      </Text>
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logoText}>PEPERAIO</Text>
            <View style={styles.stripesWrapper}>
              <View style={styles.stripeGreen} />
              <View style={styles.stripeWhite} />
              <View style={styles.stripeRed} />
            </View>
          </View>

          {/* Título */}
          <Text style={styles.reciboTitle}>Recibo de Pagamento</Text>
          <Text style={styles.reciboNumero}>Nº {data.numeroRecibo}</Text>

          {/* Valor em Destaque */}
          <View style={styles.valorBox}>
            <Text style={styles.valorLabel}>Valor Recebido</Text>
            <Text style={styles.valorNumero}>{formatCurrency(data.valor)}</Text>
            <Text style={styles.valorExtenso}>({valorPorExtenso(data.valor)})</Text>
          </View>

          {/* Dados do Beneficiário */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Beneficiário (Recebedor)</Text>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Nome:</Text>
              <Text style={styles.dataValue}>{data.beneficiario.nome}</Text>
            </View>
            {data.beneficiario.documento && (
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Documento:</Text>
                <Text style={styles.dataValue}>{data.beneficiario.documento}</Text>
              </View>
            )}
            {data.beneficiario.endereco && (
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Endereço:</Text>
                <Text style={styles.dataValue}>{data.beneficiario.endereco}</Text>
              </View>
            )}
            {data.beneficiario.telefone && (
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Telefone:</Text>
                <Text style={styles.dataValue}>{data.beneficiario.telefone}</Text>
              </View>
            )}
          </View>

          {/* Dados do Pagador */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pagador (Emissor)</Text>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Nome:</Text>
              <Text style={styles.dataValue}>{data.pagador.nome}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Documento:</Text>
              <Text style={styles.dataValue}>{data.pagador.documento}</Text>
            </View>
            {data.pagador.endereco && (
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Endereço:</Text>
                <Text style={styles.dataValue}>{data.pagador.endereco}</Text>
              </View>
            )}
          </View>

          {/* Declaração de Recebimento */}
          <View style={styles.declaracao}>
            <Text style={styles.declaracaoText}>
              Recebi do(a) Sr.(a) {data.pagador.nome}, portador(a) do CPF/CNPJ nº {data.pagador.documento}, 
              a quantia de {formatCurrency(data.valor)} ({valorPorExtenso(data.valor)}), 
              referente a {data.descricao}
              {data.obra && ` executado(a) na obra/empreendimento denominado(a) "${data.obra}"`}, 
              mediante pagamento efetuado através de {data.formaPagamento}.
            </Text>
            <Text style={[styles.declaracaoText, { marginTop: 10 }]}>
              Por este recibo, dou plena, geral e irrevogável quitação do valor acima especificado, 
              para nada mais reclamar a qualquer título, seja a que tempo for, relativamente ao objeto deste recibo, 
              nesta data de {data.dataEmissao}.
            </Text>
          </View>

          {/* Informações Adicionais */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações do Pagamento</Text>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Data de Emissão:</Text>
              <Text style={styles.dataValue}>{data.dataEmissao}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Descrição:</Text>
              <Text style={styles.dataValue}>{data.descricao}</Text>
            </View>
            {data.obra && (
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Obra:</Text>
                <Text style={styles.dataValue}>{data.obra}</Text>
              </View>
            )}
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Forma de Pagamento:</Text>
              <Text style={styles.dataValue}>{data.formaPagamento}</Text>
            </View>
            {data.observacoes && (
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Observações:</Text>
                <Text style={styles.dataValue}>{data.observacoes}</Text>
              </View>
            )}
          </View>

          {/* Texto Jurídico de Proteção */}
          <View style={styles.textoJuridico} wrap={false}>
            <Text style={styles.juridicoTitulo}>DECLARAÇÃO DE QUITAÇÃO E PROTEÇÃO LEGAL</Text>
            
            <Text style={styles.juridicoParagrafo}>
              Este recibo tem força de documento legal conforme Art. 319 do Código Civil Brasileiro, 
              servindo como prova de pagamento e quitação da obrigação.
            </Text>

            <Text style={styles.juridicoParagrafo}>
              O beneficiário declara ter recebido o valor acima mencionado de forma integral, 
              dando plena quitação ao pagador quanto à obrigação descrita neste documento.
            </Text>

            <Text style={styles.juridicoParagrafo}>
              Declaro ainda que o valor recebido refere-se exclusivamente ao serviço/obrigação descrito neste recibo, 
              não havendo qualquer outro valor a receber relacionado a este pagamento.
            </Text>

            <Text style={styles.juridicoParagrafo}>
              Este documento foi gerado eletronicamente e possui a mesma validade legal de um documento físico, 
              conforme disposto na Lei nº 13.874/2019 (Lei da Liberdade Econômica) e na Medida Provisória nº 2.200-2/2001 
              que institui a Infraestrutura de Chaves Públicas Brasileira (ICP-Brasil).
            </Text>

            <Text style={styles.juridicoParagrafo}>
              Em caso de extravio deste recibo, o beneficiário compromete-se a comunicar imediatamente o pagador 
              e lavrar boletim de ocorrência, sob pena de responder civil e criminalmente por eventual uso indevido.
            </Text>

            <Text style={styles.juridicoParagrafo}>
              O beneficiário declara-se ciente de suas obrigações tributárias decorrentes deste recebimento, 
              responsabilizando-se integralmente pela declaração do valor recebido aos órgãos competentes.
            </Text>
          </View>

          {/* Assinatura */}
          <View style={styles.assinaturaSection} wrap={false}>
            <View style={styles.assinaturaBox}>
              <View style={styles.assinaturaLinha} />
              <Text style={styles.assinaturaNome}>{data.beneficiario.nome}</Text>
              {data.beneficiario.documento && (
                <Text style={styles.assinaturaDocumento}>{data.beneficiario.documento}</Text>
              )}
              <Text style={styles.assinaturaData}>
                Assinado em {data.dataEmissao}
              </Text>
            </View>
          </View>
        </View>

        <Footer />
      </Page>
    </Document>
  );
};

export default ReciboPagamentoPDF;
