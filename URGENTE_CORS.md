# ⚠️ URGENTE: Configurar CORS no Railway AGORA

## 🔴 Situação Atual

O log do Railway confirma que **CORS NÃO está configurado**:
- ❌ Não há headers `Access-Control-Allow-Origin` na resposta
- ❌ Requisições do frontend estão sendo bloqueadas pelo navegador
- ❌ O WhatsApp não consegue enviar mensagens

---

## ✅ SOLUÇÃO IMEDIATA (5 minutos)

### **Passo 1: Acesse o Railway**

1. Abra: https://railway.app
2. Faça login

### **Passo 2: Encontre o Serviço Evolution API**

1. Clique no projeto que contém a Evolution API
2. Você verá uma lista de serviços:
   - PostgreSQL
   - Redis
   - **Evolution API** ← CLIQUE AQUI

### **Passo 3: Abra Variables**

Na página do serviço Evolution API:

**Opção A:** Procure a aba **"Variables"** no topo da página
**Opção B:** Procure no menu lateral (ícone de engrenagem)
**Opção C:** Procure um botão **"Environment Variables"**

### **Passo 4: Adicione as Variáveis CORS**

1. Clique em **"+ New Variable"** ou **"Add Variable"** ou **"New"**

2. **Variável 1:**
   - **Key:** `CORS_ENABLED`
   - **Value:** `true`
   - Clique em **Add** ou **Save**

3. **Variável 2:**
   - **Key:** `CORS_ORIGIN`
   - **Value:** `https://bot-incendio.vercel.app`
   - Clique em **Add** ou **Save**

### **Passo 5: Verifique**

Você deve ver na lista:

```
CORS_ENABLED = true
CORS_ORIGIN = https://bot-incendio.vercel.app
```

### **Passo 6: Aguarde**

1. O Railway reiniciará automaticamente (1-2 minutos)
2. Você verá um novo deploy na aba **"Deployments"**
3. Aguarde os logs mostrarem que o serviço está rodando

### **Passo 7: Teste**

1. Volte para: https://bot-incendio.vercel.app
2. Crie um incêndio
3. O erro de CORS deve desaparecer! ✅

---

## 📸 Onde Está Variables?

Se você não encontrar:

### **No Railway Dashboard:**
```
Projeto → Evolution API → Variables (aba no topo)
```

### **Ou Procure Por:**
- **Environment Variables**
- **Config**
- **Settings → Variables**
- **Ícone de engrenagem → Variables

---

## 🔍 Como Saber se Funcionou?

### **Verifique os Logs:**

Após configurar e reiniciar, os logs devem mostrar:
- Aplicação iniciando normalmente
- Sem erros relacionados a CORS

### **Teste no Navegador:**

1. Abra DevTools (F12)
2. Aba **Network**
3. Crie um incêndio
4. Clique na requisição `sendText`
5. Veja **Response Headers**
6. Deve aparecer:
   ```
   Access-Control-Allow-Origin: https://bot-incendio.vercel.app
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
   ```

---

## ❌ Se Ainda Não Funcionar

### **Verifique se as Variáveis Foram Salvas:**

1. Volte em **Variables**
2. Confirme que aparecem:
   - `CORS_ENABLED`
   - `CORS_ORIGIN`

### **Tente Variáveis Alternativas:**

Se não funcionar, a Evolution API pode usar nomes diferentes:

```
CORS=true
ALLOW_ORIGIN=https://bot-incendio.vercel.app
```

ou

```
ENABLE_CORS=true
CORS_ORIGINS=https://bot-incendio.vercel.app
```

### **Reinicie Manualmente:**

1. No Railway, vá em **Settings** do serviço
2. Procure **"Restart"** ou **"Redeploy"**
3. Clique para forçar reinício

---

## 🎯 Resumo

**O QUE FAZER AGORA:**

1. ✅ Acesse Railway
2. ✅ Abra Evolution API → Variables
3. ✅ Adicione `CORS_ENABLED = true`
4. ✅ Adicione `CORS_ORIGIN = https://bot-incendio.vercel.app`
5. ✅ Aguarde 2 minutos
6. ✅ Teste criar incêndio

**Isso é OBRIGATÓRIO. Sem isso, o WhatsApp nunca funcionará.**

---

**Depois de configurar, me avise!** 🚀

