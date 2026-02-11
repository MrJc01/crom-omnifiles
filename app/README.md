# OmniFiles App 🚀

Código-fonte da aplicação web OmniFiles — gerenciador de arquivos multi-provider.

## Início Rápido

```bash
npm install
cp .env.example .env   # Configure VITE_GOOGLE_CLIENT_ID
npm run dev             # http://localhost:5173
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm test` | Testes unitários (watch) |
| `npm run test:run` | Testes unitários (CI) |
| `npm run lint` | ESLint |

## Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|----------|-----------|:-----------:|
| `VITE_GOOGLE_CLIENT_ID` | Client ID do Google OAuth 2.0 | Para Google Drive |
| `VITE_ENABLE_DEBUG` | Ativa logs de debug | Não |

## Providers Suportados

| Provider | Status | Descrição |
|----------|:------:|-----------|
| IndexedDB (Navegador) | ✅ | Armazenamento local no browser |
| File System Access API | ✅ | Acesso a pastas do PC |
| Google Drive | ✅ | CRUD completo via OAuth |
| Dropbox | 🔜 | Em breve |
| AWS S3 | 🔜 | Em breve |

## Funcionalidades Implementadas

- ✅ Grid View + List View (virtualizados com react-window)
- ✅ Upload de arquivos e pastas (recursivo)
- ✅ Download individual e em lote (ZIP)
- ✅ Copiar/Mover entre providers
- ✅ Preview de arquivos (texto, markdown, imagem, PDF, vídeo, áudio)
- ✅ Sistema de Tags com cores
- ✅ Seleção avançada (Ctrl, Shift, Drag, Long Press, Checkboxes)
- ✅ Lixeira, Favoritos, Recentes
- ✅ Menu de contexto completo
- ✅ Atalhos de teclado
- ✅ Internacionalização (PT-BR / EN)
- ✅ Tema dark moderno

## Estrutura

```
src/
├── App.jsx              # Estado principal
├── providers/           # Abstração de armazenamento
├── hooks/               # Custom hooks
├── context/             # React contexts
├── components/
│   ├── core/            # FileGrid, Preview, ContextMenu, Tags
│   ├── layout/          # Header, Sidebar, DetailsPanel
│   ├── modals/          # MoveCopyModal
│   └── settings/        # Settings, AddService, Welcome
├── locales/             # pt-br.json, en.json
└── db/                  # Schema Dexie.js
```

## 📄 Licença

Este projeto é desenvolvido por **Juan Cândido** ([Crom.Run](https://github.com/MrJc01)). O código é aberto para estudo e uso pessoal. A revenda ou exploração comercial deste software sem autorização é proibida. Para uso comercial, entre em contato: **mrj.crom@gmail.com**.

Consulte o arquivo [LICENSE](../LICENSE) para mais detalhes.
