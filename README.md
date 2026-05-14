# Obra Transparente — Sistema de Gestão de Problemas em Obra

Aplicação web para acompanhar obras de engenharia civil: problemas (“incêndios”) marcados em plantas PDF, financeiro (serviços e notas), planejamento, RDO e visão consolidada por projeto. Os dados ficam no **Firebase** (Authentication + Firestore).

## O que o sistema faz hoje

### Acesso e perfis

- **Login** com e-mail e senha (`/login`), sessão via Firebase Authentication.
- **Rotas protegidas**: páginas principais exigem usuário autenticado; sem sessão, redireciona para o login.
- **Área administrativa** (`/admin`): visível na navegação só para o e-mail configurado como administrador em `src/services/auth.ts`. Inclui:
  - **Colaboradores cadastrados** (`/admin/colaboradores`): listar e editar nome, permissão **Colaborador** (edição na obra) e **obras com acesso** (quais projetos o usuário pode abrir). Acesso à obra e papel de colaborador são independentes: sem Colaborador o usuário pode **só visualizar** as obras marcadas; com Colaborador, pode **editar** nas mesmas obras (e mais módulos, conforme a tela).
  - **Novo colaborador** (`/admin/novo-colaborador`): criar conta (Firebase) e registro em Firestore com permissão de colaborador.
- **Edição** nos módulos da obra (serviços, notas, planejamento, RDO, gastos, medição completa, incêndios no setor, etc.) exige ser **admin** ou **Colaborador** com acesso àquela obra; ver `canManageObraData(obraId)` em `src/services/auth.ts`.

### Home e obras

- **Página inicial** (`/`): grade de **obras** que o usuário pode acessar (para não administradores: obras marcadas no cadastro do colaborador; colaborador sem lista explícita no Firestore vê todas as obras cadastradas em código). Cada card leva ao **menu da obra** (`/obra/:obraId`).
- Cada obra pode ter **imagem de capa** e um conjunto de **setores** (plantas/PDFs) definidos em `src/config/setores.ts`.

### Menu da obra (`/obra/:obraId`)

- Hub visual em **“órbita”** com atalhos para os módulos da obra:
  - **Incêndios** — plantas, marcações e listas desta obra.
  - **Dashboard** — visão geral e indicadores.
  - **Planejamento** — datas e status dos serviços.
  - **Serviços** — pacotes, itens e verba (BRL).
  - **Notas** — notas fiscais vinculáveis a serviços.
  - **Gastos** — acompanhamento de gastos (notas associadas a serviços × verba).
  - **Medição** — planilhas de medição por obra (cliente e prestadores); ver seção abaixo.
  - **RDO** — lista de relatórios diários e edição por data.

### Incêndios (problemas na planta)

- Dentro da obra: **`/obra/:obraId/incendios`** com abas **Projetos** (escolha do setor/PDF), **Incêndios** (abertos) e **Resolvidos**.
- **`/setor/:setorId`**: visualizador de **PDF** (zoom), **clique na planta** para criar marcação; clique na marcação para **editar** ou **excluir**.
- Cada incêndio guarda: **disciplina**, **severidade (1–3)**, **gargalo** (destaque visual), descrição, responsável, datas (ocorreu, pretende apagar, foi apagado), coordenadas no PDF (incluindo página), criador quando aplicável.
- **Disciplinas e cores** (ver `src/utils/colors.ts`): Civil, Instalações, Equipamentos, Estrutural, Impermeabilização, Ambientação.
- **Lista com filtros**, marcar como **resolvido** (data “foi apagada”), edição em formulário modal.

### Dashboard da obra (`/obra/:obraId/dashboard`)

- Consolida **incêndios** da obra com o componente de estatísticas (totais, abertos/fechados, gargalos, atrasos por prazo, por disciplina, severidade e setor).
- Inclui **resumo** ligado a serviços, notas e RDOs da mesma obra (indicadores e valores em contexto da tela).

### Planejamento (`/obra/:obraId/planejamento`)

- Lista serviços agrupados por **pacote** com **data início**, **data término** e flag **finalizado**; referência de data para acompanhamento; persistência no Firestore para quem tem permissão de gestão.

### Serviços (`/obra/:obraId/servicos`)

- CRUD de itens de serviço: **pacote**, **descrição**, **verba**; **reordenação** de pacotes e de itens dentro do pacote.

### Notas (`/obra/:obraId/notas`)

- Cadastro de **notas fiscais**: número, data, empresa, descrição, valor; **vínculo opcional com um serviço**; busca por número/empresa.

### Gastos (`/obra/:obraId/gastos`)

- Cruza **serviços (verba)** com **notas** através de vínculos editáveis; mostra totais gastos por serviço/pacote e notas sem vínculo.

### Medição (`/obra/:obraId/medicao`)

