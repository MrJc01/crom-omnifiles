# Changelog

## [1.0.0] - 2024-05-22

### Adicionado
- Estrutura inicial do projeto migrada para Vite + React.
- Arquitetura modular com separação de componentes e hooks.
- **Sistema de Ficheiros**:
    - Navegação por pastas e breadcrumbs.
    - Criação de pastas e ficheiros (upload).
    - Renomear e eliminar ficheiros.
    - Drag & Drop para upload.
- **Interface**:
    - Sidebar com gestão de Workspaces e Favoritos.
    - Modos de visualização Grelha e Lista.
    - Pesquisa em tempo real.
    - Menu de contexto (clique direito) funcional.
- **Settings**:
    - Gestão de conexões (Browser, Local, Cloud).
    - Configuração de Workspaces.

### Alterado
- Refatoração completa do ficheiro único `index.html` para estrutura de aplicação moderna.
- Substituição do polyfill manual de ícones pela biblioteca `lucide-react`.
