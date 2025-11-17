# 🔧 Solução Alternativa para CORS - Evolution API

## ❌ Problema

Mesmo com `CORS_ENABLED=true` e `CORS_ORIGIN=*` configurados, o erro de CORS persiste.

## 🔍 Possíveis Causas

1. **Serviço errado configurado** - Você está vendo "devoted-bravery" mas a URL é "incendio-production"
2. **Variáveis não sendo lidas** - A Evolution API pode não estar reconhecendo as variáveis
3. **Serviço não reiniciado** - Precisa forçar restart após adicionar variáveis
4. **Versão da Evolution API** - Pode não suportar essas variáveis de ambiente

---

## ✅ Solução 1: Verificar Serviço Correto

### **Passo 1: Identificar o Serviço Correto**

1. No Railway, veja a lista de serviços
2. Procure pelo serviço que tem a URL: `incendio-production.up.railway.app`
3. **Clique nesse serviço** (não o "devoted-bravery")

### **Passo 2: Configurar CORS no Serviço Correto**

1. Abra o serviço correto (o que corresponde à URL `incendio-production`)
2. Vá em **Variables**
3. Adicione:
   - `CORS_ENABLED` = `true`
   - `CORS_ORIGIN` = `https://bot-incendio.vercel.app` (NÃO use `*`, use a URL específica)
4. Salve

### **Passo 3: Reiniciar Manualmente**

1. No mesmo serviço, vá em **Settings**
2. Procure **"Restart"** ou **"Redeploy"**
3. Clique para forçar reinício
4. Aguarde 2-3 minutos

---

## ✅ Solução 2: Usar Proxy no Vercel (Recomendado)

Se CORS continuar não funcionando, podemos criar um proxy no Vercel para fazer a requisição do lado do servidor.

### **Criar arquivo `vercel.json` (se ainda não tiver):**

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "functions": {
    "api/whatsapp/*.js": {
      "runtime": "nodejs18.x"
    }
  }
}
```

### **Criar API Route no Vercel:**

Crie o arquivo `api/whatsapp/send.js`:

```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { number, text } = req.body;

  const evolutionApiUrl = process.env.VITE_EVOLUTION_API_URL;
  const evolutionApiKey = process.env.VITE_EVOLUTION_API_KEY;
  const instanceName = process.env.VITE_EVOLUTION_INSTANCE_NAME;

  try {
    const response = await fetch(
      `${evolutionApiUrl}/message/sendText/${instanceName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify({ number, text }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Erro ao enviar WhatsApp:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

### **Atualizar `whatsapp.ts` para usar o proxy:**

```typescript
// Em vez de chamar diretamente a Evolution API, chame o proxy Vercel
const apiUrl = '/api/whatsapp/send';

// ... resto do código permanece igual
```

---

## ✅ Solução 3: Configurar CORS via Docker Compose (Railway)

Se o Railway estiver usando Docker Compose, pode ser necessário configurar via `docker-compose.yml`.

### **Verificar se há `docker-compose.yml` no Railway:**

1. No serviço Evolution API, vá em **Settings**
2. Procure **"Source"** ou **"Build"**
3. Veja se usa `docker-compose.yml`

### **Se usar Docker Compose, adicione no arquivo:**

```yaml
services:
  evolution-api:
    environment:
      - CORS_ENABLED=true
      - CORS_ORIGIN=https://bot-incendio.vercel.app,*
      - CORS_CREDENTIALS=true
      - CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
      - CORS_HEADERS=Content-Type,apikey,Authorization
```

---

## ✅ Solução 4: Verificar Logs do Railway

1. No serviço Evolution API correto, vá em **Logs**
2. Procure por erros relacionados a CORS
3. Verifique se a aplicação iniciou com as variáveis:
   - Procure por `CORS_ENABLED` ou `CORS` nos logs
   - Veja se há mensagens de erro

---

## ✅ Solução 5: Testar CORS Diretamente

Abra o terminal e execute:

```bash
curl -X OPTIONS \
  https://incendio-production.up.railway.app/message/sendText/incendio-bot \
  -H "Origin: https://bot-incendio.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,apikey" \
  -v
```

**Deve retornar:**
```
Access-Control-Allow-Origin: https://bot-incendio.vercel.app
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, apikey
```

Se não retornar esses headers, o CORS não está configurado corretamente.

---

## 🎯 Checklist para Diagnosticar

- [ ] Verificou qual serviço corresponde à URL `incendio-production.up.railway.app`?
- [ ] Configurou CORS no serviço correto (não "devoted-bravery")?
- [ ] Usou URL específica (`https://bot-incendio.vercel.app`) em vez de `*`?
- [ ] Reiniciou o serviço manualmente após adicionar variáveis?
- [ ] Verificou logs para ver se há erros?
- [ ] Testou com curl para ver se headers CORS aparecem?
- [ ] Limpou cache do navegador e testou em aba anônima?

---

## 🚀 Próximos Passos

1. **Primeiro:** Verifique se está no serviço correto (o que corresponde à URL)
2. **Segundo:** Mude `CORS_ORIGIN` de `*` para `https://bot-incendio.vercel.app`
3. **Terceiro:** Reinicie manualmente o serviço
4. **Quarto:** Teste com curl para verificar headers
5. **Último recurso:** Implemente proxy no Vercel (Solução 2)

---

**Qual serviço você configurou? O "devoted-bravery" ou o que corresponde a "incendio-production"?**

