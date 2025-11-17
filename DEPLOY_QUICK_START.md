# 🚀 Deploy Rápido - Guia Simplificado

Este é um guia rápido para colocar seu site no ar em **menos de 30 minutos**.

## 📋 Pré-requisitos

- ✅ Conta no GitHub
- ✅ Projeto já commitado no GitHub
- ✅ Evolution API funcionando localmente

---

## 🎯 Opção Mais Rápida: Vercel + Railway

### **1. Deploy do Frontend (Vercel) - 5 minutos**

1. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
2. Clique em **"Add New Project"**
3. Selecione seu repositório `Incendio`
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Clique em **"Environment Variables"** e adicione:
   ```
   VITE_EVOLUTION_API_URL=https://sua-url-railway.app
   VITE_EVOLUTION_API_KEY=INCENDO_FACIL123
   VITE_EVOLUTION_INSTANCE_NAME=incendio-bot
   VITE_WHATSAPP_GROUP_ID=5511999999999@g.us
   ```
   ⚠️ **Deixe `VITE_EVOLUTION_API_URL` vazio por enquanto** (vamos configurar depois)
6. Clique em **"Deploy"**
7. Aguarde o deploy terminar
8. Copie a URL gerada (ex: `https://incendio.vercel.app`)

✅ **Frontend deployado!**

---

### **2. Deploy da Evolution API (Railway) - 10 minutos**

#### 2.1. Criar projeto no Railway

1. Acesse [railway.app](https://railway.app) e faça login com GitHub
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"**
4. Escolha seu repositório `Incendio`

#### 2.2. Adicionar banco de dados

1. No projeto Railway, clique em **"New"** > **"Database"** > **"PostgreSQL"**
2. Aguarde o PostgreSQL ser criado
3. Clique em **"New"** > **"Database"** > **"Redis"**
4. Aguarde o Redis ser criado

#### 2.3. Configurar Evolution API

1. Clique em **"New"** > **"Empty Service"**
2. Clique nos **3 pontinhos** > **"Settings"**
3. Em **"Source"**, configure:
   - **Root Directory:** `src/services/evolution-api`
4. Em **"Deploy"**, configure:
   - **Start Command:** `docker-compose up -d`
5. Vá em **"Variables"** e adicione:

```env
SERVER_URL=${{RAILWAY_PUBLIC_DOMAIN}}
DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=${{Postgres.DATABASE_URL}}
REDIS_ENABLED=true
REDIS_URI=${{Redis.REDIS_URL}}
AUTHENTICATION_API_KEY=INCENDO_FACIL123
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
CONFIG_SESSION_PHONE_VERSION=2.3000.1029950210
```

6. Vá em **"Settings"** > **"Generate Domain"** para obter uma URL pública
7. Copie a URL gerada (ex: `https://evolution-api-production.up.railway.app`)

✅ **Evolution API deployada!**

---

### **3. Conectar Frontend com Evolution API - 2 minutos**

1. Volte ao Vercel
2. Vá em **Settings** > **Environment Variables**
3. Atualize `VITE_EVOLUTION_API_URL` com a URL do Railway
4. Vá em **Deployments** > clique nos **3 pontinhos** > **Redeploy**

✅ **Frontend atualizado!**

---

### **4. Configurar WhatsApp - 5 minutos**

1. Acesse a URL do Railway: `https://sua-url-railway.app/manager/`
2. Clique em **"Create Instance"**
3. Nome: `incendio-bot`
4. Clique em **"Create"**
5. Escaneie o QR Code com seu WhatsApp
6. Aguarde conectar
7. Adicione o bot ao grupo do WhatsApp
8. No grupo, envie: `/info` para ver o ID do grupo
9. Copie o ID (formato: `5511999999999@g.us`)
10. No Vercel, atualize `VITE_WHATSAPP_GROUP_ID` com o ID do grupo
11. Faça um novo deploy

✅ **WhatsApp configurado!**

---

### **5. Testar - 3 minutos**

1. Acesse a URL do Vercel
2. Faça login
3. Crie um incêndio
4. Verifique se a mensagem foi enviada no WhatsApp

✅ **Tudo funcionando!**

---

## 🎉 Pronto!

Seu site está no ar e acessível para qualquer pessoa!

**URL do Frontend:** `https://seu-projeto.vercel.app`  
**URL da Evolution API:** `https://sua-url.railway.app`

---

## 🐛 Problemas Comuns

### Frontend não carrega
- Verifique se o build passou no Vercel
- Verifique variáveis de ambiente

### Evolution API não responde
- Verifique logs no Railway
- Verifique se os bancos de dados estão rodando

### WhatsApp não envia
- Verifique se a instância está conectada
- Verifique se o bot está no grupo
- Verifique o ID do grupo

---

## 📝 Próximos Passos (Opcional)

1. **Configurar domínio personalizado** (Vercel > Settings > Domains)
2. **Configurar SSL** (automático no Vercel e Railway)
3. **Monitorar uso** (Railway tem dashboard de métricas)

---

## 💰 Custos

- **Vercel:** GRÁTIS (plano free)
- **Railway:** GRÁTIS (plano free) ou $5/mês (se usar muito)
- **Total:** $0-5/mês

---

**Dúvidas?** Consulte o `DEPLOY.md` completo para mais detalhes.

