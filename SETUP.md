# Guia de Configuração - Incendio

## Passo a Passo para Configurar o Projeto

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto ou use um existente
3. Vá em "Project Settings" (ícone de engrenagem)
4. Role até "Your apps" e clique em "Web" (</>)
5. Registre o app e copie as credenciais
6. Abra `src/firebase/config.ts` e substitua:

```typescript
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-project-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "seu-app-id"
};
```

### 3. Configurar Firestore

1. No Firebase Console, vá em "Firestore Database"
2. Clique em "Create database"
3. Escolha "Start in test mode" (para desenvolvimento)
4. Escolha uma localização
5. Clique em "Enable"

**IMPORTANTE**: Para produção, configure as regras de segurança adequadas.

### 4. Adicionar PDFs

1. Coloque seus arquivos PDF na pasta `public/pdfs/`
2. Exemplo: `public/pdfs/setor-1.pdf`, `public/pdfs/setor-2.pdf`

### 5. Configurar Setores

Edite `src/config/setores.ts` e adicione seus setores:

```typescript
export const setores: Setor[] = [
  {
    id: 'setor-1',
    nome: 'Setor 1 - Térreo',
    pdfPath: '/pdfs/setor-1.pdf'
  },
  {
    id: 'setor-2',
    nome: 'Setor 2 - 1º Andar',
    pdfPath: '/pdfs/setor-2.pdf'
  },
  // Adicione mais setores conforme necessário
];
```

### 6. Executar o Projeto

```bash
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

## Estrutura de Dados no Firestore

O Firestore criará automaticamente uma coleção chamada `incendios` com documentos no seguinte formato:

```json
{
  "setor": "setor-1",
  "disciplina": "civil",
  "severidade": 2,
  "isGargalo": true,
  "descricao": "Descrição do problema",
  "responsavel": "Nome do Responsável",
  "dataAconteceu": "Timestamp",
  "dataPretendeApagar": "Timestamp ou null",
  "dataFoiApagada": "Timestamp ou null",
  "coordenadas": {
    "x": 45.5,
    "y": 30.2,
    "page": 1
  },
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

## Regras de Segurança do Firestore (Produção)

Para produção, configure as regras no Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /incendios/{document=**} {
      allow read, write: if request.auth != null;
      // Ou configure regras mais específicas conforme sua necessidade
    }
  }
}
```

## Troubleshooting

### PDF não carrega
- Verifique se o arquivo existe em `public/pdfs/`
- Verifique se o caminho em `setores.ts` está correto
- Verifique o console do navegador para erros

### Erro de conexão com Firebase
- Verifique se as credenciais estão corretas
- Verifique se o Firestore está habilitado
- Verifique as regras de segurança do Firestore

### Marcações não aparecem
- Verifique se os dados foram salvos no Firestore
- Verifique o console do navegador para erros
- Certifique-se de que as coordenadas estão corretas

## Próximos Passos

1. Configure autenticação (opcional)
2. Adicione mais setores conforme necessário
3. Personalize as cores e estilos
4. Configure backup automático do Firestore

