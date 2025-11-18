# 🔧 Corrigir Railway: Usar Docker em vez de Vite

## 🔴 Problema

O Railway está detectando o projeto como **Vite/React** e tentando fazer build do frontend, mas precisamos que rode a **Evolution API via Docker**.

**Erro nos logs:**
```
↳ Detected Node
↳ Using npm package manager
↳ Deploying as vite static site
```

---

## ✅ Solução: Configurar Root Directory

### **Passo 1: Abrir Settings do Serviço "Incendio"**

1. No Railway, clique no serviço **"Incendio"** (o que tem a URL `incendio-production`)
2. Vá na aba **"Settings"**

### **Passo 2: Configurar Source/Root Directory**

1. Procure por **"Source"** ou **"Root Directory"** ou **"Deploy"**
2. Configure:
   - **Root Directory:** `src/services/evolution-api`
   - Isso fará o Railway olhar apenas para a pasta do docker-compose.yml

### **Passo 3: Configurar Build/Start Commands**

1. Procure por **"Build Command"** ou **"Start Command"**
2. Configure:
   - **Build Command:** (deixe **VAZIO** ou remova)
   - **Start Command:** `docker-compose up -d`
   - Ou deixe vazio se o Railway detectar docker-compose.yml automaticamente

### **Passo 4: Salvar e Aguardar**

1. Salve as configurações
2. O Railway fará um novo deploy
3. Aguarde 2-3 minutos

---

## 🎯 Alternativa: Criar Serviço Separado (Mais Limpo)

Se não conseguir configurar o serviço "Incendio", crie um novo:

### **1. Criar Novo Serviço**

1. No Railway, clique em **"+ New"** → **"Empty Service"**
2. Nome: `evolution-api` ou `whatsapp-bot`

### **2. Conectar ao Repositório**

1. Clique em **"Connect GitHub"** ou **"Add Source"**
2. Selecione o mesmo repositório: `vitormelov/Incendio`
3. Configure:
   - **Root Directory:** `src/services/evolution-api`
   - **Branch:** `master` (ou `main`)

### **3. Configurar Deploy**

1. Vá em **Settings** → **Deploy**
2. Configure:
   - **Build Command:** (vazio)
   - **Start Command:** `docker-compose up -d`

### **4. Conectar aos Bancos**

1. No novo serviço, clique em **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Ou use os existentes: clique nos 3 pontinhos → **"Connect"** → selecione Postgres e Redis existentes

### **5. Configurar Variáveis**

1. Vá em **Variables**
2. Adicione todas as variáveis necessárias:
   ```
   SERVER_URL=https://incendio-production.up.railway.app
   CORS_ENABLED=true
   CORS_ORIGIN=*
   DATABASE_ENABLED=true
   DATABASE_PROVIDER=postgresql
   DATABASE_CONNECTION_URI=postgresql://...
   REDIS_ENABLED=true
   REDIS_URI=redis://...
   AUTHENTICATION_API_KEY=INCENDO_FACIL123
   AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
   CONFIG_SESSION_PHONE_VERSION=2.3000.1029950210
   ```

---

## 📝 Onde Está Root Directory no Railway?

### **No Dashboard:**

1. Serviço "Incendio" → **Settings**
2. Procure por:
   - **"Source"** → **"Root Directory"**
   - Ou **"Deploy"** → **"Root Directory"**
   - Ou **"Build"** → **"Root Directory"**

### **Se Não Encontrar:**

1. Vá em **Settings** → **"General"**
2. Procure por **"Root Directory"** ou **"Working Directory"**

---

## ✅ Verificar se Funcionou

Após configurar, os logs devem mostrar:

```
Starting docker-compose...
Creating network...
Creating evolution-postgres...
Creating evolution-redis...
Creating evolution-api...
```

**NÃO deve mostrar:**
```
Detected Node
npm ci
npm run build
Deploying as vite static site
```

---

## 🚀 Resumo Rápido

**O que fazer:**
1. Serviço "Incendio" → Settings
2. Root Directory: `src/services/evolution-api`
3. Build Command: (vazio)
4. Start Command: `docker-compose up -d` (ou vazio)
5. Salvar e aguardar deploy

**OU criar novo serviço:**
1. New Service → Empty
2. Connect GitHub → Root Directory: `src/services/evolution-api`
3. Configurar variáveis
4. Conectar Postgres e Redis

---

**Configure o Root Directory para `src/services/evolution-api` no Railway!** 🚀

