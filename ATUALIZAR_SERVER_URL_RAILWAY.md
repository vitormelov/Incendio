# 🔧 Configurar SERVER_URL no Railway

## ✅ Docker-compose.yml Atualizado!

Agora o `docker-compose.yml` usa:
```yaml
SERVER_URL=${SERVER_URL:-http://localhost:8080}
```

Isso significa:
- **Localmente:** Usa `http://localhost:8080` (padrão)
- **No Railway:** Deve ser configurado via variável de ambiente no dashboard

---

## 🚀 Configurar no Railway AGORA

### **Passo 1: Acessar o Railway**

1. Acesse: https://railway.app
2. Faça login
3. Abra o projeto
4. Clique no serviço **"Incendio"** (o que corresponde à URL `incendio-production.up.railway.app`)

### **Passo 2: Configurar SERVER_URL**

1. Clique na aba **"Variables"**
2. Procure por `SERVER_URL`
3. Se **não existir**, clique em **"+ New Variable"**
4. Configure:
   - **Key:** `SERVER_URL`
   - **Value:** `https://incendio-production.up.railway.app`
   - ✅ Use **HTTPS** (não HTTP)
   - ✅ **Sem porta** (Railway adiciona automaticamente)
   - ✅ **Sem barra final** `/`

5. Se **já existir**, clique nela para editar
6. Atualize para: `https://incendio-production.up.railway.app`

### **Passo 3: Verificar Outras Variáveis**

Certifique-se de que estas variáveis também estão configuradas:

```env
SERVER_URL=https://incendio-production.up.railway.app
CORS_ENABLED=true
CORS_ORIGIN=https://bot-incendio.vercel.app
```

### **Passo 4: Salvar e Aguardar**

1. Salve as variáveis
2. O Railway reiniciará automaticamente
3. Aguarde 1-2 minutos para o serviço reiniciar

---

## ✅ Como Verificar se Está Correto

### **1. Verificar no Railway**

- Vá em **Variables**
- Procure por `SERVER_URL`
- Deve ser: `https://incendio-production.up.railway.app`

### **2. Testar API**

```bash
curl https://incendio-production.up.railway.app/manager/
```

Deve retornar HTML da página do manager.

### **3. Verificar Logs**

- Vá em **Logs** no Railway
- Procure por mensagens de inicialização
- Deve mostrar a URL correta sendo usada

---

## 📊 Diferença entre Local e Railway

| Ambiente | SERVER_URL |
|----------|------------|
| **Local (Docker)** | `http://localhost:8080` |
| **Railway** | `https://incendio-production.up.railway.app` |

No Railway, as variáveis configuradas no dashboard **sobrescrevem** as do `docker-compose.yml`.

---

## 🎯 Por Que Isso Importa?

O `SERVER_URL` é usado pela Evolution API para:
1. ✅ Gerar URLs corretas nas respostas
2. ✅ Configurar webhooks (se usado)
3. ✅ Gerar QR codes com URLs corretas
4. ✅ Configurar CORS baseado na origem correta

Se estiver como `localhost`, a Evolution API pode:
- ❌ Gerar URLs incorretas
- ❌ Não funcionar corretamente com CORS
- ❌ QR codes podem não funcionar

---

## ✅ Checklist

- [ ] Acessei o Railway
- [ ] Abri o serviço "Incendio"
- [ ] Fui em Variables
- [ ] Configurei `SERVER_URL=https://incendio-production.up.railway.app`
- [ ] Configurei `CORS_ENABLED=true`
- [ ] Configurei `CORS_ORIGIN=https://bot-incendio.vercel.app`
- [ ] Salvei as variáveis
- [ ] Aguardei o serviço reiniciar (1-2 minutos)

---

**Configure agora no Railway e reinicie o serviço!** 🚀