- **Duas famílias de planilha**, gravadas no Firestore na coleção **`obraMedicoes`** (documento por `obraId`):
  - **Cliente × obra** — visível a quem acessa a obra; **edição** (colunas, valores, descontos, salvar) para admin/colaborador com permissão na obra. Quem não é colaborador vê em **leitura** esta visão e o resumo financeiro.
  - **Obra × prestador** — até **cinco** planilhas independentes (vários prestadores por obra). Em cada uma há um campo **nome do prestador** (antes da tabela); o título da aba fica **Obra ×** *nome*. Cada planilha tem colunas de medição próprias, totais e descontos próprios.
- **Linhas** alinhadas aos **serviços** da obra (pacotes na mesma ordem da página Serviços); botão para **sincronizar** com o cadastro de serviços. **Valor fechado** por linha (editável na medição).
- **Colunas de medição** dinâmicas: em cada célula informa-se o **% executado** (0–100); o sistema calcula o **abatimento em R$** como `valor fechado × (% ÷ 100)`.
- **Descontos** (uma vez por planilha, no **resumo** abaixo da tabela): **sinal** e **finalização** em **%** (0–100), aplicados sobre o **total abatido de cada coluna**. No **rodapé** da tabela aparecem, por coluna: total abatido, valor em R$ do sinal, valor em R$ da finalização e **valor real a ser pago** (abatido menos os dois descontos em R$). Há também totais no resumo (contratado, abatimentos, soma do valor real, etc.).
- **Permissões**: usuários com papel de colaborador e edição na obra acessam todas as abas e editam **Cliente × obra** e as planilhas **Obra × prestador**; os demais permanecem na visão cliente × obra em modo leitura (sem abas de prestador).

### RDO — Relatório Diário de Obra

- **Lista** (`/obra/:obraId/rdo/lista`): todos os RDOs da obra, busca, exclusão (quem pode gerir).
- **Edição por data** (`/obra/:obraId/rdo`): **clima** e **condição** por turno (manhã/tarde/noite); **atividades** (local, situação); **efetivo**; **equipamentos**; **observações**; criar/editar/excluir conforme permissão.

### Rotas auxiliares (legado / visão global)

- **`/incendios-apagados`**: lista de incêndios já resolvidos (carregamento global de coleção).
- **`/todos-incendios`**: lista global de incêndios **abertos** com filtros, resolver e editar (sem fluxo principal pelo menu atual).

### Interface

- **Navegação** com logo, Home, Admin (se aplicável), nome do usuário e **logout**; menu **responsivo** no mobile.
- **Tailwind CSS**, ícones **lucide-react**, textos em português.

## Tecnologias

- React 18, TypeScript, Vite  
- React Router DOM 6  
- Firebase (Auth + Firestore)  
- react-pdf  
- Tailwind CSS  
- date-fns  
- lucide-react  

## Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2. Ative **Authentication** (provedor E-mail/senha) e **Firestore**.
3. Preencha `src/firebase/config.ts` com as credenciais do app.

### 2.1 Regras do Firestore

Para evitar erros de permissão, publique regras alinhadas ao arquivo `firestore.rules` deste repositório (Firestore → Rules → Publish).

### 3. Obras, setores e PDFs

Edite **`src/config/setores.ts`**:

- Array **`obras`**: cada obra com `id`, `nome`, `imageUrl` (opcional) e lista **`setores`** (`id`, `nome`, `pdfPath`).
- Coloque os arquivos PDF em **`public/`** nos caminhos indicados em `pdfPath` (por exemplo `public/pdfs/...`).

### 4. Administrador

O e-mail definido como `ADMIN_EMAIL` em **`src/services/auth.ts`** acessa `/admin` e o cadastro de colaboradores. Ajuste conforme o domínio da equipe.

### 5. Executar em desenvolvimento

```bash
npm run dev
```

Por padrão o Vite sobe em `http://localhost:5173` (o script usa `--host 0.0.0.0` para acesso na rede local).

## Estrutura do projeto (resumo)

```
src/
├── components/           # PDFViewer, formulários, listas, Dashboard, rotas protegidas, Logo
├── pages/                # Home, Login, Obra (hub e submódulos), Setor (PDF), Admin, rotas auxiliares
├── services/             # auth.ts, firestore.ts
├── config/               # setores.ts — obras e setores
├── types/                # Tipos (Incendio, Obra, serviços, notas, RDO, colaborador)
├── utils/                # cores e rótulos de disciplina/severidade
├── firebase/             # config.ts
├── App.tsx               # Rotas e layout com navegação
└── main.tsx
```

## Uso resumido

1. Faça **login**.
2. Na **home**, escolha uma **obra**.
3. No **menu da obra**, abra o módulo desejado (incêndios, dashboard, planejamento, serviços, notas, gastos, medição, RDO).
4. Em **Incêndios → Projetos**, entre no **setor**; no PDF, **clique** para criar ou **clique na marcação** para editar.
5. Administradores: **Admin** para gerir **colaboradores**.

## Build para produção

```bash
npm run build
```

Saída em `dist/`.

## Licença

Projeto de uso interno.
