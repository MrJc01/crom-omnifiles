# OmniFiles 🚀

**OmniFiles** é um gerenciador de arquivos web moderno, rápido e seguro, construído com React e Vite. Ele oferece uma experiência de desktop no navegador, permitindo gerenciar arquivos locais e na nuvem (Google Drive, S3) em uma interface unificada.

![Preview](https://via.placeholder.com/800x450?text=OmniFiles+Preview)

## ✨ Funcionalidades Principais

-   **Gerenciamento Unificado**: Acesse arquivos locais (File System Access API), Google Drive e S3 no mesmo lugar.
-   **Performance Extrema**: Virtualização de listas para suportar milhares de arquivos sem travamentos.
-   **Segurança**: Sanitização de HTML/Markdown e arquitetura segura de tokens.
-   **Offline-First**: Funciona offline com persistência via IndexedDB (Dexie.js).
-   **Interface Rica**:
    -   Modos de visualização Grade e Lista.
    -   Drag & Drop para upload e organização.
    -   Menus de contexto nativos.
    -   Temas Dark/Slate modernos.
-   **Internacionalização**: Suporte nativo a Português (BR) e Inglês.

## 🛠️ Tecnologias

-   **Frontend**: React 18, Vite 5.
-   **Estilização**: Tailwind CSS 3.
-   **Estado & Dados**: IndexedDB (Dexie.js), React Context.
-   **Testes**: Vitest, React Testing Library.
-   **Ícones**: Lucide React.

## 🚀 Como Rodar o Projeto

### Pré-requisitos
-   Node.js 18+
-   npm ou pnpm

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/omni-files.git

# Entre na pasta
cd omni-files/app

# Instale as dependências
npm install
```

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev
```
O app estará disponível em `http://localhost:5173`.

### Build de Produção

```bash
# Gerar build otimizado
npm run build

# Visualizar build localmente
npm run preview
```

## 🧪 Testes

```bash
# Rodar testes unitários
npm test

# Rodar testes com interface gráfica
npm test -- --ui
```

## 🐳 Docker

Para rodar via Docker:

```bash
# Build da imagem
docker build -t omnifiles .

# Rodar container
docker run -p 8080:80 omnifiles
```
Acesse em `http://localhost:8080`.

## 🤝 Contribuição

Contribuições são bem-vindas! Consulte o arquivo [CONTRIBUTING.md](CONTRIBUTING.md) para diretrizes de desenvolvimento.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
