# 🚀 Guia: Serverless Function no Vercel

## ✅ A Função Já Está Criada!

A serverless function já foi criada no arquivo:
```
api/whatsapp/send.js
```

---

## 📁 Como Funciona no Vercel

No Vercel, **qualquer arquivo dentro da pasta `api/`** é automaticamente convertido em uma serverless function!

### **Estrutura de Pastas:**

```
seu-projeto/
├── api/
│   └── whatsapp/
│       └── send.js          ← Serverless Function
├── src/
├── public/
└── vercel.json
```

### **Como o Vercel Detecta:**

1. O Vercel **automaticamente detecta** arquivos em `api/`
2. Cada arquivo `.js` ou `.ts` vira uma serverless function
3. A URL da função é: `/api/{pasta}/{arquivo}`

**Exemplo:**
- Arquivo: `api/whatsapp/send.js`
- URL: `https://seu-site.vercel.app/api/whatsapp/send`

---

## 🔧 Estrutura da Função

### **Formato Padrão:**

```javascript
export default async function handler(req, res) {
  // req = Request (requisição do cliente)
  // res = Response (resposta que você envia)
  
  // Sua lógica aqui
  return res.status(200).json({ message: 'OK' });
}
```

### **Nossa Função (`api/whatsapp/send.js`):**

1. **Recebe:** Requisição POST com `number` e `text`
2. **Faz:** Requisição para Evolution API (lado do servidor)
3. **Retorna:** Resposta da Evolution API

---

## 📤 Como o Frontend Chama

### **No Código (`src/services/whatsapp.ts`):**

```typescript
// Em vez de chamar diretamente a Evolution API:
// ❌ axios.post('https://evolution-api.com/...')

// Agora chama o proxy do Vercel (mesmo domínio):
const apiUrl = '/api/whatsapp/send';
axios.post(apiUrl, { number, text });
```

**Por que funciona:**
- ✅ Mesmo domínio = sem problema de CORS
- ✅ Serverless function faz requisição para Evolution API
- ✅ Evolution API retorna resposta
- ✅ Serverless function retorna para frontend

---

## 🚀 Deploy Automático

### **O Vercel Faz Automaticamente:**

1. **Detecta** o arquivo `api/whatsapp/send.js`
2. **Cria** a serverless function automaticamente
3. **Deploy** junto com o resto do projeto
4. **Disponibiliza** em `https://seu-site.vercel.app/api/whatsapp/send`

**Você NÃO precisa fazer nada além de fazer push para o GitHub!**

---

## ✅ Verificar se Está Funcionando

### **1. Verificar no Vercel Dashboard**

1. Acesse: https://vercel.com
2. Abra seu projeto
3. Vá em **Functions** (menu lateral)
4. Você deve ver:
   ```
   api/whatsapp/send
   Status: Ready
   Runtime: Node.js 18.x
   ```

### **2. Verificar Logs**

1. No Vercel, vá em **Deployments**
2. Clique no deploy mais recente
3. Vá em **Functions**
4. Clique em `api/whatsapp/send`
5. Veja os logs

### **3. Testar Manualmente**

Abra o terminal e execute:

```bash
curl -X POST https://bot-incendio.vercel.app/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{"number":"120363405714962614@g.us","text":"Teste"}'
```

**Deve retornar:**
- ✅ JSON com resposta da Evolution API
- ❌ OU erro se variáveis de ambiente não estiverem configuradas

---

## 🔑 Variáveis de Ambiente

### **Importante:**

A serverless function precisa das **mesmas variáveis** que o frontend, mas no Vercel:

1. Vá em **Settings** → **Environment Variables**
2. Certifique-se de que estas variáveis estão configuradas:
   ```
   VITE_EVOLUTION_API_URL
   VITE_EVOLUTION_API_KEY
   VITE_EVOLUTION_INSTANCE_NAME
   VITE_WHATSAPP_GROUP_ID
   ```

**⚠️ IMPORTANTE:** 
- As variáveis devem estar configuradas para **Production**
- Ou para **All Environments** (Production, Preview, Development)

---

## 🐛 Problemas Comuns

### **1. Função Não Aparece**

**Causa:** Arquivo não foi commitado/pushed

**Solução:**
```bash
git add api/whatsapp/send.js
git commit -m "Add serverless function"
git push
```

### **2. Erro 404 ao Chamar `/api/whatsapp/send`**

**Causa:** Verifique:
- ✅ Arquivo existe em `api/whatsapp/send.js`?
- ✅ Foi feito push para GitHub?
- ✅ Vercel fez deploy?
- ✅ URL está correta: `/api/whatsapp/send` (não `/api/whatsapp/send.js`)

### **3. Erro "Configuração do servidor incompleta"**

**Causa:** Variáveis de ambiente não configuradas no Vercel

**Solução:**
1. Vercel → Settings → Environment Variables
2. Adicione as variáveis necessárias
3. Faça novo deploy

### **4. Timeout da Função**

**Causa:** Evolution API demora muito para responder

**Solução:**
- O timeout padrão do Vercel é 10s (Hobby) ou 60s (Pro)
- Se precisar mais, considere aumentar timeout ou otimizar Evolution API

---

## 📊 Monitoramento

### **Ver Métricas da Função:**

1. No Vercel, vá em **Analytics**
2. Clique em **Functions**
3. Veja:
   - Número de invocações
   - Tempo de execução
   - Erros
   - Uso de memória

---

## 🎯 Resumo

### **✅ O que já está feito:**

1. ✅ Arquivo criado: `api/whatsapp/send.js`
2. ✅ Código do frontend atualizado
3. ✅ `vercel.json` configurado
4. ✅ Commit e push realizados

### **✅ O que o Vercel faz automaticamente:**

1. ✅ Detecta `api/whatsapp/send.js`
2. ✅ Cria serverless function
3. ✅ Faz deploy
4. ✅ Disponibiliza em `/api/whatsapp/send`

### **⚠️ O que você precisa fazer:**

1. ⚠️ **Verificar variáveis de ambiente no Vercel**
2. ⚠️ **Aguardar deploy terminar**
3. ⚠️ **Testar criando um incêndio**

---

## 🚀 Próximos Passos

1. **Aguarde deploy no Vercel** (1-2 minutos)
2. **Verifique** se a função aparece em **Functions**
3. **Teste** criando um incêndio no site
4. **Verifique logs** se houver erro

---

**A serverless function já está criada e pronta!** 🎉

Só precisa verificar as variáveis de ambiente no Vercel e aguardar o deploy.

