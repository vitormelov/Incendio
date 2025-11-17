# ⚙️ Configurar SERVER_URL no Railway

## ✅ A Porta 8080 Está Correta!

A porta **8080** está correta. No Railway:
- O container roda na porta **8080**
- O Railway faz proxy automático: `HTTPS (443) → HTTP (8080)`
- Quando você acessa `https://incendio-production.up.railway.app`, o Railway roteia automaticamente para a porta 8080 do container

## ❌ O Problema: SERVER_URL

O `SERVER_URL` no `docker-compose.yml` está como:
```yaml
SERVER_URL=http://localhost:8080  ❌ ERRADO
```

Mas deveria ser a **URL pública do Railway**:
```yaml
SERVER_URL=https://incendio-production.up.railway.app  ✅ CORRETO
```

---

## 🔧 Como Corrigir no Railway

### **Passo 1: Acessar Variables**

1. No Railway, abra o serviço **"Incendio"** (o que corresponde à URL `incendio-production`)
2. Vá na aba **"Variables"**

### **Passo 2: Verificar/Atualizar SERVER_URL**

1. Procure pela variável `SERVER_URL`
2. Se existir, verifique o valor:
   - ❌ **ERRADO:** `http://localhost:8080`
   - ❌ **ERRADO:** `http://incendio-production.up.railway.app`
   - ✅ **CORRETO:** `https://incendio-production.up.railway.app`

3. Se não existir ou estiver errado:
   - Clique em **"+ New Variable"**
   - **Key:** `SERVER_URL`
   - **Value:** `https://incendio-production.up.railway.app` (sem porta, sem barra final)
   - Salve

### **Passo 3: Reiniciar Serviço**

1. Após salvar, o Railway reiniciará automaticamente
2. Aguarde 1-2 minutos

---

## 📝 Checklist de Variáveis no Railway

Certifique-se de que estas variáveis estão configuradas no serviço **"Incendio"**:

```env
SERVER_URL=https://incendio-production.up.railway.app
DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://...
REDIS_ENABLED=true
REDIS_URI=redis://...
AUTHENTICATION_API_KEY=INCENDO_FACIL123
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
CONFIG_SESSION_PHONE_VERSION=2.3000.1029950210
CORS_ENABLED=true
CORS_ORIGIN=https://bot-incendio.vercel.app
```

**Importante:**
- ✅ `SERVER_URL` deve usar **HTTPS** (não HTTP)
- ✅ `SERVER_URL` deve usar a **URL pública** (não localhost)
- ✅ `SERVER_URL` **não deve** ter porta (o Railway adiciona automaticamente)
- ✅ `SERVER_URL` **não deve** ter barra final `/`

---

## 🎯 Por Que Isso Importa?

O `SERVER_URL` é usado pela Evolution API para:
1. Gerar URLs corretas nas respostas
2. Configurar webhooks
3. Configurar CORS corretamente
4. Gerar QR codes com URLs corretas

Se estiver como `localhost`, a Evolution API pode não funcionar corretamente.

---

## ✅ Verificar se Está Correto

### **1. Teste no Navegador**

Abra: `https://incendio-production.up.railway.app/manager/`

Deve mostrar a interface do Evolution API.

### **2. Teste via API**

```bash
curl https://incendio-production.up.railway.app/instance/fetchInstances \
  -H "apikey: INCENDO_FACIL123"
```

Deve retornar JSON com as instâncias.

---

## 📊 Resumo

| Item | Status | Nota |
|------|--------|------|
| Porta 8080 | ✅ Correto | Railway faz proxy automático |
| SERVER_URL | ⚠️ Verificar | Deve ser `https://incendio-production.up.railway.app` |
| CORS | ⚠️ Verificar | Deve estar configurado |

---

**Configure o SERVER_URL corretamente e reinicie o serviço!**

