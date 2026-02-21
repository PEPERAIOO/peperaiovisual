import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabaseClient';
import { addDays, differenceInDays, parseISO, startOfDay } from 'date-fns';

// =============================================================================
// TIPOS
// =============================================================================

export type NotificationType = 
  | 'compromisso' 
  | 'divida' 
  | 'financeiro' 
  | 'proposta'
  | 'obra'
  | 'pagamento';

export type NotificationPriority = 'baixa' | 'media' | 'alta' | 'urgente';

export interface Notification {
  id: string;
  tipo: NotificationType;
  titulo: string;
  mensagem: string;
  data_referencia: Date;
  dias_antecedencia: number;
  prioridade: NotificationPriority;
  lida: boolean;
  link?: string;
  metadata?: Record<string, unknown>;
  created_at: Date;
}

// =============================================================================
// HOOK DE NOTIFICAÇÕES
// =============================================================================

export const useNotifications = () => {
  const { user } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Determina a prioridade baseada nos dias restantes
   */
  const getPrioridade = useCallback((diasRestantes: number): NotificationPriority => {
    if (diasRestantes < 0) return 'urgente'; // Vencido
    if (diasRestantes === 0) return 'urgente'; // Hoje
    if (diasRestantes <= 2) return 'alta';
    if (diasRestantes <= 5) return 'media';
    return 'baixa';
  }, []);

  /**
   * Carrega compromissos próximos (5 dias de antecedência)
   */
  const carregarCompromissos = useCallback(async (): Promise<Notification[]> => {
    if (!user) return [];

    try {
      const dataLimite = addDays(startOfDay(new Date()), 5);

      const { data, error } = await supabase
        .from('compromissos')
        .select('*')
        .eq('user_id', user.id)
        .gte('data_hora', startOfDay(new Date()).toISOString())
        .lte('data_hora', dataLimite.toISOString())
        .order('data_hora', { ascending: true });

      if (error) throw error;

      return (data || []).map((comp) => {
        const dataCompromisso = parseISO(comp.data_hora);
        const diasRestantes = differenceInDays(dataCompromisso, startOfDay(new Date()));

        return {
          id: `compromisso-${comp.id}`,
          tipo: 'compromisso',
          titulo: comp.titulo,
          mensagem: `${comp.titulo} - ${comp.local || 'Local não informado'}`,
          data_referencia: dataCompromisso,
          dias_antecedencia: diasRestantes,
          prioridade: getPrioridade(diasRestantes),
          lida: false,
          link: `/calendario`,
          metadata: { compromisso_id: comp.id },
          created_at: new Date(),
        };
      });
    } catch (err) {
      console.error('Erro ao carregar compromissos:', err);
      return [];
    }
  }, [user, getPrioridade]);

  /**
   * Carrega dívidas próximas ao vencimento (5 dias de antecedência)
   */
  const carregarDividas = useCallback(async (): Promise<Notification[]> => {
    if (!user) return [];

    try {
      const dataLimite = addDays(startOfDay(new Date()), 5);

      const { data, error } = await supabase
        .from('dividas')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pendente')
        .gte('data_vencimento', startOfDay(new Date()).toISOString())
        .lte('data_vencimento', dataLimite.toISOString())
        .order('data_vencimento', { ascending: true });

      if (error) throw error;

      return (data || []).map((divida) => {
        const dataVencimento = parseISO(divida.data_vencimento);
        const diasRestantes = differenceInDays(dataVencimento, startOfDay(new Date()));

        return {
          id: `divida-${divida.id}`,
          tipo: 'divida',
          titulo: `Dívida: ${divida.descricao}`,
          mensagem: `Vencimento: R$ ${divida.valor.toFixed(2)} - ${divida.credor || 'Credor não informado'}`,
          data_referencia: dataVencimento,
          dias_antecedencia: diasRestantes,
          prioridade: getPrioridade(diasRestantes),
          lida: false,
          link: `/dividas`,
          metadata: { divida_id: divida.id },
          created_at: new Date(),
        };
      });
    } catch (err) {
      console.error('Erro ao carregar dívidas:', err);
      return [];
    }
  }, [user, getPrioridade]);

  /**
   * Carrega parcelas de dívidas próximas ao vencimento
   */
  const carregarParcelas = useCallback(async (): Promise<Notification[]> => {
    if (!user) return [];

    try {
      const dataLimite = addDays(startOfDay(new Date()), 5);

      const { data, error } = await supabase
        .from('dividas_parcelas')
        .select(`
          *,
          dividas (
            descricao,
            credor
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pendente')
        .gte('data_vencimento', startOfDay(new Date()).toISOString())
        .lte('data_vencimento', dataLimite.toISOString())
        .order('data_vencimento', { ascending: true });

      if (error) throw error;

      return (data || []).map((parcela: any) => {
        const dataVencimento = parseISO(parcela.data_vencimento);
        const diasRestantes = differenceInDays(dataVencimento, startOfDay(new Date()));

        return {
          id: `parcela-${parcela.id}`,
          tipo: 'divida',
          titulo: `Parcela ${parcela.numero_parcela}: ${parcela.dividas?.descricao || 'Dívida'}`,
          mensagem: `Vencimento: R$ ${parcela.valor.toFixed(2)} - ${parcela.dividas?.credor || 'Credor não informado'}`,
          data_referencia: dataVencimento,
          dias_antecedencia: diasRestantes,
          prioridade: getPrioridade(diasRestantes),
          lida: false,
          link: `/dividas`,
          metadata: { parcela_id: parcela.id, divida_id: parcela.divida_id },
          created_at: new Date(),
        };
      });
    } catch (err) {
      console.error('Erro ao carregar parcelas:', err);
      return [];
    }
  }, [user, getPrioridade]);

  /**
   * Carrega transações financeiras próximas ao vencimento
   */
  const carregarTransacoesVencimento = useCallback(async (): Promise<Notification[]> => {
    if (!user) return [];

    try {
      const dataLimite = addDays(startOfDay(new Date()), 5);

      const { data, error } = await supabase
        .from('transacoes')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pendente')
        .eq('tipo', 'despesa')
        .gte('data_vencimento', startOfDay(new Date()).toISOString())
        .lte('data_vencimento', dataLimite.toISOString())
        .order('data_vencimento', { ascending: true });

      if (error) throw error;

      return (data || []).map((transacao) => {
        const dataVencimento = parseISO(transacao.data_vencimento);
        const diasRestantes = differenceInDays(dataVencimento, startOfDay(new Date()));

        return {
          id: `transacao-${transacao.id}`,
          tipo: 'financeiro',
          titulo: `Despesa: ${transacao.descricao}`,
          mensagem: `Vencimento: R$ ${transacao.valor.toFixed(2)} - ${transacao.categoria || 'Sem categoria'}`,
          data_referencia: dataVencimento,
          dias_antecedencia: diasRestantes,
          prioridade: getPrioridade(diasRestantes),
          lida: false,
          link: `/financeiro`,
          metadata: { transacao_id: transacao.id },
          created_at: new Date(),
        };
      });
    } catch (err) {
      console.error('Erro ao carregar transações:', err);
      return [];
    }
  }, [user, getPrioridade]);

  /**
   * Carrega propostas próximas ao vencimento da validade
   */
  const carregarPropostasVencimento = useCallback(async (): Promise<Notification[]> => {
    if (!user) return [];

    try {
      const dataLimite = addDays(startOfDay(new Date()), 5);

      const { data, error } = await supabase
        .from('propostas')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['enviada', 'em_analise'])
        .gte('data_validade', startOfDay(new Date()).toISOString())
        .lte('data_validade', dataLimite.toISOString())
        .order('data_validade', { ascending: true });

      if (error) throw error;

      return (data || []).map((proposta) => {
        const dataValidade = parseISO(proposta.data_validade);
        const diasRestantes = differenceInDays(dataValidade, startOfDay(new Date()));

        return {
          id: `proposta-${proposta.id}`,
          tipo: 'proposta',
          titulo: `Proposta: ${proposta.nome_projeto || proposta.cliente}`,
          mensagem: `Validade expira em ${diasRestantes} dia(s) - R$ ${proposta.valor_total.toFixed(2)}`,
          data_referencia: dataValidade,
          dias_antecedencia: diasRestantes,
          prioridade: getPrioridade(diasRestantes),
          lida: false,
          link: `/propostas`,
          metadata: { proposta_id: proposta.id },
          created_at: new Date(),
        };
      });
    } catch (err) {
      console.error('Erro ao carregar propostas:', err);
      return [];
    }
  }, [user, getPrioridade]);

  /**
   * Carrega notificações registradas no sistema (ações importantes)
   */
  const carregarNotificacoesSistema = useCallback(async (): Promise<Notification[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      return (data || []).map((notif) => {
        const dataReferencia = notif.data_referencia ? parseISO(notif.data_referencia) : parseISO(notif.created_at);

        return {
          id: `sistema-${notif.id}`,
          tipo: notif.tipo as NotificationType,
          titulo: notif.titulo,
          mensagem: notif.mensagem,
          data_referencia: dataReferencia,
          dias_antecedencia: 0,
          prioridade: (notif.prioridade as NotificationPriority) || 'baixa',
          lida: !!notif.lida,
          link: notif.link || undefined,
          metadata: notif.metadata || undefined,
          created_at: parseISO(notif.created_at),
        };
      });
    } catch (err) {
      console.warn('Aviso: não foi possível carregar notificações do sistema:', err);
      return [];
    }
  }, [user]);

  /**
   * Carrega todas as notificações
   */
  const carregarNotificacoes = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const [
        compromissos,
        dividas,
        parcelas,
        transacoes,
        propostas,
        sistema,
      ] = await Promise.all([
        carregarCompromissos(),
        carregarDividas(),
        carregarParcelas(),
        carregarTransacoesVencimento(),
        carregarPropostasVencimento(),
        carregarNotificacoesSistema(),
      ]);

      const todasNotificacoes = [
        ...compromissos,
        ...dividas,
        ...parcelas,
        ...transacoes,
        ...propostas,
        ...sistema,
      ].sort((a, b) => {
        // Ordenar por prioridade e depois por data
        const prioridadeOrder = { urgente: 0, alta: 1, media: 2, baixa: 3 };
        if (prioridadeOrder[a.prioridade] !== prioridadeOrder[b.prioridade]) {
          return prioridadeOrder[a.prioridade] - prioridadeOrder[b.prioridade];
        }
        return a.data_referencia.getTime() - b.data_referencia.getTime();
      });

      setNotificacoes(todasNotificacoes);
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [
    user,
    carregarCompromissos,
    carregarDividas,
    carregarParcelas,
    carregarTransacoesVencimento,
    carregarPropostasVencimento,
    carregarNotificacoesSistema,
  ]);

  /**
   * Marcar notificação como lida
   */
  const marcarComoLida = useCallback((id: string) => {
    setNotificacoes((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, lida: true } : notif))
    );
  }, []);

  /**
   * Marcar todas como lidas
   */
  const marcarTodasComoLidas = useCallback(() => {
    setNotificacoes((prev) => prev.map((notif) => ({ ...notif, lida: true })));
  }, []);

  /**
   * Limpar notificações lidas
   */
  const limparLidas = useCallback(() => {
    setNotificacoes((prev) => prev.filter((notif) => !notif.lida));
  }, []);

  // Estatísticas
  const stats = useMemo(() => {
    const naoLidas = notificacoes.filter((n) => !n.lida);
    return {
      total: notificacoes.length,
      naoLidas: naoLidas.length,
      urgentes: naoLidas.filter((n) => n.prioridade === 'urgente').length,
      altas: naoLidas.filter((n) => n.prioridade === 'alta').length,
      medias: naoLidas.filter((n) => n.prioridade === 'media').length,
      baixas: naoLidas.filter((n) => n.prioridade === 'baixa').length,
      porTipo: {
        compromisso: naoLidas.filter((n) => n.tipo === 'compromisso').length,
        divida: naoLidas.filter((n) => n.tipo === 'divida').length,
        financeiro: naoLidas.filter((n) => n.tipo === 'financeiro').length,
        proposta: naoLidas.filter((n) => n.tipo === 'proposta').length,
      },
    };
  }, [notificacoes]);

  // Carregar notificações ao montar e a cada 5 minutos
  useEffect(() => {
    carregarNotificacoes();

    const interval = setInterval(() => {
      carregarNotificacoes();
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [carregarNotificacoes]);

  return {
    notificacoes,
    loading,
    error,
    stats,
    carregarNotificacoes,
    marcarComoLida,
    marcarTodasComoLidas,
    limparLidas,
  };
};
