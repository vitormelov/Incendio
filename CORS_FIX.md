# 🔧 Como Corrigir Erro de CORS - Evolution API

## Problema

O navegador está bloqueando as requisições para a Evolution API devido a políticas CORS (Cross-Origin Resource Sharing).

**Erro no console:**
```
Access to XMLHttpRequest at 'https://incendio-production.up.railway.app//message/sendText/incendio-bot' 
from origin 'https://bot-incendio.vercel.app' has been blocked by CORS policy
```

## ✅ Solução

Configure CORS na Evolution API para permitir requisições do seu frontend.

---

## 🚀 Passo 1: Configurar CORS no Railway

1. Acesse [railway.app](https://railway.app) e faça login
2. Abra seu projeto
3. Clique no serviço **Evolution API**
4. Vá em **Variables** (ou **Environment Variables**)
5. Adicione as seguintes variáveis:

```env
CORS_ENABLED=true
CORS_ORIGIN=*
```

**OU** para permitir apenas seu domínio específico (mais seguro):

```env
CORS_ENABLED=true
CORS_ORIGIN=https://bot-incendio.vercel.app,https://incendio.vercel.app
```

6. Salve as variáveis
7. O Railway irá reiniciar automaticamente o serviço

---

## 🔄 Passo 2: Verificar URL sem Barra Dupla

A URL também tinha um problema de barra dupla (`//`). Isso já foi corrigido no código.

Certifique-se de que a variável `VITE_EVOLUTION_API_URL` no Vercel está configurada **sem barra final**:

```
❌ ERRADO: https://incendio-production.up.railway.app/
✅ CORRETO: https://incendio-production.up.railway.app
```

---

## 📝 Configuração no Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Abra seu projeto
3. Vá em **Settings** > **Environment Variables**
4. Verifique/Atualize `VITE_EVOLUTION_API_URL`:
   - **Valor:** `https://incendio-production.up.railway.app` (sem barra final)
5. Faça um novo deploy (ou o Vercel fará automaticamente)

---

## 🐳 Para Desenvolvimento Local (Docker)

Se estiver usando Docker localmente, o `docker-compose.yml` já foi atualizado com as configurações de CORS.

Apenas reinicie os containers:

```bash
cd src/services/evolution-api
docker-compose down
docker-compose up -d
```

---

## ✅ Verificar se Funcionou

1. **Aguarde alguns minutos** para o Railway reiniciar o serviço
2. **Recarregue a página** no Vercel
3. **Tente criar um incêndio** novamente
4. **Verifique o console** do navegador (F12):
   - Não deve mais ter erros de CORS
   - A mensagem WhatsApp deve ser enviada com sucesso

---

## 🔒 Segurança (Opcional)

Para produção, é recomendado usar uma origem específica ao invés de `*`:

```env
CORS_ORIGIN=https://bot-incendio.vercel.app
```

Isso permite apenas requisições do seu domínio do Vercel.

---

## 🐛 Se Ainda Não Funcionar

### 1. Verificar Logs do Railway

1. No Railway, vá em **Deployments**
2. Clique no deploy mais recente
3. Verifique os logs para ver se há erros

### 2. Testar API Diretamente

Teste se a API está respondendo:

```bash
curl -X GET https://incendio-production.up.railway.app/manager/
```

### 3. Verificar Headers CORS

No navegador (F12 > Network), verifique se a resposta da API inclui:

```
Access-Control-Allow-Origin: https://bot-incendio.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, apikey
```

### 4. Limpar Cache

- Limpe o cache do navegador
- Teste em uma aba anônima
- Ou aguarde alguns minutos para o cache expirar

---

## 📚 Referência

- [Evolution API Documentation](https://doc.evolution-api.com/)
- [CORS na Evolution API](https://doc.evolution-api.com/v2.3/docs/cors-configuration)

---

## ✅ Checklist

- [ ] Variáveis CORS adicionadas no Railway
- [ ] URL sem barra final no Vercel (`VITE_EVOLUTION_API_URL`)
- [ ] Railway reiniciado (aguardar alguns minutos)
- [ ] Novo deploy do Vercel (ou aguardar automático)
- [ ] Testado criar incêndio
- [ ] Mensagem WhatsApp enviada com sucesso

---

**Dúvidas?** Verifique os logs do Railway ou consulte a documentação da Evolution API.

