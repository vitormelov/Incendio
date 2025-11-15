import axios from 'axios';
import { Incendio } from '../types';
import { getSetorById } from '../config/setores';
import { getDisciplinaName, getSeveridadeName } from '../utils/colors';
import { getUserName } from './firestore';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

// Configurações da Evolution API (serão lidas de variáveis de ambiente)
const EVOLUTION_API_URL = import.meta.env.VITE_EVOLUTION_API_URL || '';
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || '';
const EVOLUTION_INSTANCE_NAME = import.meta.env.VITE_EVOLUTION_INSTANCE_NAME || '';
const WHATSAPP_GROUP_ID = import.meta.env.VITE_WHATSAPP_GROUP_ID || '';

/**
 * Envia mensagem para o grupo do WhatsApp quando um incêndio é criado
 */
export const sendIncendioWhatsAppMessage = async (incendio: Incendio): Promise<void> => {
  try {
    // Verificar se as configurações estão disponíveis
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME || !WHATSAPP_GROUP_ID) {
      console.warn('Configurações do WhatsApp não encontradas. Mensagem não será enviada.');
      return;
    }

    // Buscar informações adicionais
    const setor = getSetorById(incendio.setor);
    const setorNome = setor?.nome || incendio.setor;

    // Buscar nome do criador
    let criadorNome = 'Usuário desconhecido';
    if (incendio.criadoPor) {
      if (incendio.criadoPor.includes('@')) {
        // É email
        if (incendio.criadoPor === 'projetos@preferencial.eng.br') {
          criadorNome = 'Vitor Viana';
        } else {
          criadorNome = incendio.criadoPor;
        }
      } else {
        // É UID, buscar nome
        const nome = await getUserName(incendio.criadoPor);
        if (nome) {
          criadorNome = nome;
        }
      }
    }

    // Formatar datas
    const formatDate = (dateString: string | null): string => {
      if (!dateString) return 'Não informado';
      try {
        const dateStr = dateString.split('T')[0];
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return format(date, 'dd/MM/yyyy', { locale: ptBR });
      } catch {
        return dateString;
      }
    };

    // Montar mensagem formatada
    const mensagem = `🔥 *NOVO INCÊNDIO REGISTRADO* 🔥

*Criador:* ${criadorNome}
*Setor:* ${setorNome}
*Disciplina:* ${getDisciplinaName(incendio.disciplina)}
*Severidade:* ${incendio.severidade} - ${getSeveridadeName(incendio.severidade)}
*Responsável:* ${incendio.responsavel}
*Data do Incêndio:* ${formatDate(incendio.dataAconteceu)}
*Data a ser Apagada:* ${formatDate(incendio.dataPretendeApagar)}
*É Gargalo:* ${incendio.isGargalo ? '✅ Sim' : '❌ Não'}
*Descrição:*
${incendio.descricao}

━━━━━━━━━━━━━━━━━━━━
📋 Sistema INCÊNDIO`;

    // Enviar mensagem via Evolution API
    // Formato correto para Evolution API v2+
    const response = await axios.post(
      `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`,
      {
        number: WHATSAPP_GROUP_ID, // ID do grupo (formato: 5511999999999@g.us)
        text: mensagem,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY,
        },
      }
    );

    if (response.data && response.data.status === 'success') {
      console.log('Mensagem WhatsApp enviada com sucesso');
    } else {
      console.warn('Resposta inesperada da Evolution API:', response.data);
    }
  } catch (error: any) {
    // Não bloquear o fluxo se o WhatsApp falhar
    console.error('Erro ao enviar mensagem WhatsApp:', error.response?.data || error.message);
    // Não lançar erro para não interromper a criação do incêndio
  }
};

