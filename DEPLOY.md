# Guia de Deploy - Sistema INCÊNDIO

Este guia explica como colocar seu sistema online para que qualquer pessoa possa acessá-lo.

## 📋 Visão Geral

Seu sistema tem **3 componentes principais**:

1. **Frontend (React/Vite)** - Interface web que os usuários acessam
2. **Evolution API (Docker)** - Serviço de WhatsApp que precisa estar sempre rodando
3. **Firebase** - Já está na nuvem, não precisa deploy ✅

---

## 🎯 Opções de Deploy

### **Opção 1: Deploy Completo em VPS (Recomendado)**
**Melhor para:** Controle total, melhor performance, tudo em um lugar

**Serviços recomendados:**
- **DigitalOcean** ($6-12/mês) - Mais simples
- **AWS EC2** (variável) - Mais complexo, mais recursos
- **Linode** ($5-10/mês) - Boa relação custo/benefício
- **Hetzner** (€4-8/mês) - Barato na Europa

**O que você precisa fazer:**
1. Criar servidor VPS (Ubuntu 22.04)
2. Instalar Docker e Docker Compose
3. Deploy do frontend (Vercel/Netlify) + Evolution API no VPS
4. Configurar domínio (opcional)

**Vantagens:**
- ✅ Tudo em um lugar
- ✅ Controle total
- ✅ Melhor para WhatsApp (sessão fica estável)

**Desvantagens:**
- ⚠️ Precisa configurar servidor
- ⚠️ Precisa manter servidor atualizado

---

### **Opção 2: Deploy Híbrido (Mais Fácil)**
**Melhor para:** Começar rápido, sem gerenciar servidor

**Estrutura:**
- **Frontend:** Vercel ou Netlify (GRÁTIS)
- **Evolution API:** Railway, Render ou Fly.io (GRÁTIS/Pago)

**Vantagens:**
- ✅ Frontend grátis e fácil
- ✅ Não precisa gerenciar servidor
- ✅ Deploy automático

**Desvantagens:**
- ⚠️ Evolution API pode ter limitações no plano grátis
- ⚠️ Sessão WhatsApp pode desconectar

---

### **Opção 3: Deploy Simplificado (Mais Barato)**
**Melhor para:** Orçamento limitado

**Estrutura:**
- **Frontend:** Vercel/Netlify (GRÁTIS)
- **Evolution API:** Servidor próprio ou VPS barato

---

## 🚀 Deploy Híbrido (Recomendado para Começar)

### **Passo 1: Deploy do Frontend (Vercel)**

#### 1.1. Preparar o projeto

1. **Criar arquivo `.env.production`** na raiz do projeto:

```env
VITE_EVOLUTION_API_URL=https://sua-evolution-api.railway.app
VITE_EVOLUTION_API_KEY=INCENDO_FACIL123
VITE_EVOLUTION_INSTANCE_NAME=incendio-bot
VITE_WHATSAPP_GROUP_ID=5511999999999@g.us
```

⚠️ **IMPORTANTE:** Substitua `https://sua-evolution-api.railway.app` pela URL real da Evolution API (você vai configurar no Passo 2).

#### 1.2. Fazer build local para testar

```bash
npm run build
```

Se funcionar, continue.

#### 1.3. Deploy no Vercel

**Opção A: Via Interface Web (Mais Fácil)**

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub
3. Clique em "Add New Project"
4. Conecte seu repositório GitHub
5. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (raiz)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Adicione as variáveis de ambiente:
   - `VITE_EVOLUTION_API_URL`
   - `VITE_EVOLUTION_API_KEY`
   - `VITE_EVOLUTION_INSTANCE_NAME`
   - `VITE_WHATSAPP_GROUP_ID`
7. Clique em "Deploy"

**Opção B: Via CLI**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer deploy
vercel

