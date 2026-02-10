# Guia de Contribuição

## Standards de Código

- **Framework**: React 18+ com Hooks.
- **Estilos**: Tailwind CSS. Evite CSS customizado sempre que possível.
- **Ícones**: Lucide React.
- **Componentização**: Crie componentes pequenos e reutilizáveis em `src/components/core`.

## Fluxo de Desenvolvimento

1.  Crie uma nova feature ou fix.
2.  Garanta que os novos componentes estão na pasta correta (`core`, `layout` ou `settings`).
3.  Se adicionar lógica complexa de estado, considere criar um novo Hook em `src/hooks`.
4.  Teste manualmente as funcionalidades afetadas.

## Adicionar Novos Serviços

Para adicionar um novo serviço ao catálogo:
1.  Edite `src/constants/services.js`.
2.  Adicione a entrada no array `SERVICE_CATALOG`.
3.  Importe o ícone apropriado do `lucide-react`.
