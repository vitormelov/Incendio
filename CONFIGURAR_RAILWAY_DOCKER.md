# 🐳 Configurar Railway para Usar Docker Compose

## 🔴 Problema

O Railway está tentando fazer deploy do frontend (Vite) em vez de rodar a Evolution API (Docker).

**Erro:**
```
↳ Detected Node
↳ Using npm package manager
↳ Deploying as vite static site
```

Isso está errado! Precisamos que o Railway rode o Docker Compose da Evolution API.

---

## ✅ Solução: Configurar Railway para Usar Docker

### **Opção 1: Configurar via Dashboard do Railway (Recomendado)**

1. No Railway, abra o serviço **"Incendio"**
2. Vá em **Settings**
3. Procure por **"Source"** ou **"Build"**
4. Configure:
   - **Build Command:** (deixe vazio ou remova)
   - **Start Command:** `docker-compose -f src/services/evolution-api/docker-compose.yml up -d`
   - **Root Directory:** `src/services/evolution-api`

**OU**

5. Vá em **Settings** → **Deploy**
6. Configure:
   - **Build Command:** (vazio)
   - **Start Command:** `docker-compose up -d`
   - **Root Directory:** `src/services/evolution-api`

---

### **Opção 2: Usar Dockerfile Simples**

Se o Railway não suportar docker-compose diretamente, podemos criar um Dockerfile que inicia o docker-compose.

**Já criamos:** `Dockerfile` na raiz do projeto

---

### **Opção 3: Configurar Source no Railway**

1. No Railway, abra o serviço **"Incendio"**
2. Vá em **Settings** → **Source**
3. Configure:
   - **Root Directory:** `src/services/evolution-api`
   - Isso fará o Railway olhar apenas para a pasta do docker-compose

---

## 🎯 Solução Mais Simples: Criar Serviço Separado

### **Recomendação: Criar Novo Serviço Apenas para Evolution API**

1. No Railway, clique em **"+ New"** → **"Empty Service"**
2. Nome: `evolution-api` (ou similar)
3. Configure:
   - **Source:** Conecte ao mesmo repositório GitHub
   - **Root Directory:** `src/services/evolution-api`
   - **Build Command:** (deixe vazio)
   - **Start Command:** `docker-compose up -d`
4. Adicione as variáveis de ambiente neste novo serviço
5. Conecte aos mesmos Postgres e Redis

---

## 📝 Configuração Atual vs. Ideal

### **Configuração Atual (ERRADA):**
```
Serviço "Incendio"
├── Source: Repositório GitHub (raiz)
├── Railway detecta: package.json → Vite/React
├── Tenta fazer build: npm run build
└── Erro: Tenta usar Railpack/Caddy
```

### **Configuração Ideal:**
```
Serviço "Incendio" (ou novo serviço)
├── Source: Repositório GitHub
├── Root Directory: src/services/evolution-api
├── Build Command: (vazio)
├── Start Command: docker-compose up -d
└── Variáveis: Configuradas no dashboard
```

---

## 🔧 Passos para Corrigir

### **1. Verificar Configuração Atual**

1. No Railway, abra o serviço **"Incendio"**
2. Vá em **Settings**
3. Veja:
   - **Source** (de onde está vindo o código)
   - **Root Directory** (qual pasta está usando)
   - **Build Command** (o que está tentando fazer)
   - **Start Command** (como está iniciando)

### **2. Ajustar Configuração**

**Opção A: Mudar Root Directory**
- **Root Directory:** `src/services/evolution-api`
- Isso fará o Railway olhar apenas para a pasta do docker-compose

**Opção B: Criar Novo Serviço**
- Criar serviço separado apenas para Evolution API
- Configurar Root Directory como `src/services/evolution-api`

### **3. Configurar Variáveis**

No serviço correto (que vai rodar o Docker), configure todas as variáveis:
- `SERVER_URL`
- `CORS_ENABLED`
- `CORS_ORIGIN`
- etc.

---

## 🚀 Solução Rápida: Usar Dockerfile

Criamos um `Dockerfile` na raiz que pode ajudar. Mas o Railway precisa estar configurado para usar Docker.

1. No Railway, abra o serviço **"Incendio"**
2. Vá em **Settings** → **Deploy**
3. Configure:
   - **Dockerfile Path:** `Dockerfile` (ou deixe auto-detect)
   - **Build Command:** (vazio)
   - **Start Command:** (vazio - o Dockerfile já tem CMD)

---

## 📊 Verificar se Está Funcionando

Após configurar, os logs devem mostrar:
```
Starting docker-compose...
Creating evolution-api...
Creating evolution-redis...
Creating evolution-postgres...
```

**NÃO deve mostrar:**
```
Detected Node
Using npm package manager
Deploying as vite static site
```

---

## ✅ Checklist

- [ ] Identifiquei qual serviço está tentando fazer deploy (provavelmente "Incendio")
- [ ] Configurei Root Directory como `src/services/evolution-api`
- [ ] Removi ou limpei Build Command (se tiver npm run build)
- [ ] Configurei Start Command como `docker-compose up -d` (ou deixei vazio se usar Dockerfile)
- [ ] Configurei todas as variáveis de ambiente no serviço correto
- [ ] Aguardei o deploy terminar
- [ ] Verifiquei logs - deve mostrar Docker Compose iniciando

---

**Configure o Root Directory e Start Command corretamente no Railway!** 🚀