# Adicionar variáveis de ambiente
vercel env add VITE_EVOLUTION_API_URL
vercel env add VITE_EVOLUTION_API_KEY
vercel env add VITE_EVOLUTION_INSTANCE_NAME
vercel env add VITE_WHATSAPP_GROUP_ID
```

#### 1.4. Configurar domínio (Opcional)

No Vercel, vá em Settings > Domains e adicione seu domínio.

---

### **Passo 2: Deploy da Evolution API (Railway)**

#### 2.1. Criar conta no Railway

1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. Clique em "New Project"

#### 2.2. Deploy via Docker Compose

**Opção A: Via GitHub (Recomendado)**

1. Crie um arquivo `railway.json` na raiz do projeto:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "src/services/evolution-api/Dockerfile"
  },
  "deploy": {
    "startCommand": "docker-compose up -d",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

2. Crie um arquivo `Dockerfile` em `src/services/evolution-api/Dockerfile`:

```dockerfile
FROM evoapicloud/evolution-api:v2.3.4

# Copiar docker-compose.yml
COPY docker-compose.yml /app/docker-compose.yml

WORKDIR /app

CMD ["docker-compose", "up", "-d"]
```

**Opção B: Deploy Manual (Mais Simples)**

1. No Railway, clique em "New" > "Empty Project"
2. Clique em "Add Service" > "GitHub Repo"
3. Selecione seu repositório
4. Configure:
   - **Root Directory:** `src/services/evolution-api`
   - **Build Command:** (deixe vazio)
   - **Start Command:** `docker-compose up -d`
5. Adicione as variáveis de ambiente:
   ```
   SERVER_URL=https://seu-projeto.railway.app
   DATABASE_ENABLED=true
   DATABASE_PROVIDER=postgresql
   DATABASE_CONNECTION_URI=${{Postgres.DATABASE_URL}}
   REDIS_ENABLED=true
   REDIS_URI=${{Redis.REDIS_URL}}
   AUTHENTICATION_API_KEY=INCENDO_FACIL123
   AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
   ```
6. Adicione serviços PostgreSQL e Redis:
   - Clique em "New" > "Database" > "PostgreSQL"
   - Clique em "New" > "Database" > "Redis"

#### 2.3. Obter URL da Evolution API

1. No Railway, vá em Settings
2. Copie a URL do serviço (ex: `https://evolution-api-production.up.railway.app`)
3. Use essa URL no `.env` do frontend

#### 2.4. Configurar instância WhatsApp

1. Acesse `https://sua-url-railway.app/manager/`
2. Crie uma instância chamada `incendio-bot`
3. Escaneie o QR Code com seu WhatsApp
4. Adicione o bot ao grupo do WhatsApp
5. Copie o ID do grupo (formato: `5511999999999@g.us`)

---

### **Passo 3: Atualizar Variáveis de Ambiente**

#### 3.1. No Vercel (Frontend)

1. Vá em Settings > Environment Variables
2. Atualize `VITE_EVOLUTION_API_URL` com a URL do Railway
3. Faça um novo deploy

#### 3.2. No Railway (Evolution API)

1. Vá em Variables
2. Configure todas as variáveis necessárias

---

## 🖥️ Deploy Completo em VPS (Opção Avançada)

### **Passo 1: Criar VPS**

1. Crie uma conta no DigitalOcean
2. Crie um Droplet:
   - **Sistema:** Ubuntu 22.04 LTS
   - **Plano:** $6/mês (1GB RAM) ou $12/mês (2GB RAM)
   - **Região:** Escolha a mais próxima dos usuários

### **Passo 2: Configurar Servidor**

Conecte via SSH e execute:

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt install docker-compose-plugin -y

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Reiniciar sessão SSH
exit
```

### **Passo 3: Deploy da Evolution API**

```bash
# Clonar repositório (ou fazer upload dos arquivos)
git clone https://github.com/seu-usuario/Incendio.git
cd Incendio/src/services/evolution-api

# Iniciar Evolution API
docker-compose up -d

# Verificar status
docker-compose ps
```

### **Passo 4: Deploy do Frontend**

#### Opção A: Nginx (Recomendado)

```bash
# Instalar Nginx
sudo apt install nginx -y

