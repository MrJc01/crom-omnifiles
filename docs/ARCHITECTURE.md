# Arquitetura do Projeto

## Estrutura de Pastas

```
app/
├── public/          # Assets estáticos
├── src/
│   ├── components/  # Componentes React
│   │   ├── core/    # Componentes base (FileCard, Breadcrumb, etc.)
│   │   ├── layout/  # Estrutura (Sidebar, Header)
│   │   └── settings/# Ecrãs de configuração
│   ├── hooks/       # Custom Hooks (Lógica de negócio)
│   ├── context/     # Context API (se aplicável)
│   ├── utils/       # Funções auxiliares
│   ├── constants/   # Dados estáticos (Catalogos de serviço)
│   └── styles/      # CSS Global e Tailwind
├── docs/            # Documentação
└── package.json     # Dependências (React, Vite, Tailwind, Lucide)
```

## Gestão de Estado

A aplicação utiliza principalmente **Custom Hooks** para gerir o estado, evitando a complexidade de Redux/Context para este escopo.

- `useFileSystem`: Hook principal que gere a árvore de ficheiros, workspaces ativos e navegação.
- `useSelection`: Gere a seleção de ficheiros (click, ctrl+click).
- `useDragDrop`: Abstrai a lógica de arrastar e largar ficheiros.

## Persistência de Dados

Os dados são persistidos no `localStorage` do navegador para manter o estado entre recarregamentos.

**Chaves utilizadas:**
- `omni_workspaces_v2`: Lista de workspaces e conexões.
- `omni_files_v2`: Array plano de todos os ficheiros (com `parentId` para hierarquia).
- `omni_active_ws_v2`: ID do workspace atualmente selecionado.

## Estrutura de Dados

### File Object
```json
{
  "id": "file-123",
  "parentId": "folder-456", // null se na raiz da drive
  "name": "Imagem.png",
  "type": "image", // folder, image, video, pdf, text, file
  "size": "1.2 MB",
  "date": "Hoje",
  "content": "data:image/png;base64,..." // Conteúdo em Base64 para ficheiros locais
}
```

### Workspace Object
```json
{
  "id": "ws-123",
  "name": "Pessoal",
  "connections": [
    {
      "id": "conn-1",
      "serviceId": "browser",
      "name": "Navegador Local"
    }
  ]
}
```
