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
    
    const apiUrl = `${baseUrl}/message/sendText/${instanceName}`;

    console.log('📤 Enviando mensagem WhatsApp via proxy...', {
      url: apiUrl,
      number,
      instanceName,
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

