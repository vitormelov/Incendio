# Incendio - Sistema de Gestão de Problemas em Obra

Sistema web para gerenciamento de problemas (incêndios) em obras de engenharia civil, permitindo visualização de plantas baixas em PDF com marcações interativas.

## Funcionalidades

- 📄 Visualização de PDFs com zoom (aproximar e afastar)
- 🔴 Marcações interativas nas plantas baixas
- 🎨 Sistema de cores por disciplina:
  - Civil (Azul)
  - Elétrica (Laranja)
  - Combate a Incêndio (Vermelho)
  - Climatização (Verde)
- 🔢 Níveis de severidade (1-3):
  - 1 - Pequeno
  - 2 - Médio
  - 3 - Grande
- ⚠️ Indicador de gargalo (borda preta na marcação)
- 📝 Formulário completo com:
  - Descrição
  - Responsável
  - Data que aconteceu
  - Data pretende apagar
  - Data foi apagada
  - Status de gargalo
- 📊 Dashboard com estatísticas e atrasos
- 🔍 CRUD completo com filtros
- 📱 Design responsivo para mobile

## Tecnologias

- React 18
- TypeScript
- Firebase (Firestore)
- React-PDF
- Tailwind CSS
- React Router
- Vite

## Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative o Firestore Database
3. Copie as credenciais do seu projeto
4. Edite `src/firebase/config.ts` e substitua os valores:

```typescript
const firebaseConfig = {
  apiKey: "sua-api-key",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-project-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "seu-app-id"
};
```

### 3. Configurar Setores e PDFs

Edite `src/config/setores.ts` para adicionar seus setores e caminhos dos PDFs:

```typescript
export const setores: Setor[] = [
  {
    id: 'setor-1',
    nome: 'Setor 1',
    pdfPath: '/pdfs/setor-1.pdf'
  },
  // Adicione mais setores...
];
```

### 4. Adicionar PDFs

Coloque seus arquivos PDF na pasta `public/pdfs/` (crie a pasta se não existir).

### 5. Executar o projeto

```bash
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

## Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── PDFViewer.tsx   # Visualizador de PDF com marcações
│   ├── IncendioForm.tsx # Formulário de criação/edição
│   ├── IncendioList.tsx # Lista com filtros
│   └── Dashboard.tsx    # Dashboard com estatísticas
├── pages/              # Páginas da aplicação
│   ├── HomePage.tsx    # Página inicial
│   └── SetorPage.tsx   # Página do setor
├── services/           # Serviços
│   └── firestore.ts    # Operações com Firebase
├── config/             # Configurações
│   └── setores.ts      # Configuração de setores
├── types/              # Tipos TypeScript
│   └── index.ts        # Definições de tipos
├── utils/              # Utilitários
│   └── colors.ts       # Funções de cores
└── firebase/           # Configuração Firebase
    └── config.ts       # Config do Firebase
```

## Uso

1. **Visualizar Setor**: Clique em um setor na página inicial
2. **Adicionar Marcação**: Clique em qualquer lugar do PDF para adicionar um novo incêndio
3. **Editar Marcação**: Clique em uma marcação existente para editar
4. **Filtrar**: Use os filtros na lista de incêndios
5. **Dashboard**: Veja estatísticas e atrasos no dashboard

## Build para Produção

```bash
npm run build
```

Os arquivos estarão na pasta `dist/`.

## Licença

Este projeto é de uso interno.

