export default async function handler(req, res) {
  // Apenas aceitar requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Obter variáveis de ambiente
  const evolutionApiUrl = process.env.VITE_EVOLUTION_API_URL;
  const evolutionApiKey = process.env.VITE_EVOLUTION_API_KEY;
  const instanceName = process.env.VITE_EVOLUTION_INSTANCE_NAME;

  // Verificar se as variáveis estão configuradas
  if (!evolutionApiUrl || !evolutionApiKey || !instanceName) {
    console.error('Variáveis de ambiente não configuradas:', {
      evolutionApiUrl: !!evolutionApiUrl,
      evolutionApiKey: !!evolutionApiKey,
      instanceName: !!instanceName,
    });
    return res.status(500).json({ error: 'Configuração do servidor incompleta' });
  }

  // Obter dados do body
  const { number, text } = req.body;

  if (!number || !text) {
    return res.status(400).json({ error: 'number e text são obrigatórios' });
  }

  try {
    // Remover barra final da URL se houver
    const baseUrl = evolutionApiUrl.endsWith('/') 
      ? evolutionApiUrl.slice(0, -1) 
      : evolutionApiUrl;
    
    // Primeiro, verificar se a instância existe
    const checkInstanceUrl = `${baseUrl}/instance/fetchInstances`;
    console.log('🔍 Verificando instâncias disponíveis...', {
      url: checkInstanceUrl,
      instanceName,
    });

    const checkResponse = await fetch(checkInstanceUrl, {
      method: 'GET',
      headers: {
        'apikey': evolutionApiKey,
      },
    });

    if (checkResponse.ok) {
      const instances = await checkResponse.json();
      console.log('📋 Instâncias disponíveis (formato completo):', JSON.stringify(instances, null, 2));
      
      // Verificar diferentes formatos de resposta da Evolution API
      let instanceExists = false;
      let instanceNames = [];
      
      if (Array.isArray(instances)) {
        // Formato: [{ instance: { instanceName: "..." } }, ...]
        instanceNames = instances.map(inst => {
          if (inst.instance?.instanceName) return inst.instance.instanceName;
          if (inst.instanceName) return inst.instanceName;
          if (typeof inst === 'string') return inst;
          return JSON.stringify(inst);
        });
        
        instanceExists = instances.some(inst => {
          const name = inst.instance?.instanceName || inst.instanceName || inst;
          return String(name).toLowerCase() === String(instanceName).toLowerCase();
        });
      } else if (instances && typeof instances === 'object') {
        // Formato: { data: [...] } ou similar
        const data = instances.data || instances.instances || instances;
        if (Array.isArray(data)) {
          instanceNames = data.map(inst => {
            if (inst.instance?.instanceName) return inst.instance.instanceName;
            if (inst.instanceName) return inst.instanceName;
            return JSON.stringify(inst);
          });
          instanceExists = data.some(inst => {
            const name = inst.instance?.instanceName || inst.instanceName || inst;
            return String(name).toLowerCase() === String(instanceName).toLowerCase();
          });
        }
      }
      
      console.log('🔍 Verificação de instância:', {
        procurada: instanceName,
        encontradas: instanceNames,
        existe: instanceExists,
      });
      
      if (!instanceExists) {
        console.error('❌ Instância não encontrada:', {
          instanceName,
          availableInstances: instanceNames,
          fullResponse: instances,
        });
        return res.status(404).json({ 
          error: 'Instância não encontrada',
          message: `A instância "${instanceName}" não existe.`,
          availableInstances: instanceNames,
          fullResponse: instances
        });
      }
    } else {
      console.warn('⚠️ Não foi possível verificar instâncias:', {
        status: checkResponse.status,
        statusText: checkResponse.statusText,
      });
      // Continuar mesmo assim - pode ser que a API não suporte esse endpoint
    }

    const apiUrl = `${baseUrl}/message/sendText/${instanceName}`;

    console.log('📤 Enviando mensagem WhatsApp via proxy...', {
      url: apiUrl,
      number,
      instanceName,
      apiKeyLength: evolutionApiKey.length,
    });

    // Fazer requisição para Evolution API (do lado do servidor, sem problema de CORS)
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({ number, text }),
    });

    const data = await response.json();

    console.log('📥 Resposta da Evolution API:', {
      status: response.status,
      data,
    });

    // Retornar resposta para o cliente
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem WhatsApp:', error);
    return res.status(500).json({ 
      error: 'Erro ao enviar mensagem WhatsApp',
      message: error.message 
    });
  }
}

