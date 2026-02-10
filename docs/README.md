# OmniFiles - Gestor de Ficheiros

Uma aplicação moderna de gestão de ficheiros construída com React e Vite, focada em performance e design.

## Funcionalidades

- **Workspaces Múltiplos**: Organize os seus ficheiros em diferentes áreas de trabalho.
- **Conectividade**: Ligue-se a diferentes providers (Browser, Sistema Local, Cloud).
- **Gestão de Ficheiros**: Upload (Drag & Drop), criar pastas, renomear, eliminar.
- **Visualização**: Alternar entre visualização em Grelha e Lista. Pré-visualização de imagens e texto.
- **Persistência**: Os dados são guardados localmente no navegador via `localStorage`.

## Instalação

Necessita de ter o Node.js instalado.

```bash
# Entrar na pasta do projeto
cd app

# Instalar dependências
npm install
```

## Executar

```bash
# Rodar servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

## Build de Produção

```bash
npm run build
```

Os ficheiros estáticos serão gerados na pasta `dist/`.
