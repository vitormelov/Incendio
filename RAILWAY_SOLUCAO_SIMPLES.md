# ✅ Solução Simples: Evolution API no Railway SEM Docker Compose

## 🔴 Problema

O Railway **não suporta docker-compose diretamente**. Ele gerencia cada serviço separadamente.

## ✅ Solução: Usar Apenas a Imagem da Evolution API

No Railway, você já tem:
- ✅ **Postgres** (serviço separado)
- ✅ **Redis** (serviço separado)
- ✅ **Incendio** (onde vamos rodar a Evolution API)

Não precisamos de docker-compose! Vamos usar apenas a imagem da Evolution API.

---

## 🚀 Configuração Correta

### **1. Configurar o Serviço "Incendio"**

1. No Railway, abra o serviço **"Incendio"**
2. **Settings** → **Source**:
   - **Root Directory:** `src/services/evolution-api`
3. **Settings** → **Build**:
   - **Builder:** `Dockerfile` (não Railpack!)
   - **Dockerfile Path:** `Dockerfile` (já está em `src/services/evolution-api/`)
4. **Settings** → **Deploy**:
   - **Start Command:** (deixe vazio - o Dockerfile já tem CMD)

### **2. Conectar aos Serviços Postgres e Redis**

No Railway, os serviços já estão conectados via **Private Networking**. Use as URLs internas:

1. No serviço **"Incendio"**, vá em **Variables**
2. Configure as variáveis usando as URLs internas do Railway:

```env
SERVER_URL=https://incendio-production.up.railway.app
DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://postgres:VBrgigsRfCttZht0qXlkJFJxbpltkoxr@postgres.railway.internal:5432/railway
REDIS_ENABLED=true
REDIS_URI=redis://default:geAzYVXDSuVJhuyqxkHgmvArvFFpWXbF@redis.railway.internal:6379
AUTHENTICATION_API_KEY=INCENDO_FACIL123
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
CONFIG_SESSION_PHONE_VERSION=2.3000.1029950210
CORS_ENABLED=true
CORS_ORIGIN=*
```

**⚠️ IMPORTANTE:** 
- Use `postgres.railway.internal` (não `postgres:5432`)
- Use `redis.railway.internal` (não `redis:6379`)
- As senhas você pega nos serviços Postgres e Redis no Railway

### **3. Obter Credenciais do Postgres e Redis**

1. **Postgres:**
   - Clique no serviço **Postgres**
   - Vá em **Variables**
   - Copie `POSTGRES_PASSWORD` e `POSTGRES_USER`
   - A URL será: `postgresql://POSTGRES_USER:POSTGRES_PASSWORD@postgres.railway.internal:5432/railway`

2. **Redis:**
   - Clique no serviço **Redis**
   - Vá em **Variables**
   - Copie `REDIS_PASSWORD` (se houver) ou use `default`
   - A URL será: `redis://default:REDIS_PASSWORD@redis.railway.internal:6379`

---

## 📝 Dockerfile Simplificado

O Dockerfile em `src/services/evolution-api/Dockerfile` já está configurado para usar apenas a imagem da Evolution API.

---

## ✅ Verificar se Funcionou

Após configurar, os logs devem mostrar:
```
Starting Evolution API...
Evolution API running on port 8080
```

**NÃO deve mostrar:**
```
docker-compose
Railpack
npm ci
```

---

## 🎯 Resumo

1. ✅ Root Directory: `src/services/evolution-api`
2. ✅ Builder: `Dockerfile` (não Railpack)
3. ✅ Variáveis configuradas com URLs internas do Railway
4. ✅ Start Command: (vazio)

---

**Configure o Builder como Dockerfile e use as URLs internas do Railway!** 🚀

