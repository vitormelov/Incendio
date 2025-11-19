# 🔐 Variáveis de Ambiente - Projeto Incêndio

Este documento contém **TODAS** as variáveis de ambiente usadas no projeto, organizadas por serviço e ambiente.

---

## 📋 Índice

1. [Railway - Evolution API](#railway---evolution-api)
2. [Vercel - Frontend (React)](#vercel---frontend-react)
3. [Vercel - Serverless Functions](#vercel---serverless-functions)
4. [Firebase](#firebase)
5. [Resumo Rápido](#resumo-rápido)

---

## Railway - Evolution API

**Onde configurar**: Railway Dashboard → Serviço `Evolution API` → `Variables`

### ⚙️ Configuração do Servidor

```bash
SERVER_URL=https://seu-projeto.up.railway.app
```

**Descrição**: URL pública do serviço Evolution API no Railway  
**Formato**: `https://seu-projeto.up.railway.app` (sem barra final!)  
**Exemplo**: `https://incendio-production.up.railway.app`  
**Obrigatório**: ✅ Sim

---

### 🗄️ Configuração do Banco de Dados (PostgreSQL)

```bash
DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://postgres:SENHA@HOST:5432/DATABASE
```

**Descrição**: Configuração do PostgreSQL  
**Formato**: `postgresql://usuario:senha@host:porta/database`  
**Exemplo**: `postgresql://postgres:abc123@containers-us-west-xxx.railway.app:5432/railway`  
**Como obter**: Copie a variável `DATABASE_URL` do serviço PostgreSQL no Railway  
**Obrigatório**: ✅ Sim

---

### 💾 Configuração do Redis

```bash
REDIS_ENABLED=true
REDIS_URI=redis://default:SENHA@HOST:6379
REDIS_CONNECTION_TIMEOUT=30000
REDIS_RETRY_DELAY=5000
REDIS_MAX_RETRIES=10
CACHE_REDIS_URI=redis://default:SENHA@HOST:6379
CACHE_REDIS_PREFIX_KEY=incendio_bot_
```

**Descrições**:
- `REDIS_URI`: URL de conexão do Redis
- `REDIS_CONNECTION_TIMEOUT`: Tempo limite para conexão (ms)
- `REDIS_RETRY_DELAY`: Delay entre tentativas (ms)
- `REDIS_MAX_RETRIES`: Número máximo de tentativas
- `CACHE_REDIS_URI`: URL do Redis para cache (geralmente igual a `REDIS_URI`)
- `CACHE_REDIS_PREFIX_KEY`: Prefixo para chaves do cache

**Formato**: `redis://default:senha@host:6379`  
**Como obter**: Copie a variável `REDIS_URL` do serviço Redis no Railway  
**Obrigatório**: ✅ Sim

---

### 🔑 Configuração de Autenticação (API Key)

```bash
AUTHENTICATION_API_KEY=SUA_CHAVE_SECRETA_AQUI
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
```

**Descrição**: Chave secreta para autenticação na API  
**Formato**: String aleatória segura  
**Exemplo**: `INCENDO_FACIL123_xyz789`  
**Obrigatório**: ✅ Sim  
**⚠️ IMPORTANTE**: Esta chave deve ser a mesma em Railway e Vercel!

---

### 🌐 Configuração de CORS

```bash
CORS_ENABLED=true
CORS_ORIGIN=*
```

**Descrições**:
- `CORS_ENABLED`: Habilita CORS na API
- `CORS_ORIGIN`: Origem permitida (`*` = todas, ou domínio específico)

**Valores possíveis**:
- Desenvolvimento: `*` (permite todas as origens)
- Produção: `https://seu-app.vercel.app` (apenas seu domínio)

**Exemplo produção**: `CORS_ORIGIN=https://incendio.vercel.app`  
**Obrigatório**: ✅ Sim (para evitar erros de CORS no navegador)

---

### 📱 Configuração Opcional

```bash
CONFIG_SESSION_PHONE_VERSION=2.3000.1029950210
```

**Descrição**: Versão da sessão do WhatsApp  
**Obrigatório**: ❌ Não (usa padrão se não especificado)

---

## Vercel - Frontend (React)

**Onde configurar**: Vercel Dashboard → Projeto → `Settings` → `Environment Variables`

### 🎯 Variáveis para o Frontend (VITE_*)

```bash
VITE_EVOLUTION_API_URL=https://seu-projeto.up.railway.app
VITE_EVOLUTION_API_KEY=SUA_CHAVE_SECRETA_AQUI
VITE_EVOLUTION_INSTANCE_NAME=incendio-bot
VITE_WHATSAPP_GROUP_ID=120363405714962614@g.us
```

**Descrições**:

1. **`VITE_EVOLUTION_API_URL`**
   - URL pública do Evolution API no Railway
   - **Deve ser igual** ao `SERVER_URL` do Railway
   - Formato: `https://seu-projeto.up.railway.app` (sem barra final!)

2. **`VITE_EVOLUTION_API_KEY`**
   - Chave secreta da API
   - **Deve ser igual** ao `AUTHENTICATION_API_KEY` do Railway

3. **`VITE_EVOLUTION_INSTANCE_NAME`**
   - Nome da instância WhatsApp criada no Evolution API Manager
   - Exemplo: `incendio-bot`
   - Deve corresponder ao nome usado no Manager

4. **`VITE_WHATSAPP_GROUP_ID`**
   - ID do grupo WhatsApp onde as mensagens serão enviadas
   - Formato: `numero@g.us`
   - Exemplo: `120363405714962614@g.us`
   - Como obter: Use um bot do WhatsApp ou consulte a documentação

**Obrigatório**: ✅ Todas são obrigatórias

**⚠️ NOTA**: No Vercel, configure essas variáveis para os ambientes:
- **Production** (obrigatório)
- **Preview** (opcional, para testes)
- **Development** (opcional, para desenvolvimento local)

---

## Vercel - Serverless Functions

**Onde configurar**: Mesmo lugar do Frontend (Vercel Dashboard → `Environment Variables`)

### 🔧 Variáveis para o Proxy `/api/whatsapp/send`

**IMPORTANTE**: As funções serverless do Vercel usam as mesmas variáveis `VITE_*` do frontend!

```bash
VITE_EVOLUTION_API_URL=https://seu-projeto.up.railway.app
VITE_EVOLUTION_API_KEY=SUA_CHAVE_SECRETA_AQUI
VITE_EVOLUTION_INSTANCE_NAME=incendio-bot
```

**Descrição**: O arquivo `api/whatsapp/send.js` usa `process.env.VITE_EVOLUTION_API_URL` (com prefixo `VITE_`)  
**Por quê**: No Vercel, as variáveis `VITE_*` são expostas tanto para o frontend quanto para as funções serverless  
**Obrigatório**: ✅ Sim (as mesmas variáveis do frontend)

---

## Firebase

**Status atual**: ⚠️ Hardcoded no código  
**Arquivo**: `src/firebase/config.ts`

### 🔥 Variáveis do Firebase (atualmente no código)

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyAQxVKVzpnjIOexdz-8Qu3gD-SYS9BUb68",
  authDomain: "incendio-77357.firebaseapp.com",
  projectId: "incendio-77357",
  storageBucket: "incendio-77357.firebasestorage.app",
  messagingSenderId: "630172863236",
  appId: "1:630172863236:web:de8d38678476f48ab65e51",
  measurementId: "G-LL56QGSRHE"
};
```

**Nota**: Estas credenciais estão hardcoded no código. Para maior segurança, você pode movê-las para variáveis de ambiente:

```bash
# Opcional - se mover para variáveis de ambiente:
VITE_FIREBASE_API_KEY=AIzaSyAQxVKVzpnjIOexdz-8Qu3gD-SYS9BUb68
VITE_FIREBASE_AUTH_DOMAIN=incendio-77357.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=incendio-77357
VITE_FIREBASE_STORAGE_BUCKET=incendio-77357.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=630172863236
VITE_FIREBASE_APP_ID=1:630172863236:web:de8d38678476f48ab65e51
VITE_FIREBASE_MEASUREMENT_ID=G-LL56QGSRHE
```

---

## Resumo Rápido

### ✅ Checklist de Variáveis

#### Railway (Evolution API) - 13 variáveis

- [ ] `SERVER_URL`
- [ ] `DATABASE_ENABLED`
- [ ] `DATABASE_PROVIDER`
- [ ] `DATABASE_CONNECTION_URI`
- [ ] `REDIS_ENABLED`
- [ ] `REDIS_URI`
- [ ] `REDIS_CONNECTION_TIMEOUT`
- [ ] `REDIS_RETRY_DELAY`
- [ ] `REDIS_MAX_RETRIES`
- [ ] `CACHE_REDIS_URI`
- [ ] `CACHE_REDIS_PREFIX_KEY`
- [ ] `AUTHENTICATION_API_KEY`
- [ ] `AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES`
- [ ] `CORS_ENABLED`
- [ ] `CORS_ORIGIN`

#### Vercel (Frontend) - 4 variáveis

- [ ] `VITE_EVOLUTION_API_URL`
- [ ] `VITE_EVOLUTION_API_KEY`
- [ ] `VITE_EVOLUTION_INSTANCE_NAME`
- [ ] `VITE_WHATSAPP_GROUP_ID`

#### Vercel (Serverless) - 3 variáveis

- [ ] `VITE_EVOLUTION_API_URL` (mesma do frontend)
- [ ] `VITE_EVOLUTION_API_KEY` (mesma do frontend)
- [ ] `VITE_EVOLUTION_INSTANCE_NAME` (mesma do frontend)

---

### 📝 Valores Que Devem Ser Iguais

⚠️ **IMPORTANTE**: Os seguintes valores devem ser **idênticos** em Railway e Vercel:

1. **API URL**:
   - Railway: `SERVER_URL`
   - Vercel: `VITE_EVOLUTION_API_URL`
   - ✅ Devem ser iguais!

2. **API Key**:
   - Railway: `AUTHENTICATION_API_KEY`
   - Vercel: `VITE_EVOLUTION_API_KEY`
   - ✅ Devem ser iguais!

3. **Instance Name**:
   - Evolution API Manager: Nome da instância criada
   - Vercel: `VITE_EVOLUTION_INSTANCE_NAME`
   - ✅ Devem corresponder!

---

### 🔄 Ordem de Configuração

1. **Railway**: Configure primeiro o serviço Evolution API com todas as variáveis
2. **Railway**: Obtenha a URL pública (`SERVER_URL`)
3. **Railway**: Crie a instância WhatsApp no Manager
4. **Vercel**: Configure as variáveis `VITE_*` usando os valores do Railway
5. **Vercel**: Faça redeploy para aplicar as variáveis
6. **Teste**: Crie um incêndio e verifique se a mensagem é enviada

---

### 📚 Referências

- **Railway Dashboard**: https://railway.app/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Evolution API Manager**: `https://seu-projeto.up.railway.app/manager/`
- **Documentação Evolution API**: https://doc.evolution-api.com/

---

### 🆘 Troubleshooting

**Erro "CORS policy"**:
- Verifique se `CORS_ENABLED=true` no Railway
- Verifique se `CORS_ORIGIN=*` ou seu domínio Vercel

**Erro "Instance does not exist"**:
- Verifique se `VITE_EVOLUTION_INSTANCE_NAME` corresponde ao nome no Manager
- Crie a instância no Manager se não existir

**Erro "Database provider invalid"**:
- Verifique se `DATABASE_PROVIDER=postgresql` (sem espaços!)
- Verifique se `DATABASE_CONNECTION_URI` está correta

**Erro "Redis disconnected"**:
- Verifique se `REDIS_URI` está correta
- Pode ser um aviso não crítico - verifique se funciona mesmo assim

---

## 📄 Arquivo .env.local (Desenvolvimento Local)

Para desenvolvimento local, crie um arquivo `.env.local` na raiz do projeto:

```bash
# Evolution API (local ou Railway)
VITE_EVOLUTION_API_URL=http://localhost:8080
# ou
# VITE_EVOLUTION_API_URL=https://seu-projeto.up.railway.app

# API Key (deve ser igual ao Railway)
VITE_EVOLUTION_API_KEY=INCENDO_FACIL123

# Nome da instância
VITE_EVOLUTION_INSTANCE_NAME=incendio-bot

# ID do grupo WhatsApp
VITE_WHATSAPP_GROUP_ID=120363405714962614@g.us
```

⚠️ **IMPORTANTE**: O arquivo `.env.local` está no `.gitignore` e não será commitado!

