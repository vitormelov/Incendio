# ⚠️ IMPORTANTE: Variáveis no Serviço Errado!

## 🔴 Problema Identificado

Você está configurando as variáveis no serviço **"devoted-bravery"**, mas esse serviço **não está rodando** (mostra "No deploys for this service").

O serviço que **realmente está rodando** a Evolution API é o **"Incendio"** (que tem a URL `incendio-production.up.railway.app`).

---

## ✅ Solução: Configurar Variáveis no Serviço Correto

### **Passo 1: Identificar o Serviço Correto**

No Railway, você tem 4 serviços:
1. **Postgres** - Banco de dados
2. **Redis** - Cache
3. **Incendio** ← **ESTE É O CORRETO!** (tem URL `incendio-production.up.railway.app`)
4. **devoted-bravery** ← **ERRADO!** (não tem deploys)

### **Passo 2: Abrir o Serviço Correto**

1. No Railway, na visualização de **Architecture**
2. **Clique no serviço "Incendio"** (o que tem o ícone do GitHub e mostra "16 hours ago via GitHub")
3. **NÃO clique** no "devoted-bravery"

### **Passo 3: Configurar Variáveis no Serviço "Incendio"**

1. Com o serviço **"Incendio"** selecionado, vá na aba **"Variables"**
2. Adicione ou verifique estas variáveis:

```env
SERVER_URL=https://incendio-production.up.railway.app
CORS_ENABLED=true
CORS_ORIGIN=*
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://...
REDIS_ENABLED=true
REDIS_URI=redis://...
AUTHENTICATION_API_KEY=INCENDO_FACIL123
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
CONFIG_SESSION_PHONE_VERSION=2.3000.1029950210
```

3. **Salve** as variáveis
4. O Railway reiniciará o serviço **"Incendio"** automaticamente

---

## 🎯 Como Identificar o Serviço Correto

### **Serviço "Incendio" (CORRETO):**
- ✅ Tem ícone do GitHub
- ✅ Mostra: "16 hours ago via GitHub"
- ✅ Tem URL: `incendio-production.up.railway.app`
- ✅ Está conectado a Postgres e Redis
- ✅ **ESTE É O QUE ESTÁ RODANDO!**

### **Serviço "devoted-bravery" (ERRADO):**
- ❌ Mostra: "No deploys for this service"
- ❌ Não tem URL pública
- ❌ Não está rodando
- ❌ **NÃO CONFIGURE VARIÁVEIS AQUI!**

---

## 📝 Checklist

- [ ] Identifiquei o serviço "Incendio" (com URL `incendio-production`)
- [ ] Cliquei no serviço "Incendio" (não no "devoted-bravery")
- [ ] Fui na aba "Variables" do serviço "Incendio"
- [ ] Adicionei/configurar todas as variáveis necessárias
- [ ] Salvei as variáveis
- [ ] Aguardei o serviço "Incendio" reiniciar (1-2 minutos)

---

## ⚠️ Importante

**As variáveis no "devoted-bravery" não fazem nada** porque esse serviço não está rodando!

**Configure as variáveis no serviço "Incendio"** que é o que realmente está processando as requisições.

---

**Depois de configurar no serviço correto, teste novamente!** 🚀

