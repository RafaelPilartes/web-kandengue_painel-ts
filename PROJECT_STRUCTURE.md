# Estrutura do Projeto

Este documento serve como um guia para a arquitetura e organização de arquivos deste projeto React. A estrutura foi desenhada para ser escalável, modular e fácil de manter, seguindo princípios de Clean Architecture adaptados para o frontend e o padrão MVVM (Model-View-ViewModel).

## Visão Geral da Arquitetura

O projeto utiliza uma separação clara de responsabilidades:

- **Core (Entities)**: Definições de domínio puras.
- **Services**: Lógica de comunicação com APIs e Backends (Firebase, REST).
- **ViewModels**: Gerenciamento de estado da view e regras de negócio de apresentação.
- **UI (Pages & Components)**: Camada de apresentação (React).
- **Stores**: Gerenciamento de estado global (Zustand).

## Estrutura de Diretórios (`src/`)

### 1. `core/`

Contém o núcleo do domínio da aplicação, independente de framework.

- **`entities/`**: Classes ou interfaces que representam os modelos de dados do negócio (ex: `User.ts`, `Ride.ts`). Estas entidades devem conter apenas a definição dos dados e validações simples, sem lógica de infraestrutura.
- **`interfaces/`**: Interfaces abstratas para contratos de repositórios ou gateways, permitindo inversão de dependência.

### 2. `viewModels/`

Implementa o padrão MVVM. Os ViewModels são classes ou hooks que:

- Consomem `services` para buscar ou persistir dados.
- Gerenciam o estado local complexo de uma ou mais views.
- Expõem dados e métodos prontos para consumo pela UI.
- Isolam a lógica de apresentação da renderização (UI).
- _Exemplo_: `AuthViewModel.ts` gerencia o fluxo de login, cadastro e estado de autenticação.

### 3. `services/`

Responsável pela comunicação com o mundo externo (APIs, Firebase, LocalStorage).

- Contém a lógica de "como" buscar os dados.
- Abstrai as chamadas HTTP ou SDKs de terceiros.
- Retorna dados tipados (preferencialmente mapeados para `core/entities` ou interfaces).
- _Exemplo_: `auth.service.ts`, `ride.service.ts`.

### 4. `stores/`

Gerenciamento de estado global da aplicação utilizando **Zustand**.

- Utilizado para dados que precisam ser acessados por múltiplos componentes em lugares diferentes da árvore (ex: Sessão do usuário, Tema, Carrinho).
- Pode utilizar persistência (local storage) para manter o estado entre reloads.

### 5. `modules/`

Módulos de infraestrutura e configurações específicas de bibliotecas externas.

- **`Api/`**: Configurações e instâncias de clientes HTTP (Axios) ou SDKs (Firebase). Pode conter submódulos como directory `firebase/` ou `rest/`.

### 6. `components/`

Componentes React reutilizáveis (Dumb/Presentational Components).

- Devem ser agnósticos à lógica de negócio complexa (recebem dados via props).
- Focados em UI/UX e estilo.

### 7. `pages/`

As "telas" da aplicação.

- Mapeadas para rotas.
- Atuam como "Smart Components" ou "Containers", conectando os `viewModels` e `stores` aos `components`.
- Estruturam o layout específico de cada rota.

### 8. `routes/`

Definição das rotas da aplicação (React Router).

- Configuração de navegação e proteção de rotas (Guards).

### 9. `helpers/` e `utils/`

Funções utilitárias puras.

- **`helpers/`**: Funções auxiliares que podem conter lógica de negócio específica ou formatações complexas.
- **`utils/`**: Funções genéricas e reutilizáveis em qualquer projeto (ex: formatação de data, validação de email).

### 10. `hooks/` (ou `hook/`)

Hooks customizados do React genéricos (não atrelados a um domínio específico).

- _Exemplo_: `useWindowSize`, `useLocalStorage`, `useDebounce`.
- _Nota_: Hooks de negócio devem, idealmente, ser estruturados como ViewModels ou estar dentro de pastas de domínio específicas.

### 11. `config/`

Arquivos de configuração do projeto e constantes de ambiente.

### 12. `constants/`

Valores constantes reutilizáveis (Strings, Colors, Enums, Magic Numbers).

### 13. `styles/`

Arquivos globais de estilo (CSS, SCSS, configurações de tema).

### 14. `types/`

Definições de tipos TypeScript globais ou compartilhados que não se encaixam em `core/entities`.

---

## Fluxo de Dados Recomendado

1.  **UI (Page)** interage com o usuário.
2.  **UI** chama um método do **ViewModel**.
3.  **ViewModel** chama um método do **Service**.
4.  **Service** faz a requisição via **Modules/Api** e retorna os dados.
5.  **ViewModel** atualiza seu estado interno ou invoca uma ação no **Store** (se for estado global).
6.  **UI** reage is mudanças de estado do **ViewModel** ou **Store**.

## Boas Práticas

- **Mantenha os componentes limpos**: Mova a lógica para ViewModels ou Hooks.
- **Tipagem Forte**: Use interfaces e tipos do TypeScript para garantir a integridade dos dados entra as camadas.
- **Injeção de Dependência**: Sempre que possível, injete as dependências (services) nos ViewModels para facilitar testes.
- **Nomes Descritivos**: Siga o padrão de nomenclatura estabelecido (ex: `NomeViewModel.ts`, `NomeService.ts`, `NomeComponent.tsx`).

## Como Reutilizar em Outros Projetos

Para utilizar esta estrutura em um novo projeto:

1.  Copie a estrutura de pastas de `src/`.
2.  Configure o `tsconfig.json` para suportar os _absolute paths_ se necessário (recomenda-se o uso de aliases como `@core`, `@components`).
3.  Instale as dependências principais: `react`, `zustand`, `axios` (ou `firebase`), `react-router-dom`.
4.  Adapte a camada de `modules/Api` para o backend específico do novo projeto.
