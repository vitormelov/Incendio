# Variáveis de Ambiente - Projeto Incêndio

## Railway - Evolution API

**Como conectar com PostgreSQL e Redis no Railway:**

1. No serviço **PostgreSQL**, vá em **Variables** e copie o valor de `DATABASE_URL` ou `POSTGRES_URL`
2. No serviço **Redis**, vá em **Variables** e copie o valor de `REDIS_URL` (se não existir, use `REDISCLOUD_URL` ou construa manualmente)
3. No serviço **Evolution API**, cole essas URLs nas variáveis abaixo

```bash
SERVER_URL=https://seu-projeto.up.railway.app
DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=<COLE AQUI O DATABASE_URL DO SERVIÇO POSTGRESQL>
REDIS_ENABLED=true
REDIS_URI=<COLE AQUI O REDIS_URL DO SERVIÇO REDIS>
REDIS_CONNECTION_TIMEOUT=30000
REDIS_RETRY_DELAY=5000
REDIS_MAX_RETRIES=10
CACHE_REDIS_URI=<MESMA URL DO REDIS_URI - pode ser igual>
CACHE_REDIS_PREFIX_KEY=incendio_bot_
AUTHENTICATION_API_KEY=SUA_CHAVE_SECRETA_AQUI
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
CORS_ENABLED=true
CORS_ORIGIN=*
CONFIG_SESSION_PHONE_VERSION=2.3000.1029950210
```

**Nota sobre REDIS_URI e CACHE_REDIS_URI:**
- Geralmente são **iguais** (ambos apontam para o mesmo Redis)
- Se quiser usar Redis separado para cache, use URLs diferentes
- Na maioria dos casos, **use a mesma URL** para ambos

---

## Vercel - Frontend + Serverless Functions

```bash
VITE_EVOLUTION_API_URL=https://seu-projeto.up.railway.app
VITE_EVOLUTION_API_KEY=SUA_CHAVE_SECRETA_AQUI
VITE_EVOLUTION_INSTANCE_NAME=incendio-bot
VITE_WHATSAPP_GROUP_ID=120363405714962614@g.us
```

**Nota**: As funções serverless (`/api/whatsapp/send`) usam as mesmas variáveis `VITE_*`.

---

## Valores Que Devem Ser Iguais

- `SERVER_URL` (Railway) = `VITE_EVOLUTION_API_URL` (Vercel)
- `AUTHENTICATION_API_KEY` (Railway) = `VITE_EVOLUTION_API_KEY` (Vercel)
- `VITE_EVOLUTION_INSTANCE_NAME` (Vercel) = Nome da instância no Manager
- `REDIS_URI` (Railway) = `CACHE_REDIS_URI` (Railway) - geralmente iguais

---

## .env.local (Desenvolvimento Local)

```bash
VITE_EVOLUTION_API_URL=http://localhost:8080
VITE_EVOLUTION_API_KEY=INCENDO_FACIL123
VITE_EVOLUTION_INSTANCE_NAME=incendio-bot
VITE_WHATSAPP_GROUP_ID=120363405714962614@g.us
```
