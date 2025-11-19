# 🚂 Configuração Completa do Railway - Evolution API

Guia passo a passo completo para configurar a Evolution API no Railway com todas as variáveis necessárias e configurações para evitar erros de CORS, database e Redis.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Passo 1: Criar Projeto no Railway](#passo-1-criar-projeto-no-railway)
3. [Passo 2: Adicionar Serviços](#passo-2-adicionar-serviços)
4. [Passo 3: Configurar Evolution API](#passo-3-configurar-evolution-api)
5. [Passo 4: Configurar PostgreSQL](#passo-4-configurar-postgresql)
6. [Passo 5: Configurar Redis](#passo-5-configurar-redis)
7. [Passo 6: Configurar Variáveis de Ambiente](#passo-6-configurar-variáveis-de-ambiente)
8. [Passo 7: Configurar Vercel (Frontend)](#passo-7-configurar-vercel-frontend)
9. [Passo 8: Criar Instância WhatsApp](#passo-8-criar-instância-whatsapp)
10. [Troubleshooting](#troubleshooting)

---

## Pré-requisitos

- Conta no [Railway](https://railway.app)
- Conta no [Vercel](https://vercel.com)
- Repositório no GitHub conectado ao projeto
- WhatsApp Business ou WhatsApp Pessoal

---

## Passo 1: Criar Projeto no Railway

1. Acesse [Railway Dashboard](https://railway.app/dashboard)
2. Clique em **"New Project"**
3. Escolha **"Deploy from GitHub repo"**
4. Selecione seu repositório `Incendio`
5. Dê um nome ao projeto: `incendio-evolution-api`

---

## Passo 2: Adicionar Serviços

Você precisa de **3 serviços** no Railway:

### 2.1 Evolution API (Principal)

1. No projeto Railway, clique em **"+ New"**
2. Selecione **"Empty Service"** ou **"Deploy from Dockerfile"**
3. Nome: `evolution-api` (ou `Incendio`)

### 2.2 PostgreSQL

1. No projeto Railway, clique em **"+ New"**
2. Selecione **"Database"** → **"Add PostgreSQL"**
3. Nome: `postgres` (ou deixe o nome padrão)

### 2.3 Redis

1. No projeto Railway, clique em **"+ New"**
2. Selecione **"Database"** → **"Add Redis"**
3. Nome: `redis` (ou deixe o nome padrão)

---

## Passo 3: Configurar Evolution API

### 3.1 Configurar Dockerfile

Certifique-se de que o arquivo `src/services/evolution-api/Dockerfile` existe e contém:

```dockerfile
FROM evoapicloud/evolution-api:v2.3.4
EXPOSE 8080
```

### 3.2 Configurar Railway Build Settings

1. Clique no serviço **Evolution API**
2. Vá em **Settings** → **Deploy**
3. Configure:
   - **Root Directory**: `src/services/evolution-api`
   - **Dockerfile Path**: `./Dockerfile` (ou deixe vazio para auto-detecção)

### 3.3 Configurar Porta

1. Em **Settings** → **Networking**
2. Adicione uma porta customizada:
   - **Name**: `PORT`
   - **Value**: `8080`
   - Ou use a variável **$PORT** (Railway usa automaticamente)

---

## Passo 4: Configurar PostgreSQL

### 4.1 Obter Credenciais

1. Clique no serviço **PostgreSQL**
2. Vá em **Variables**
3. Anote as seguintes variáveis (você verá valores como):
   - `PGHOST`: `containers-us-west-xxx.railway.app`
   - `PGPORT`: `5432`
   - `PGUSER`: `postgres`
   - `PGPASSWORD`: `sua_senha_aqui`
   - `PGDATABASE`: `railway`
   - `DATABASE_URL`: `postgresql://postgres:sua_senha@containers-us-west-xxx.railway.app:5432/railway`

⚠️ **IMPORTANTE**: Anote o `PGPASSWORD` e o `PGDATABASE` - você precisará deles!

---

## Passo 5: Configurar Redis

### 5.1 Obter Credenciais

1. Clique no serviço **Redis**
2. Vá em **Variables**
3. Anote as seguintes variáveis:
   - `REDIS_URL`: `redis://default:sua_senha@containers-us-west-xxx.railway.app:6379`
   - Ou valores individuais se disponíveis

⚠️ **IMPORTANTE**: Para Railway, o Redis geralmente usa o formato interno de rede. Verifique se existe uma variável `REDIS_URL` ou construa a URL interna.

### 5.2 Verificar URL Interna

No Railway, serviços podem se comunicar internamente. Verifique:
- Se existe uma variável de referência do Redis no serviço Evolution API
- Ou use a URL pública se necessário (menos recomendado)

---

## Passo 6: Configurar Variáveis de Ambiente

⚠️ **CRÍTICO**: Configure estas variáveis **APENAS no serviço Evolution API**, não nos outros serviços!

### 6.1 Acessar Variáveis do Serviço Evolution API

1. Clique no serviço **Evolution API**
2. Vá em **Variables**
3. Clique em **"+ New Variable"** para cada variável abaixo

### 6.2 Variáveis Obrigatórias do Evolution API

Configure **TODAS** estas variáveis no serviço **Evolution API**:

#### 📌 Configuração do Servidor

```
SERVER_URL = https://seu-projeto.up.railway.app
```

⚠️ **IMPORTANTE**: 
- Substitua `seu-projeto` pelo nome real do seu projeto Railway
- Para encontrar a URL, vá em **Settings** → **Networking** → **Generate Domain**
- Ou use o domínio customizado se configurado
- **NÃO** coloque barra final (`/`) no final da URL!

#### 📌 Configuração do Banco de Dados

```
DATABASE_ENABLED = true
DATABASE_PROVIDER = postgresql
DATABASE_CONNECTION_URI = postgresql://postgres:SUA_SENHA@PGHOST:5432/railway
```

⚠️ **IMPORTANTE**: 
- Substitua `SUA_SENHA` pela senha do PostgreSQL (variável `PGPASSWORD`)
- Substitua `PGHOST` pelo host do PostgreSQL (variável `PGHOST`)
- Substitua `railway` pelo nome do banco (variável `PGDATABASE`)
- **OU** use a variável `DATABASE_URL` do serviço PostgreSQL diretamente

**Forma mais fácil**:
1. No serviço PostgreSQL, copie o valor de `DATABASE_URL`
2. Cole no serviço Evolution API como `DATABASE_CONNECTION_URI`

#### 📌 Configuração do Redis

```
REDIS_ENABLED = true
REDIS_URI = redis://default:SUA_SENHA@REDIS_HOST:6379
REDIS_CONNECTION_TIMEOUT = 30000
REDIS_RETRY_DELAY = 5000
REDIS_MAX_RETRIES = 10
CACHE_REDIS_URI = redis://default:SUA_SENHA@REDIS_HOST:6379
CACHE_REDIS_PREFIX_KEY = incendio_bot_
```

⚠️ **IMPORTANTE**: 
- Substitua `SUA_SENHA` pela senha do Redis (se houver)
- Substitua `REDIS_HOST` pelo host do Redis
- **OU** use a variável `REDIS_URL` do serviço Redis diretamente

**Forma mais fácil**:
1. No serviço Redis, copie o valor de `REDIS_URL` (se existir)
2. Cole no serviço Evolution API como `REDIS_URI` e `CACHE_REDIS_URI`

**Se não existir `REDIS_URL`**:
- Verifique a documentação do Redis no Railway
- Ou tente usar a URL pública do Redis

#### 📌 Configuração de Autenticação (API Key)

```
AUTHENTICATION_API_KEY = SUA_CHAVE_SECRETA_AQUI
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES = true
```

⚠️ **IMPORTANTE**: 
- Substitua `SUA_CHAVE_SECRETA_AQUI` por uma chave secreta forte
- Use uma string aleatória segura (ex: `INCENDO_FACIL123_xyz789`)
- **ANOTE ESTA CHAVE** - você precisará dela no Vercel!

#### 📌 Configuração de CORS (Evita Erros de CORS!)

```
CORS_ENABLED = true
CORS_ORIGIN = *
```

⚠️ **IMPORTANTE**: 
- `CORS_ORIGIN = *` permite todas as origens (para desenvolvimento)
- Para produção, você pode especificar: `CORS_ORIGIN = https://seu-app.vercel.app`
- Isso evita erros de CORS no frontend!

#### 📌 Configuração Opcional

```
CONFIG_SESSION_PHONE_VERSION = 2.3000.1029950210
```

---

## Passo 7: Configurar Vercel (Frontend)

### 7.1 Variáveis de Ambiente no Vercel

1. Acesse seu projeto no [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis:

#### 📌 Frontend (VITE_*)

```
VITE_EVOLUTION_API_URL = https://seu-projeto.up.railway.app
VITE_EVOLUTION_API_KEY = SUA_CHAVE_SECRETA_AQUI
VITE_EVOLUTION_INSTANCE_NAME = incendio-bot
VITE_WHATSAPP_GROUP_ID = 120363405714962614@g.us
```

⚠️ **IMPORTANTE**: 
- `VITE_EVOLUTION_API_URL`: Mesma URL do `SERVER_URL` do Railway
- `VITE_EVOLUTION_API_KEY`: Mesma chave do `AUTHENTICATION_API_KEY` do Railway
- `VITE_EVOLUTION_INSTANCE_NAME`: Nome da instância que você vai criar (passo 8)
- `VITE_WHATSAPP_GROUP_ID`: ID do grupo WhatsApp (formato: `numero@g.us`)

#### 📌 Backend/Serverless (Para o proxy `/api/whatsapp/send`)

As mesmas variáveis acima, mas **sem o prefixo `VITE_`**:

```
VITE_EVOLUTION_API_URL = https://seu-projeto.up.railway.app
VITE_EVOLUTION_API_KEY = SUA_CHAVE_SECRETA_AQUI
VITE_EVOLUTION_INSTANCE_NAME = incendio-bot
```

⚠️ **IMPORTANTE**: No Vercel, as variáveis `VITE_*` são expostas tanto para o frontend quanto para as funções serverless. O arquivo `api/whatsapp/send.js` usa `process.env.VITE_EVOLUTION_API_URL`, então funciona com as variáveis `VITE_*`.

---

## Passo 8: Criar Instância WhatsApp

### 8.1 Acessar Manager da Evolution API

1. Após o deploy do Railway, acesse: `https://seu-projeto.up.railway.app/manager/`
2. Você verá o Evolution API Manager

### 8.2 Criar Nova Instância

1. Clique em **"Create Instance"** ou **"Nova Instância"**
2. Configure:
   - **Instance Name**: `incendio-bot`
   - **Type**: `LOCAL` (ou o tipo que preferir)
   - Outras opções: deixe padrão
3. Clique em **"Create"**

### 8.3 Conectar WhatsApp

1. Após criar, você verá um **QR Code**
2. Abra o WhatsApp no celular
3. Vá em **Configurações** → **Aparelhos conectados** → **Conectar um aparelho**
4. Escaneie o QR Code
5. Aguarde a conexão ser estabelecida

### 8.4 Verificar Status

1. No Manager, a instância deve mostrar status **"open"** ou **"connected"**
2. Verifique se o nome da instância está correto: `incendio-bot`
3. Se estiver tudo certo, está pronto para usar!

---

## Troubleshooting

### ❌ Erro: "Database provider invalid"

**Causa**: Variável `DATABASE_PROVIDER` está incorreta ou `DATABASE_CONNECTION_URI` está malformada.

**Solução**:
1. Verifique se `DATABASE_PROVIDER = postgresql` (sem espaços!)
2. Verifique se `DATABASE_CONNECTION_URI` está no formato correto
3. Teste a conexão copiando a `DATABASE_URL` do serviço PostgreSQL

### ❌ Erro: "Redis disconnected"

**Causa**: Redis não está acessível ou URL está incorreta.

**Solução**:
1. Verifique se `REDIS_URI` está no formato correto
2. Teste copiando a `REDIS_URL` do serviço Redis
3. Se persistir, pode ser um aviso não crítico - verifique se a API funciona mesmo assim

### ❌ Erro: "CORS policy" no navegador

**Causa**: CORS não está configurado no Evolution API.

**Solução**:
1. Verifique se `CORS_ENABLED = true` no Railway
2. Verifique se `CORS_ORIGIN = *` (ou seu domínio Vercel)
3. Faça redeploy do serviço Evolution API após mudar as variáveis

### ❌ Erro: "The 'incendio-bot' instance does not exist"

**Causa**: A instância não foi criada ou o nome está diferente.

**Solução**:
1. Acesse `https://seu-projeto.up.railway.app/manager/`
2. Verifique se a instância `incendio-bot` existe e está conectada
3. Verifique o nome exato (maiúsculas/minúsculas importam)
4. Crie a instância se não existir (Passo 8)

### ❌ Erro: "404 Not Found" ao enviar mensagem

**Causa**: URL da API está incorreta ou instância não existe.

**Solução**:
1. Verifique se `SERVER_URL` no Railway não tem barra final
2. Verifique se `VITE_EVOLUTION_API_URL` no Vercel está correto
3. Verifique se a instância existe no Manager
4. Teste acessar `https://seu-projeto.up.railway.app/manager/` para confirmar que a API está rodando

### ❌ Container reiniciando constantemente

**Causa**: Variáveis de ambiente incorretas ou faltando.

**Solução**:
1. Verifique os logs do Railway (clique no serviço → **Deployments** → **View Logs**)
2. Procure por erros específicos nos logs
3. Verifique se todas as variáveis obrigatórias estão configuradas
4. Verifique se não há espaços extras nas variáveis

### ❌ Deploy falhando no Railway

**Causa**: Dockerfile não encontrado ou caminho incorreto.

**Solução**:
1. Verifique se `Root Directory` está configurado como `src/services/evolution-api`
2. Verifique se o arquivo `src/services/evolution-api/Dockerfile` existe
3. Faça commit e push do Dockerfile para o repositório

---

## 📝 Checklist Final

Antes de testar, confirme:

- [ ] Serviço Evolution API criado no Railway
- [ ] Serviço PostgreSQL criado e conectado
- [ ] Serviço Redis criado e conectado
- [ ] Todas as variáveis de ambiente configuradas no serviço Evolution API
- [ ] `SERVER_URL` configurado (sem barra final!)
- [ ] `DATABASE_CONNECTION_URI` configurado corretamente
- [ ] `REDIS_URI` configurado corretamente
- [ ] `AUTHENTICATION_API_KEY` configurada
- [ ] `CORS_ENABLED = true` e `CORS_ORIGIN = *`
- [ ] Variáveis configuradas no Vercel (`VITE_*`)
- [ ] Evolution API Manager acessível (`/manager/`)
- [ ] Instância `incendio-bot` criada e conectada
- [ ] WhatsApp conectado e mostrando status "open"

---

## 🎉 Pronto!

Agora você pode:
1. Criar um novo incêndio no sistema
2. A mensagem será enviada automaticamente para o grupo WhatsApp
3. Verificar os logs no Railway se algo der errado

---

## 📞 Ajuda Adicional

Se ainda tiver problemas:
1. Verifique os logs do Railway (serviço Evolution API)
2. Verifique os logs do Vercel (função `/api/whatsapp/send`)
3. Verifique o console do navegador (F12)
4. Compare suas variáveis com este guia

**Lembre-se**: Após alterar variáveis de ambiente, é necessário fazer **redeploy** do serviço!

