# Guia de Contribuição - OmniFiles

Obrigado pelo interesse em contribuir para o OmniFiles! 🎉
Este documento define os padrões e processos para garantir a qualidade e consistência do projeto.

## 🚀 Primeiros Passos

1.  Faça um **Fork** do repositório.
2.  Clone o seu fork: `git clone https://github.com/SEU_USER/omni-files.git`.
3.  Crie uma **Branch** para sua feature/fix: `git checkout -b feature/minha-feature`.
4.  Instale as dependências: `npm install`.

## 📐 Estrutura do Projeto

```
src/
├── components/     # Componentes React
│   ├── core/       # Componentes complexos de negócio (FileGrid, etc)
│   ├── layout/     # Estrutura (Sidebar, Header)
│   ├── ui/         # Componentes primitivos (Button, Input)
│   └── settings/   # Telas de configuração
├── hooks/          # Custom Hooks (Lógica de estado)
├── context/        # React Contexts (Modal, etc)
├── db/             # Configuração do Dexie (IndexedDB)
├── providers/      # Adaptadores de Storage (Local, Drive, S3)
└── locales/        # Arquivos de tradução (i18n)
```

## 💻 Padrões de Código

### Estilo
-   Utilizamos **ESLint** para linting. Certifique-se de que não há erros antes de commitar.
-   Priorize **Componentes Funcionais** e Hooks.
-   Use **Tailwind CSS** para estilização. Evite CSS/SASS arquivos separados, exceto para globais.

### Commits
Siga o padrão [Conventional Commits](https://www.conventionalcommits.org/):
-   `feat: adiciona suporte a S3`
-   `fix: corrige erro de upload`
-   `docs: atualiza README`
-   `style: formata código`
-   `refactor: melhora lógica de hooks`

## 🧪 Testes

Todo novo código deve ser testado.
-   Execute `npm test` para garantir que nada quebrou.
-   Se criar uma nova feature, adicione testes unitários em `src/__tests__` ou junto ao componente `.test.jsx`.

## 🚢 Pull Requests

1.  Descreva claramente o que foi feito no PR.
2.  Anexe prints ou vídeos se houver mudanças visuais.
3.  Certifique-se de que o CI (GitHub Actions) passou.
4.  Aguarde a revisão.

## 🐛 Reportando Bugs

Use a aba [Issues](https://github.com/seu-usuario/omni-files/issues) para reportar bugs. Inclua:
-   Passos para reproduzir.
-   Comportamento esperado vs. real.
-   Screenshots ou logs do console.

Obrigado por ajudar a construir o OmniFiles! 💙
