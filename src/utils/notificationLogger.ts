import supabase from '../lib/supabaseClient';

type NotificationPayload = {
  tipo: 'financeiro' | 'proposta' | 'obra' | 'pagamento' | 'divida' | 'compromisso';
  titulo: string;
  mensagem: string;
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';
  link?: string;
  metadata?: Record<string, unknown>;
};

export const registrarNotificacao = async (payload: NotificationPayload) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date().toISOString();

    await supabase
      .from('notificacoes')
      .insert([
        {
          user_id: user.id,
          tipo: payload.tipo,
          titulo: payload.titulo,
          mensagem: payload.mensagem,
          prioridade: payload.prioridade || 'baixa',
          lida: false,
          link: payload.link,
          metadata: payload.metadata,
          data_referencia: now,
          created_at: now,
        },
      ]);
  } catch (err) {
    console.warn('Aviso: não foi possível registrar notificação:', err);
  }
};
