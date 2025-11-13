# Troubleshooting - Problemas Comuns

## O PDF não aparece

### 1. Verificar se o PDF existe
- O arquivo deve estar em: `public/pdfs/setor-azul.pdf`
- Verifique se o nome do arquivo está exatamente como configurado em `src/config/setores.ts`

### 2. Verificar o Console do Navegador
1. Abra o DevTools (F12)
2. Vá na aba "Console"
3. Procure por mensagens de erro ou logs:
   - "Setores carregados:" - deve mostrar o array de setores
   - "PDFViewer montado, pdfPath:" - deve mostrar o caminho do PDF
   - "PDF carregado com sucesso!" - confirma que o PDF foi carregado

### 3. Verificar Erros Comuns

#### Erro: "Failed to load PDF"
- **Causa**: O arquivo PDF não foi encontrado
- **Solução**: 
  - Verifique se o arquivo existe em `public/pdfs/`
  - Verifique se o caminho em `setores.ts` está correto
  - Tente acessar diretamente: `http://localhost:5173/pdfs/setor-azul.pdf`

#### Erro: "Worker failed to load"
- **Causa**: Problema com o worker do PDF.js
- **Solução**: 
  - Verifique sua conexão com a internet (o worker usa CDN)
  - Tente recarregar a página

#### Erro: "CORS" ou "Cross-Origin"
- **Causa**: Problema de CORS ao carregar o PDF
- **Solução**: 
  - Certifique-se de que está rodando com `npm run dev`
  - Não abra o arquivo HTML diretamente no navegador

### 4. Testar o PDF Diretamente
Abra no navegador: `http://localhost:5173/pdfs/setor-azul.pdf`

Se o PDF abrir diretamente, o problema está no componente.
Se não abrir, o problema é com o arquivo ou caminho.

### 5. Verificar Configuração do Setor
Abra `src/config/setores.ts` e verifique:
```typescript
{
  id: 'setor-azul',
  nome: 'Setor Azul',
  pdfPath: '/pdfs/setor-azul.pdf'  // Deve começar com / e corresponder ao arquivo
}
```

### 6. Limpar Cache
1. Pare o servidor (Ctrl+C)
2. Delete a pasta `node_modules` e `dist` (se existir)
3. Execute `npm install` novamente
4. Execute `npm run dev`

### 7. Verificar Versões
Certifique-se de que as dependências estão instaladas:
```bash
npm list react-pdf pdfjs-dist
```

Se algo estiver faltando:
```bash
npm install react-pdf pdfjs-dist
```

## O card do setor não aparece na Home

### Verificar
1. Abra `src/config/setores.ts`
2. Verifique se o array `setores` não está vazio
3. Verifique o console do navegador para "Setores carregados:"

## Erro ao salvar incêndio no Firebase

### Verificar
1. Abra `src/firebase/config.ts`
2. Verifique se as credenciais do Firebase estão corretas
3. No Firebase Console, verifique se o Firestore está habilitado
4. Verifique as regras de segurança do Firestore

## Ainda não funciona?

1. Abra o console do navegador (F12)
2. Copie TODAS as mensagens de erro
3. Verifique a aba "Network" para ver se há requisições falhando
4. Verifique se o servidor está rodando (`npm run dev`)

