# Crom OmniFiles

> Gerenciador de arquivos web moderno, rápido e seguro — acesse arquivos locais e na nuvem em uma interface unificada.

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-blue)
![Licença](https://img.shields.io/badge/licen%C3%A7a-Source%20Available-orange)
![React](https://img.shields.io/badge/React-18-61dafb)
![Vite](https://img.shields.io/badge/Vite-5-646cff)

## Sobre

**OmniFiles** é um gerenciador de arquivos que roda inteiramente no navegador, conectando múltiplas fontes de armazenamento (local, Google Drive, e futuramente Dropbox e AWS S3) em uma experiência única e fluida. Desenvolvido por **Juan Cândido / Crom.Run**.

---

## ✨ Funcionalidades

### Armazenamento Multi-Provider
- **Navegador Local** — Armazena arquivos temporários via IndexedDB (Dexie.js), funciona offline.
- **Sistema de Ficheiros** — Acesso direto a pastas do PC via File System Access API.
- **Google Drive** — Integração real com OAuth 2.0 (listagem, upload, download, criação de pastas, renomear, excluir).
- **Dropbox** — *Em breve*.
- **AWS S3** — *Em breve*.

### Gerenciamento de Arquivos
- 📁 Criar, renomear e excluir pastas e arquivos.
- ⬆️ Upload de arquivos e pastas (com suporte a upload recursivo).
- ⬇️ Download individual e em lote (ZIP via JSZip).
- 📋 Copiar e Colar / Recortar e Colar (Ctrl+C, Ctrl+X, Ctrl+V) — inclusive cross-provider.
- 🔄 Mover e Copiar com modal de seleção de destino (MoveCopyModal).
- 🗑️ Lixeira (Google Drive) com restauração.
- ⭐ Favoritos.
- 🕐 Arquivos recentes.

### Visualização
- **Modo Grade** — Cards visuais com ícones e informações.
- **Modo Lista** — Tabela com colunas ordenáveis (Nome, Tipo, Tamanho, Data).
- **Painel de Detalhes** — Informações detalhadas do arquivo selecionado.
- **Preview de Arquivos** — Visualização inline de texto, Markdown (sanitizado), imagens, PDFs, vídeos e áudio.
- **Listas Virtualizadas** — react-window para performance com milhares de arquivos.

### Seleção Avançada
- ✅ Checkboxes sempre visíveis para seleção rápida.
- 🖱️ Seleção múltipla com Ctrl+Click.
- 📏 Seleção em range com Shift+Click.
- 🔲 Drag Selection (clicar e arrastar no fundo para selecionar vários).
- 📱 Long Press para seleção em dispositivos touch.

### Organização
- 🏷️ Sistema de Tags com cores customizáveis.
- 📂 Workspaces com múltiplas conexões.
- 🔍 Busca por nome de arquivo.
- ↕️ Ordenação por nome, tipo, tamanho e data.

### Interface
- 🌙 Tema dark moderno com glassmorphism e backdrop-blur.
- 🌐 Internacionalização (Português BR e Inglês).
- 📱 Layout responsivo.
- ⌨️ Atalhos de teclado (Ctrl+B sidebar, Ctrl+C/X/V clipboard).
- 🔔 Sistema de Toasts para feedback de ações.
- 🧭 Breadcrumb navigation com histórico (voltar/avançar).
- 📋 Menu de contexto completo (botão direito).

### Segurança
- Sanitização de HTML/Markdown via DOMPurify.
- Tokens OAuth gerenciados sem exposição.
- Arquitetura Provider isolada.

---

## 🛠️ Tecnologias

| Categoria | Tecnologia |
|-----------|-----------|
| **Frontend** | React 18, Vite 5 |
| **Estilização** | Tailwind CSS 3 |
| **Estado** | React Context (FileSystem, Clipboard, Modal) |
| **Persistência** | IndexedDB via Dexie.js |
| **Cloud** | Google Drive API, AWS S3 SDK (em breve) |
| **Autenticação** | Google OAuth 2.0 (GSI) |
| **Virtualização** | react-window |
| **Animações** | Framer Motion |
| **i18n** | i18next + react-i18next |
| **Ícones** | Lucide React |
| **Testes** | Vitest, React Testing Library |
| **Download** | JSZip, FileSaver.js |
| **Segurança** | DOMPurify |

---

## 🏗️ Arquitetura

```
app/src/
├── App.jsx                    # App principal com toda a lógica de estado
├── main.jsx                   # Entry point
├── i18n.js                    # Configuração i18next
│
├── providers/                 # Abstração de armazenamento
│   ├── FileSystemProvider.js  # Interface base (contrato)
│   ├── IndexedDBProvider.js   # Provider local (Dexie.js)
│   ├── LocalFileSystemProvider.js # File System Access API
│   ├── GoogleDriveProvider.js # Google Drive REST API
│   ├── S3Provider.js          # AWS S3 (em desenvolvimento)
│   └── ProviderFactory.js     # Factory pattern para criação
│
├── hooks/                     # Custom React Hooks
│   ├── useFileSystem.js       # Hook principal (CRUD, navegação, upload/download)
│   ├── useSelection.js        # Gerenciamento de seleção
│   ├── useDragSelection.js    # Seleção por arrasto
│   ├── useDragDrop.js         # Drag & Drop para upload
│   ├── useTags.js             # Sistema de tags
│   ├── useGoogleAuth.js       # OAuth Google
│   ├── useLongPress.js        # Detecção long press (touch)
│   ├── useFileProcessor.js    # Processamento de conteúdo
│   └── useToast.js            # Notificações toast
│
├── context/                   # React Contexts
│   ├── FileSystemContext.jsx  # Provider de sistema de arquivos
│   ├── ClipboardContext.jsx   # Copiar/Cortar/Colar
│   └── ModalContext.jsx       # Gerenciamento de modais
│
├── components/
│   ├── core/                  # Componentes principais
│   │   ├── FileGrid.jsx       # Grid/List view (virtualizado)
│   │   ├── ContextMenu.jsx    # Menu de contexto
│   │   ├── FilePreviewModal.jsx # Preview de arquivos
│   │   ├── TagManager.jsx     # Gerenciador de tags
│   │   ├── Breadcrumb.jsx     # Navegação breadcrumb
│   │   ├── FileIcon.jsx       # Ícones por tipo
│   │   ├── EmptyState.jsx     # Estado vazio
│   │   ├── ConfirmModal.jsx   # Modal de confirmação
│   │   ├── InputModal.jsx     # Modal de input
│   │   └── ErrorBoundary.jsx  # Tratamento de erros
│   │
│   ├── layout/                # Layout da aplicação
│   │   ├── Header.jsx         # Header com ações e busca
│   │   ├── Sidebar.jsx        # Sidebar com navegação
│   │   ├── DetailsPanel.jsx   # Painel de detalhes
│   │   └── SidebarSkeleton.jsx
│   │
│   ├── modals/
│   │   └── MoveCopyModal.jsx  # Modal Mover/Copiar
│   │
│   ├── settings/              # Configurações
│   │   ├── SettingsScreen.jsx # Tela principal de settings
│   │   ├── AddServiceModal.jsx # Adicionar conexão
│   │   ├── ProviderSetup.jsx  # Configuração de provider
│   │   ├── WorkspaceSetup.jsx # Configuração de workspace
│   │   ├── WelcomeScreen.jsx  # Tela de boas-vindas
│   │   └── TagManager.jsx     # Tags em settings
│   │
│   └── ui/                    # Componentes UI base
│       └── Skeleton.jsx
│
├── locales/                   # Traduções
│   ├── pt-br.json
│   └── en.json
│
├── constants/                 # Constantes
│   └── services.js            # Catálogo de providers
│
├── db/                        # Banco de dados
│   └── index.js               # Schema Dexie.js
│
├── debug/                     # Ferramentas de debug
│   └── ...
│
└── styles/
    └── index.css              # Estilos globais + Tailwind
```

---

## 🚀 Como Rodar

### Pré-requisitos
- Node.js 18+
- npm

### Instalação

```bash
git clone https://github.com/MrJc01/crom-omnifiles.git
cd crom-omnifiles/app
npm install
```

### Configuração

Copie o arquivo de ambiente e configure suas credenciais:

```bash
cp .env.example .env
```

```env
# Google Drive Integration
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# Debugging
VITE_ENABLE_DEBUG=true
```

> Para obter um `GOOGLE_CLIENT_ID`, crie um projeto no [Google Cloud Console](https://console.cloud.google.com/) e configure as credenciais OAuth 2.0.

### Desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:5173`.

### Build de Produção

```bash
npm run build
npm run preview
```

---

## 🧪 Testes

```bash
npm test          # Rodar testes
npm run test:run  # Rodar uma vez (CI)
```

---

## 📂 Estrutura do Repositório

```
crom-omnifiles/
├── app/           # Aplicação React (código principal)
├── docs/          # Documentação técnica
│   ├── ARCHITECTURE.md
│   ├── CONTRIBUTING.md
│   └── CHANGELOG.md
├── LICENSE        # Licença Source Available
└── README.md      # Este arquivo
```

---

## 🗺️ Roadmap

- [x] Provider IndexedDB (navegador)
- [x] Provider File System Access API (local)
- [x] Provider Google Drive (OAuth + CRUD completo)
- [x] Upload de arquivos e pastas
- [x] Download individual e em lote (ZIP)
- [x] Copiar/Mover entre providers
- [x] Sistema de Tags
- [x] Preview de arquivos (texto, markdown, imagens, PDF, vídeo, áudio)
- [x] Seleção avançada (Ctrl, Shift, Drag, Long Press)
- [x] Lixeira (Google Drive)
- [x] Favoritos e Recentes
- [x] Internacionalização (PT-BR / EN)
- [ ] Provider Dropbox
- [ ] Provider AWS S3
- [ ] Compartilhamento de arquivos
- [ ] Sincronização offline
- [ ] Aplicação Desktop (Tauri/Electron)

---

## 📄 Licença

Este projeto é desenvolvido por **Juan Cândido** ([Crom.Run](https://github.com/MrJc01)). O código é aberto para estudo e uso pessoal. A revenda ou exploração comercial deste software sem autorização é proibida. Para uso comercial, entre em contato: **mrj.crom@gmail.com**.

Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.
