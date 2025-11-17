# 🚀 Guia Passo a Passo: Configurar CORS no Railway

Este guia mostra **exatamente** como configurar CORS no Railway para resolver o erro de CORS.

---

## ⚠️ Problema Atual

Você está vendo este erro no console:
```
Access to XMLHttpRequest at 'https://incendio-production.up.railway.app/message/sendText/incendio-bot' 
from origin 'https://bot-incendio.vercel.app' has been blocked by CORS policy
```

**Isso acontece porque a Evolution API no Railway não está configurada para aceitar requisições do seu frontend no Vercel.**

---

## ✅ Solução: Configurar CORS no Railway

### **Passo 1: Acessar o Railway**

1. Abra seu navegador
2. Acesse: https://railway.app
3. Faça login com sua conta GitHub

---

### **Passo 2: Abrir o Projeto**

1. Na página inicial do Railway, você verá seus projetos
2. Clique no projeto que contém a **Evolution API**
   - Provavelmente se chama algo como `incendio-production` ou similar

---

### **Passo 3: Abrir o Serviço Evolution API**

1. Dentro do projeto, você verá os serviços (PostgreSQL, Redis, Evolution API)
2. **Clique no serviço Evolution API**
   - É o serviço que está rodando a imagem `evoapicloud/evolution-api`

---

### **Passo 4: Acessar Variables (Variáveis de Ambiente)**

1. Na página do serviço Evolution API, você verá várias abas:
   - **Deployments**
   - **Metrics**
   - **Logs**
   - **Variables** ← **CLIQUE AQUI**

2. Ou então:
   - Procure por **"Variables"** ou **"Environment Variables"** no menu lateral
   - Ou clique no botão **"Variables"** no topo da página

---

### **Passo 5: Adicionar Variáveis CORS**

1. Na página de **Variables**, você verá todas as variáveis de ambiente configuradas

2. Procure por um botão **"+ New Variable"** ou **"Add Variable"** ou **"New"**

3. Adicione a **primeira variável**:
   - **Key (Chave):** `CORS_ENABLED`
   - **Value (Valor):** `true`
   - Clique em **"Add"** ou **"Save"**

4. Adicione a **segunda variável**:
   - **Key (Chave):** `CORS_ORIGIN`
   - **Value (Valor):** `https://bot-incendio.vercel.app`
   - Clique em **"Add"** ou **"Save"**

   **OU** para permitir qualquer origem (menos seguro, mas funciona):
   - **Key (Chave):** `CORS_ORIGIN`
   - **Value (Valor):** `*`
   - Clique em **"Add"** ou **"Save"**

---

### **Passo 6: Verificar Variáveis Adicionadas**

Você deve ver estas variáveis na lista:

```
CORS_ENABLED = true
CORS_ORIGIN = https://bot-incendio.vercel.app
```

ou

```
CORS_ENABLED = true
CORS_ORIGIN = *
```

---

### **Passo 7: Aguardar Reinicialização**

1. Após salvar as variáveis, o Railway **automaticamente reiniciará** o serviço Evolution API

2. Você verá na aba **"Deployments"** um novo deploy sendo criado

3. **Aguarde 2-3 minutos** para o serviço reiniciar completamente

4. Você pode verificar os logs na aba **"Logs"** para ver se está funcionando

---

### **Passo 8: Testar**

1. Vá para seu site no Vercel: https://bot-incendio.vercel.app
2. Recarregue a página (F5)
3. Tente criar um novo incêndio
4. Abra o console do navegador (F12 > Console)
5. **O erro de CORS não deve mais aparecer!**

---

## 🎯 Exemplo Visual das Variáveis

Sua página de Variables no Railway deve ficar assim:

```
┌─────────────────────────────────────┐
│ Variables                           │
├─────────────────────────────────────┤
│ SERVER_URL                          │
│ https://incendio-production.up...   │
├─────────────────────────────────────┤
│ DATABASE_ENABLED                    │
│ true                                │
├─────────────────────────────────────┤
│ DATABASE_PROVIDER                   │
│ postgresql                          │
├─────────────────────────────────────┤
│ AUTHENTICATION_API_KEY              │
│ INCENDO_FACIL123                    │
├─────────────────────────────────────┤
│ CORS_ENABLED          ← NOVO!      │
│ true                   ← NOVO!      │
├─────────────────────────────────────┤
│ CORS_ORIGIN            ← NOVO!      │
│ https://bot-incendio... ← NOVO!     │
└─────────────────────────────────────┘
```

---

## 🔍 Como Verificar se Funcionou

### **Método 1: Testar no Navegador**

1. Abra o DevTools (F12)
2. Vá na aba **Network**
3. Crie um incêndio
4. Procure pela requisição `sendText`
5. Clique nela
6. Veja os **Response Headers**
7. Deve aparecer:
   ```
   Access-Control-Allow-Origin: https://bot-incendio.vercel.app
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
   Access-Control-Allow-Headers: Content-Type, apikey
   ```

### **Método 2: Testar via curl**

Abra o terminal e execute:

```bash
curl -X OPTIONS \
  https://incendio-production.up.railway.app/message/sendText/incendio-bot \
  -H "Origin: https://bot-incendio.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

Deve retornar headers CORS permitindo a origem.

---

## ❌ Se Ainda Não Funcionar

### **1. Verificar se as Variáveis Foram Salvas**

- Volte na página **Variables**
- Confirme que `CORS_ENABLED` e `CORS_ORIGIN` estão lá
- Verifique se os valores estão corretos (sem espaços extras)

### **2. Verificar Logs do Railway**

1. Vá na aba **"Logs"**
2. Procure por erros relacionados a CORS
3. Verifique se a aplicação reiniciou corretamente

### **3. Tentar Variáveis Alternativas**

Se `CORS_ENABLED` e `CORS_ORIGIN` não funcionarem, a Evolution API pode usar nomes diferentes. Tente:

```
CORS=true
ALLOW_ORIGIN=https://bot-incendio.vercel.app
```

ou

```
ENABLE_CORS=true
CORS_ORIGINS=https://bot-incendio.vercel.app
```

### **4. Verificar Documentação da Evolution API**

Consulte a documentação oficial:
- https://doc.evolution-api.com/
- Procure por "CORS" ou "Cross-Origin"

### **5. Reiniciar o Serviço Manualmente**

1. No Railway, vá em **"Settings"**
2. Procure por **"Restart"** ou **"Redeploy"**
3. Clique para reiniciar o serviço

---

## 📸 Screenshots de Referência

Se você não encontrar a opção **"Variables"**, ela pode estar em:

1. **Menu lateral** (ícone de engrenagem ou três pontinhos)
2. **Aba superior** (junto com Deployments, Metrics, Logs)
3. **Configurações do serviço** (Settings)

---

## ✅ Checklist Final

- [ ] Acessei o Railway
- [ ] Abri o projeto correto
- [ ] Cliquei no serviço Evolution API
- [ ] Acessei a página Variables
- [ ] Adicionei `CORS_ENABLED = true`
- [ ] Adicionei `CORS_ORIGIN = https://bot-incendio.vercel.app` (ou `*`)
- [ ] Salvei as variáveis
- [ ] Aguardei 2-3 minutos para reiniciar
- [ ] Testei criar um incêndio
- [ ] Erro de CORS desapareceu ✅

---

## 🆘 Ainda com Problemas?

Se mesmo seguindo todos os passos o erro persistir:

1. **Compartilhe um screenshot** da página de Variables do Railway
2. **Compartilhe os logs** da Evolution API (últimas 50 linhas)
3. **Verifique** se o domínio do Vercel está correto

---

**Boa sorte!** 🚀