# Fazer build do frontend
cd /home/usuario/Incendio
npm install
npm run build

# Configurar Nginx
sudo nano /etc/nginx/sites-available/incendio
```

Adicione:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    root /home/usuario/Incendio/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/incendio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Opção B: PM2 (Alternativa)

```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Fazer build
cd /home/usuario/Incendio
npm install
npm run build

# Iniciar servidor
pm2 serve dist 3000 --spa
pm2 save
pm2 startup
```

### **Passo 5: Configurar SSL (HTTPS)**

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com

# Renovação automática
sudo certbot renew --dry-run
```

### **Passo 6: Configurar Firewall**

```bash
# Permitir portas necessárias
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 8080/tcp # Evolution API (se necessário)

# Ativar firewall
sudo ufw enable
```

---

## 🔧 Configuração de Variáveis de Ambiente

### **Frontend (.env.production)**

```env
# Evolution API
VITE_EVOLUTION_API_URL=https://sua-evolution-api.com
VITE_EVOLUTION_API_KEY=INCENDO_FACIL123
VITE_EVOLUTION_INSTANCE_NAME=incendio-bot
VITE_WHATSAPP_GROUP_ID=5511999999999@g.us
```

### **Evolution API (docker-compose.yml ou Railway)**

```yaml
environment:
  - SERVER_URL=https://sua-evolution-api.com
  - DATABASE_ENABLED=true
  - DATABASE_PROVIDER=postgresql
  - DATABASE_CONNECTION_URI=postgresql://...
  - REDIS_ENABLED=true
  - REDIS_URI=redis://...
  - AUTHENTICATION_API_KEY=INCENDO_FACIL123
  - AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
```

---

## 📝 Checklist de Deploy

### Antes de fazer deploy:

- [ ] Frontend faz build sem erros (`npm run build`)
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Evolution API está rodando e acessível
- [ ] Instância WhatsApp criada e conectada
- [ ] Bot adicionado ao grupo do WhatsApp
- [ ] ID do grupo copiado e configurado

### Após deploy:

- [ ] Frontend acessível publicamente
- [ ] Login funciona
- [ ] Criação de incêndio funciona
- [ ] Mensagem WhatsApp é enviada
- [ ] PDFs carregam corretamente

---

## 🐛 Troubleshooting

### Frontend não carrega

- Verifique se o build foi feito corretamente
- Verifique variáveis de ambiente no Vercel
- Verifique console do navegador (F12)

### Evolution API não responde

- Verifique logs: `docker-compose logs evolution-api`
- Verifique se está acessível: `curl https://sua-url.com`
- Verifique firewall/VPN

### WhatsApp não envia mensagens

- Verifique se a instância está conectada
- Verifique se o bot está no grupo
- Verifique ID do grupo (formato correto)
- Verifique logs da Evolution API

### Erro CORS

- Adicione URL do frontend nas configurações da Evolution API
- Verifique headers CORS

---

## 💰 Custos Estimados

### Opção Híbrida (Recomendada)
- **Frontend (Vercel):** GRÁTIS
- **Evolution API (Railway):** GRÁTIS (plano free) ou $5-10/mês
- **Total:** $0-10/mês

### Opção VPS Completa
- **VPS (DigitalOcean):** $6-12/mês
- **Domínio:** $10-15/ano
- **Total:** ~$7-13/mês

---

## 🎯 Recomendação Final

**Para começar:** Use a **Opção Híbrida** (Vercel + Railway)
- Mais fácil de configurar
- Grátis ou muito barato
- Deploy rápido

**Para produção:** Use **VPS** se:
- Precisa de mais controle
- Tem muitos usuários
- Precisa de melhor performance
- Quer tudo em um lugar

---

## 📞 Próximos Passos

1. Escolha uma opção de deploy
2. Siga os passos acima
3. Teste tudo funcionando
4. Compartilhe o link com os usuários!

**Dúvidas?** Consulte a documentação ou abra uma issue no GitHub.

