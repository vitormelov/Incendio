# 📱 Configuração do WhatsApp - Evolution API

Este documento explica como configurar o envio automático de mensagens WhatsApp quando um incêndio é criado no sistema.

## 🚀 Resumo Rápido

Antes de começar, você precisa:
1. ✅ Ter Docker instalado (ou usar instalação manual)
2. ✅ Instalar e rodar a Evolution API
3. ✅ Criar uma instância do WhatsApp
4. ✅ Conectar seu WhatsApp via QR Code
5. ✅ Adicionar o bot ao grupo (como administrador)
6. ✅ Obter o ID do grupo

**Tempo estimado**: 15-30 minutos

**Dificuldade**: Intermediária

---

## 📋 Pré-requisitos - Guia Completo Passo a Passo

### Pré-requisito 1: Evolution API Instalada e Rodando

#### Opção A: Instalação via Docker (Recomendado)

**Passo 1.1: Instalar Docker**
- Se você ainda não tem Docker instalado:
  - **Windows**: Baixe e instale o [Docker Desktop](https://www.docker.com/products/docker-desktop/)
  - **Linux**: Siga as instruções para sua distribuição: https://docs.docker.com/engine/install/
  - **Mac**: Baixe o [Docker Desktop para Mac](https://www.docker.com/products/docker-desktop/)

**Passo 1.2: Verificar Instalação do Docker**
Abra o terminal/prompt de comando e execute:
```bash
docker --version
docker-compose --version
```
Se ambos mostrarem versões, está pronto!

**Passo 1.3: Criar Arquivo docker-compose.yml**

Você precisa criar uma pasta para a Evolution API e dentro dela criar o arquivo `docker-compose.yml`.

#### Método A: Via Interface Gráfica (Windows)

1. **Criar a pasta:**
   - Abra o **Explorador de Arquivos** (Windows + E)
   - Navegue até onde você quer criar a pasta (ex: `C:\` ou `C:\Users\Usuário\Documents`)
   - Clique com o botão direito em um espaço vazio → **Novo** → **Pasta**
   - Dê o nome `evolution-api` (ou outro nome de sua preferência)
   - Pressione Enter

2. **Criar o arquivo docker-compose.yml:**
   - Entre na pasta `evolution-api` que você acabou de criar
   - Clique com o botão direito em um espaço vazio → **Novo** → **Documento de Texto**
   - Dê o nome `docker-compose.yml` (⚠️ **IMPORTANTE**: Remova a extensão `.txt` ao renomear)
   - Quando o Windows avisar sobre mudar a extensão, clique em **Sim**
   - Abra o arquivo com o **Bloco de Notas** ou outro editor de texto
   - Cole o conteúdo abaixo:

#### Método B: Via PowerShell/Terminal (Mais Rápido)

1. Abra o **PowerShell** ou **Prompt de Comando** (Windows + R, digite `powershell`, Enter)

2. Navegue até onde quer criar a pasta:
   ```powershell
   cd C:\
   ```
   (ou `cd C:\Users\Usuário\Documents` ou onde preferir)

3. Crie a pasta e entre nela:
   ```powershell
   mkdir evolution-api
   cd evolution-api
   ```

4. Crie o arquivo docker-compose.yml:
   ```powershell
   New-Item -Name "docker-compose.yml" -ItemType File
   ```

5. Abra o arquivo para editar (você pode usar Notepad, VS Code, ou outro editor):
   ```powershell
   notepad docker-compose.yml
   ```
   (ou se tiver VS Code: `code docker-compose.yml`)

6. Cole o conteúdo abaixo no arquivo e salve (Ctrl + S):

---

**Conteúdo do arquivo docker-compose.yml:**

```yaml
version: '3.8'

services:
  evolution-api:
    image: atendai/evolution-api:latest
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=http://localhost:8080
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=sqlite
      - DATABASE_CONNECTION_URI=file:./database.sqlite
      - REDIS_ENABLED=true
      - REDIS_URI=redis://redis:6379
      - AUTHENTICATION_API_KEY=SUA_CHAVE_API_AQUI
      - AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
    volumes:
      - evolution_instances:/evolution/instances
      - evolution_store:/evolution/store
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    container_name: evolution-redis
    restart: always
    volumes:
      - evolution_redis:/data

volumes:
  evolution_instances:
  evolution_store:
  evolution_redis:
```

⚠️ **IMPORTANTE 1**: Substitua `SUA_CHAVE_API_AQUI` por uma chave segura (ex: `minha_chave_secreta_123456`). Esta será sua `VITE_EVOLUTION_API_KEY`.

⚠️ **IMPORTANTE 2**: Garanta que o arquivo se chama exatamente `docker-compose.yml` e não `docker-compose.yml.txt`. No Windows, às vezes a extensão fica oculta. Para verificar:
   - No Explorador de Arquivos, vá em **Visualizar** → marque **Extensões de nome de arquivo**
   - O arquivo deve aparecer como `docker-compose.yml` (sem `.txt` no final)
   - Se aparecer `docker-compose.yml.txt`, renomeie removendo o `.txt`

💡 **Dica**: Se estiver usando VS Code ou outro editor, ele normalmente não adiciona a extensão `.txt` automaticamente.

**Passo 1.4: Iniciar a Evolution API**
No terminal/prompt de comando, navegue até a pasta onde está o `docker-compose.yml` e execute:
```bash
docker-compose up -d
```

O `-d` significa "detached" (executar em background).

**O que acontece:**
- Docker vai baixar as imagens necessárias (pode levar alguns minutos na primeira vez)
- Vai criar os containers
- Vai iniciar a Evolution API e Redis

**Passo 1.5: Verificar se está Rodando**
Aguarde 10-30 segundos e acesse no navegador:
```
http://localhost:8080
```

**Ou verifique os logs:**
```bash
docker-compose logs -f evolution-api
```

**Ou verifique todos os containers:**
```bash
docker-compose ps
```

Você deve ver algo como:
```
NAME                STATUS          PORTS
evolution-api       Up 30 seconds   0.0.0.0:8080->8080/tcp
evolution-redis    Up 30 seconds  6379/tcp
```

**Se ver mensagens de sucesso ou a página carregar, a API está rodando!** ✅

**Problemas comuns:**
- **Porta 8080 já está em uso**: Altere a porta no docker-compose.yml (ex: `8081:8080`)
- **Docker não inicia**: Verifique se o Docker Desktop está rodando
- **Erro de permissão**: No Linux, pode precisar usar `sudo` ou adicionar seu usuário ao grupo docker

#### Opção B: Instalação Manual (Avançado)

Se preferir instalar sem Docker, siga a documentação oficial:
https://doc.evolution-api.com/v2/pt/quick-start

---

### Pré-requisito 2: Criar Instância do WhatsApp

**Passo 2.1: Criar Instância na Evolution API**

Você pode criar uma instância de duas formas:

#### Método A: Via Interface Web (se disponível)
1. Acesse `http://localhost:8080` (ou sua URL da Evolution API)
2. Procure pela opção de criar nova instância
3. Defina um nome para a instância (ex: `obra-bot`)
4. Clique em criar

#### Método B: Via API (Recomendado)

Use o Postman, Insomnia ou curl para fazer uma requisição:

**Exemplo com curl:**
```bash
curl -X POST "http://localhost:8080/instance/create" \
  -H "Content-Type: application/json" \
  -H "apikey: SUA_CHAVE_API_AQUI" \
  -d '{
    "instanceName": "obra-bot",
    "token": "",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

**Exemplo com Postman:**
- **Método**: POST
- **URL**: `http://localhost:8080/instance/create`
- **Headers**:
  - `Content-Type`: `application/json`
  - `apikey`: `SUA_CHAVE_API_AQUI`
- **Body** (raw JSON):
```json
{
  "instanceName": "obra-bot",
  "token": "",
  "qrcode": true,
  "integration": "WHATSAPP-BAILEYS"
}
```

⚠️ **IMPORTANTE**: 
- Substitua `SUA_CHAVE_API_AQUI` pela mesma chave que você definiu no docker-compose.yml
- Substitua `obra-bot` pelo nome que você quer dar à instância (será seu `VITE_EVOLUTION_INSTANCE_NAME`)

**Resposta esperada:**
```json
{
  "instance": {
    "instanceName": "obra-bot",
    "status": "created"
  },
  "qrcode": {
    "code": "data:image/png;base64,iVBORw0KGgoAAAANS..."
  },
  "message": "Instance created successfully"
}
```

**Passo 2.2: Conectar WhatsApp via QR Code**

⚠️ **IMPORTANTE**: Use um número de WhatsApp que você tem acesso e controle, pois será usado para enviar as mensagens.

1. **Obter QR Code**: Após criar a instância, você precisa conectar o WhatsApp. Faça uma requisição:

```bash
curl -X GET "http://localhost:8080/instance/connect/obra-bot" \
  -H "apikey: SUA_CHAVE_API_AQUI"
```

**Resposta esperada:**
```json
{
  "qrcode": {
    "code": "data:image/png;base64,iVBORw0KGgoAAAANS..."
  },
  "base64": "iVBORw0KGgoAAAANS...",
  "message": "QR Code generated successfully"
}
```

2. **Visualizar QR Code**:
   - Copie o `code` ou `base64` da resposta
   - Se for base64, converta para imagem (há sites online que fazem isso)
   - Ou use uma ferramenta online para visualizar: https://base64.guru/converter/decode/image
   - Ou se a Evolution API tiver interface web, acesse:
     ```
     http://localhost:8080/instance/connect/obra-bot
     ```

3. **Escanear QR Code no WhatsApp**:
   - Abra o WhatsApp no seu celular
   - Vá em **Configurações** (⚙️ no Android, ⋯ no iOS)
   - Clique em **Aparelhos conectados** (ou **Dispositivos vinculados**)
   - Clique em **Conectar um aparelho** (ou **+ Vincular dispositivo**)
   - Escaneie o QR Code que aparece na tela
   - Aguarde a mensagem "Conectado" aparecer

4. **Verificar Status da Conexão**:
Aguarde alguns segundos após escanear e verifique:

```bash
curl -X GET "http://localhost:8080/instance/fetchInstances" \
  -H "apikey: SUA_CHAVE_API_AQUI"
```

Procure pela sua instância e verifique:
- ✅ `status: "open"` = **Conectado com sucesso!**
- ❌ `status: "close"` = Não conectado, tente novamente
- ❌ `status: "connecting"` = Ainda conectando, aguarde

**Se o status estiver "open", você está pronto!** ✅

**Dica**: O QR Code expira em 30-60 segundos. Se expirar, faça a requisição novamente para gerar um novo.

✅ **Anote**: O nome da instância (ex: `obra-bot`) - será seu `VITE_EVOLUTION_INSTANCE_NAME`

---

### Pré-requisito 3: Bot Adicionado ao Grupo do WhatsApp

**Passo 3.1: Garantir que o Número é Administrador do Grupo**

⚠️ **CRÍTICO**: O número do WhatsApp usado na instância DEVE ser administrador do grupo. Caso contrário, o bot não poderá enviar mensagens.

1. Abra o grupo da obra no WhatsApp
2. Vá em **Informações do grupo** (toque no nome do grupo)
3. Verifique se o número conectado à instância aparece como **Administrador**
4. Se não for administrador, peça para alguém adicionar você como administrador

**Passo 3.2: Adicionar Bot ao Grupo (se necessário)**

1. Se o bot ainda não está no grupo:
   - Use o WhatsApp conectado à instância
   - Convide o número para o grupo (ou alguém com permissão)
   - Ou adicione você mesmo ao grupo usando o WhatsApp conectado

2. Verifique se o bot aparece na lista de participantes do grupo

**Passo 3.3: Obter ID do Grupo**

Para obter o ID do grupo (necessário para `VITE_WHATSAPP_GROUP_ID`):

#### Método A: Via API da Evolution

```bash
curl -X GET "http://localhost:8080/group/fetchAllGroups/obra-bot" \
  -H "apikey: SUA_CHAVE_API_AQUI"
```

Na resposta, você verá algo como:
```json
{
  "groups": [
    {
      "id": "5511999999999@g.us",
      "subject": "Grupo da Obra",
      "creation": 1234567890,
      "owner": "5511888888888@c.us",
      "desc": "Descrição do grupo",
      "descId": "...",
      "restrict": false,
      "announce": false,
      "participants": [...]
    }
  ]
}
```

**Copie o `id`** (formato: `5511999999999@g.us`) - este será seu `VITE_WHATSAPP_GROUP_ID`.

#### Método B: Via Console Web (se disponível)

1. Acesse a interface web da Evolution API
2. Vá em **Groups** ou **Grupos**
3. Procure pelo grupo da obra
4. Copie o ID do grupo

✅ **Anote**: O ID do grupo (ex: `5511999999999@g.us`) - será seu `VITE_WHATSAPP_GROUP_ID`

---

### Pré-requisito 4: Anotar Informações Necessárias

Agora você deve ter anotado:

1. ✅ **URL da Evolution API**: `http://localhost:8080` (ou sua URL)
2. ✅ **API Key**: A chave que você definiu no docker-compose.yml (ex: `minha_chave_secreta_123456`)
3. ✅ **Nome da Instância**: O nome que você usou ao criar (ex: `obra-bot`)
4. ✅ **ID do Grupo**: O ID obtido via API (ex: `5511999999999@g.us`)

Com essas informações, você está pronto para configurar o sistema! 🎉

## 🔧 Configuração no Sistema

### Passo 1: Criar arquivo `.env`

Copie o arquivo `.env.example` para `.env` na raiz do projeto:

```bash
cp .env.example .env
```

### Passo 2: Configurar Variáveis de Ambiente

Edite o arquivo `.env` com suas informações:

```env
# URL da sua Evolution API (sem barra no final)
VITE_EVOLUTION_API_URL=http://localhost:8080

# Chave de API da Evolution API
VITE_EVOLUTION_API_KEY=sua_chave_api_aqui

# Nome da instância criada
VITE_EVOLUTION_INSTANCE_NAME=nome_da_instancia

# ID do Grupo do WhatsApp
VITE_WHATSAPP_GROUP_ID=5511999999999@g.us
```

### Passo 3: Obter o ID do Grupo

Para obter o ID do grupo do WhatsApp, você tem duas opções:

#### Opção A: Via API da Evolution

Faça uma requisição GET:

```bash
curl -X GET "http://localhost:8080/group/fetchAllGroups/nome_da_instancia" \
  -H "apikey: sua_chave_api"
```

Na resposta, procure pelo nome do seu grupo e copie o `id` que está no formato `5511999999999@g.us`.

#### Opção B: Via Console do Evolution API

Se você tem acesso ao console web da Evolution API:
1. Acesse a interface de administração
2. Vá em "Groups" ou "Grupos"
3. Procure pelo grupo da obra
4. Copie o ID do grupo (formato: `número@g.us`)

### Passo 4: Reiniciar o Servidor

Após configurar as variáveis, reinicie o servidor de desenvolvimento:

```bash
npm run dev
```

## 📝 Formato da Mensagem

Quando um incêndio é criado, a seguinte mensagem será enviada para o grupo:

```
🔥 NOVO INCÊNDIO REGISTRADO 🔥

Criador: Nome do Usuário
Setor: Nome do Setor
Disciplina: Nome da Disciplina
Severidade: 1 - Pequeno
Responsável: Nome do Responsável
Data do Incêndio: 25/12/2024
Data a ser Apagada: 30/12/2024
É Gargalo: ✅ Sim
Descrição:
Descrição detalhada do problema

━━━━━━━━━━━━━━━━━━━━
📋 Sistema INCÊNDIO
```

## 🔍 Verificação e Troubleshooting

### Verificar se está funcionando

1. Crie um novo incêndio no sistema
2. Verifique se a mensagem aparece no grupo do WhatsApp
3. Verifique o console do navegador (F12) para logs

### Problemas Comuns

#### ❌ Mensagem não está sendo enviada

**Verifique:**
- As variáveis de ambiente estão configuradas corretamente no `.env`?
- A Evolution API está rodando e acessível?
- O ID do grupo está correto?
- O bot está no grupo e é administrador?

**Logs:**
- Abra o console do navegador (F12)
- Procure por mensagens de erro relacionadas a WhatsApp
- Mensagens de aviso indicam que a configuração não foi encontrada

#### ❌ Erro 401 (Unauthorized)

- Verifique se a `VITE_EVOLUTION_API_KEY` está correta
- Confirme que a chave de API está ativa na Evolution API

#### ❌ Erro 404 (Not Found)

- Verifique se `VITE_EVOLUTION_API_URL` está correto
- Verifique se `VITE_EVOLUTION_INSTANCE_NAME` corresponde ao nome da instância
- Confirme que a rota `/message/sendText/{instance}` está disponível na sua versão da Evolution API

#### ❌ Bot não envia mensagens no grupo

- O número usado na instância deve ser administrador do grupo
- Verifique se o bot foi adicionado ao grupo
- Alguns grupos podem ter restrições de quem pode enviar mensagens

### Desabilitar Temporariamente

Se quiser desabilitar o envio de WhatsApp sem remover o código, basta deixar as variáveis de ambiente vazias ou comentadas:

```env
# VITE_EVOLUTION_API_URL=
# VITE_EVOLUTION_API_KEY=
# VITE_EVOLUTION_INSTANCE_NAME=
# VITE_WHATSAPP_GROUP_ID=
```

O sistema continuará funcionando normalmente, apenas não enviará mensagens WhatsApp.

## 🔒 Segurança

⚠️ **IMPORTANTE:**
- Nunca commite o arquivo `.env` no Git
- O arquivo `.env` já está no `.gitignore`
- Mantenha a chave de API segura e não compartilhe

## 📚 Recursos Adicionais

- [Documentação Evolution API](https://doc.evolution-api.com/)
- [API Reference Evolution](https://doc.evolution-api.com/api/)

