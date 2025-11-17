import axios from 'axios';
import { Incendio } from '../types';
import { getSetorById } from '../config/setores';
import { getDisciplinaName, getSeveridadeName } from '../utils/colors';
import { getUserName } from './firestore';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

// Configurações da Evolution API (serão lidas de variáveis de ambiente)
// Nota: EVOLUTION_API_URL não é mais necessária no frontend - usamos proxy do Vercel (/api/whatsapp/send)
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || '';
const EVOLUTION_INSTANCE_NAME = import.meta.env.VITE_EVOLUTION_INSTANCE_NAME || '';
const WHATSAPP_GROUP_ID = import.meta.env.VITE_WHATSAPP_GROUP_ID || '';

/**
 * Envia mensagem para o grupo do WhatsApp quando um incêndio é criado
 */
export const sendIncendioWhatsAppMessage = async (incendio: Incendio): Promise<void> => {
  try {
    // Debug: Verificar variáveis de ambiente
    console.log('🔍 Debug WhatsApp - Verificando configurações...', {
      EVOLUTION_INSTANCE_NAME,
      WHATSAPP_GROUP_ID,
      temApiKey: !!EVOLUTION_API_KEY,
    });

    // Verificar se as configurações básicas estão disponíveis
    // Nota: EVOLUTION_API_URL não é mais necessária no frontend, pois usamos proxy do Vercel
    if (!EVOLUTION_INSTANCE_NAME || !WHATSAPP_GROUP_ID) {
      console.warn('❌ Configurações do WhatsApp não encontradas. Mensagem não será enviada.');
      console.warn('Variáveis faltando:', {
        EVOLUTION_INSTANCE_NAME: !EVOLUTION_INSTANCE_NAME,
        WHATSAPP_GROUP_ID: !WHATSAPP_GROUP_ID,
      });
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
    // Remover caracteres problemáticos e normalizar quebras de linha
    const sanitizeText = (text: string): string => {
      return text
        .replace(/\r\n/g, '\n') // Normalizar quebras de linha
        .replace(/\r/g, '\n')   // Normalizar CR
        .replace(/\n{3,}/g, '\n\n') // Máximo 2 quebras consecutivas
        .replace(/[^\x20-\x7E\n\u00A0-\uFFFF]/g, '') // Remover caracteres não imprimíveis (exceto quebras de linha e unicode)
        .trim();
    };

    const mensagem = sanitizeText(`🔥 *NOVO INCÊNDIO REGISTRADO* 🔥

*Criador:* ${criadorNome}
*Setor:* ${setorNome}
*Disciplina:* ${getDisciplinaName(incendio.disciplina)}
*Severidade:* ${incendio.severidade} - ${getSeveridadeName(incendio.severidade)}
*Responsável:* ${incendio.responsavel || 'Não informado'}
*Data do Incêndio:* ${formatDate(incendio.dataAconteceu)}
*Data a ser Apagada:* ${formatDate(incendio.dataPretendeApagar)}
*É Gargalo:* ${incendio.isGargalo ? 'Sim' : 'Não'}
*Descrição:*
${incendio.descricao || 'Sem descrição'}

━━━━━━━━━━━━━━━━━━━━
📋 Sistema INCÊNDIO`);

    // IMPORTANTE: Sempre usar o proxy do Vercel para evitar CORS
    // O proxy faz a requisição do lado do servidor (sem problema de CORS)
    const apiUrl = '/api/whatsapp/send';
    console.log('📤 Enviando mensagem WhatsApp via proxy do Vercel...', {
      url: apiUrl,
      grupo: WHATSAPP_GROUP_ID,
      instancia: EVOLUTION_INSTANCE_NAME,
      metodo: 'POST /api/whatsapp/send (proxy serverless)',
    });

    // Configurar timeout reduzido e fazer requisição de forma não-bloqueante
    // A Evolution API pode estar com problemas, então não vamos esperar muito
    const startTime = Date.now();
    
    // Usar Promise.race para garantir que não trave por muito tempo
    // Agora fazemos requisição para o proxy do Vercel (mesmo domínio, sem CORS)
    const requestPromise = axios.post(
      apiUrl,
      {
        number: WHATSAPP_GROUP_ID, // ID do grupo (formato: 5511999999999@g.us)
        text: mensagem,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 segundos de timeout (reduzido para não travar)
        validateStatus: (status) => status < 500, // Aceitar status < 500 sem lançar erro
      }
    );
    
    // Timeout de segurança de 12 segundos (maior que o timeout do axios)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout de segurança')), 12000)
    );
    
    const response = await Promise.race([requestPromise, timeoutPromise]) as any;

    const duration = Date.now() - startTime;
    console.log(`📥 Resposta da Evolution API (${duration}ms):`, response.data);

    // Verificar diferentes formatos de resposta da Evolution API
    if (response.status === 200 || response.status === 201) {
      // A Evolution API pode retornar sucesso de diferentes formas
      if (response.data?.status === 'success' || 
          response.data?.key || 
          response.data?.messageId ||
          (response.data && !response.data.error)) {
        console.log('✅ Mensagem WhatsApp enviada com sucesso');
      } else {
        console.warn('⚠️ Resposta inesperada da Evolution API:', response.data);
      }
    } else {
      // Erro 400 - Bad Request - mostrar mensagem de erro específica
      const errorMessage = response.data?.response?.message || response.data?.message || 'Erro desconhecido';
      console.error(`❌ Erro ${response.status} (Bad Request):`, {
        status: response.status,
        error: response.data?.error,
        message: errorMessage,
        fullResponse: response.data,
      });
      
      // Se for erro de validação, mostrar detalhes
      if (Array.isArray(errorMessage)) {
        console.error('Mensagens de erro:', errorMessage);
        
        // Verificar se é erro de sessão
        const sessionError = errorMessage.find((msg: string) => msg.includes('SessionError') || msg.includes('No sessions'));
        if (sessionError) {
          console.error('⚠️ PROBLEMA IDENTIFICADO: A instância do WhatsApp não está conectada!');
          console.error('📋 SOLUÇÕES:');
          console.error('   OPÇÃO 1 - Escanear QR Code:');
          console.error('     1. Acesse http://localhost:8080/manager/');
          console.error('     2. Veja o QR code da instância "incendio-bot"');
          console.error('     3. Escaneie com seu WhatsApp');
          console.error('     4. Aguarde alguns segundos para a sessão ser estabelecida');
          console.error('');
          console.error('   OPÇÃO 2 - Deletar e recriar a instância:');
          console.error('     Se o QR code não funcionar, pode ser necessário deletar');
          console.error('     e recriar a instância completamente');
          console.error('');
          console.error('   NOTA: O sistema continuará funcionando normalmente.');
          console.error('   As mensagens serão enviadas assim que a sessão for estabelecida.');
        }
      }
    }
  } catch (error: any) {
    // Não bloquear o fluxo se o WhatsApp falhar
    if (error.code === 'ECONNABORTED') {
      console.error('❌ Timeout ao enviar mensagem WhatsApp (API demorou mais de 15s)');
    } else if (error.response) {
      console.error('❌ Erro HTTP ao enviar mensagem WhatsApp:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      });
    } else if (error.request) {
      console.error('❌ Erro de rede ao enviar mensagem WhatsApp (sem resposta do servidor):', error.message);
    } else {
      console.error('❌ Erro ao enviar mensagem WhatsApp:', error.message);
    }
    // Não lançar erro para não interromper a criação do incêndio
  }
};

