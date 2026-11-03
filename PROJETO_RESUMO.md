# 🕹️ CARTUCHOS ZONE — Relatório e Base de Continuidade de Projeto

Este documento preserva todo o histórico técnico, decisões arquiteturais, estrutura de pastas e alterações implementadas na sessão de hoje (**02/11/2026**). Ele serve como base completa para continuar o desenvolvimento sem perder contexto.

---

## 📌 1. Visão Geral do Projeto

- **Objetivo**: Criar um clone personalizado do site `https://classicgamezone.com/pt/snes-games?page=2`, aproveitando a mecânica original de catálogo e emulação de Super Nintendo (SNES), porém com **identidade própria (estilo cartuchos retrô 16-bit)**, **controles na tela dedicados para smartphone sem cobrir o jogo** e **interface limpa**.
- **Ferramenta de Engenharia Reversa Utilizada**: Pasta local [`REA`](./REA) (`rea-agents@6.8.0`).
- **Stack Tecnológica do Clone**:
  - **Framework**: Next.js 15 (App Router) + TypeScript + React 19.
  - **Estilização**: Tailwind CSS com tema personalizado inspirado no SNES.
  - **Emulador In-Browser**: EmulatorJS (`snes9x`).
  - **Armazenamento de ROMs / Dados**: `IndexedDB` (para ROMs locais `.sfc`/`.smc`/`.zip`) e `LocalStorage` (para favoritos e preferências).

---

## 🛠️ 2. O Que Foi Realizado Hoje

### A. Preparação e Execução do `REA`
1. Verificado o diretório [`c:\Users\jonat\OneDrive\Desktop\CARTUCHOS\REA`](./REA).
2. Instaladas todas as dependências (`npm ci --engine-strict=false`).
3. Restaurado o binário nativo do Windows em [`REA/native/windows/build/rea-windows-x64.node`](./REA/native/windows/build/rea-windows-x64.node) e validado com `npm run verify:windows-native:artifact`.
4. Executada a captura de cenário do navegador via `node scripts/rea.mjs capture-browser-scenario` no endereço alvo (`https://classicgamezone.com/pt/snes-games?page=2` e `/pt/games/super-metroid`).
5. Exportados e analisados os scripts do cliente e extraído o payload RSC com **todos os 326 jogos de SNES** e metadados.

---

### B. Criação do Catálogo e do Projeto Next.js
1. **Catálogo Completo Gerado**: Criado [`src/data/catalog.json`](./src/data/catalog.json) com os **326 jogos de Super Nintendo**, contendo título, ano, gênero, descrição em português, capa e tag se é ROM Hack ou original, além de 23 plataformas, 20 gêneros e séries para navegação lateral.
2. **Sistema de Rotas Criado**:
   - `/pt/snes-games`: Catálogo principal com paginação (18 por página) e suporte a filtros client-side (gênero, ano, hack, busca).
   - `/pt/games/[id]`: Ficha do jogo com capa, metadados técnicos (ano, gênero, desenvolvedor, idioma), tabela de controles e jogos relacionados.
   - `/pt/play/[id]`: **Modo Tela Limpa exclusivo**, criado para rodar o jogo em tela cheia/dedicada.
   - `/api/rom/[id]`: Rota de proxy para carregar ROMs locais de `public/roms/` ou da nuvem.

---

### C. Controles na Tela para Smartphone (Zero Sobreposição)
- **Problema Inicial**: Os controles touch padrão do emulador ficavam flutuando por cima da imagem do jogo, atrapalhando a visualização.
- **Solução Desenvolvida em [`src/components/CleanGameRoom.tsx`](./src/components/CleanGameRoom.tsx)**:
  - Desativados os controles virtuais sobrepostos do EmulatorJS.
  - **Modo Retrato (Celular em pé)**:
    - Metade superior (`~50dvh`): Tela do jogo 100% desobstruída e limpa.
    - Metade inferior: Deck físico simulado do controle de Super Nintendo com D-Pad direcional suave, botões inclinados Select/Start, botões L/R no topo e os 4 botões coloridos (`X` azul, `Y` verde, `B` amarelo, `A` vermelho) com suporte a multi-touch e vibração tátil.
  - **Modo Paisagem (Celular deitado / Handheld tipo Switch)**:
    - Painel esquerdo com L + D-Pad + Select.
    - Centro com a imagem do jogo 100% visível e ampla.
    - Painel direito com R + X/Y/A/B + Start.

---

### D. Limpeza Visual Solicitada (Remoção dos Elementos Circulados de Vermelho)
Conforme as duas imagens enviadas pelo usuário, removemos todos os blocos desnecessários para deixar o site minimalista e focado no jogo:

1. **Na Barra Superior (Navbar)**:
   - Removidos os links de categorias: `Jogos (326)`, `Séries de Jogos`, `Jogos de Quebra-Cabeça` e `Explorar`.
   - Removido o botão amarelo `+ Inserir / Criar Cartucho`.
   - Removido o seletor de idiomas `Português`.
   - Removido o botão de `Favoritos` do topo da página.
2. **No Catálogo Geral (`/pt/snes-games`)**:
   - Removido o banner Hero com textos longos sobre o console e o botão *"Mostrar Mais"*.
   - Removidos os botões flutuantes da lateral direita (compartilhar link e voltar ao topo).
3. **Na Página do Jogo (`/pt/games/[id]`)**:
   - Removido o segundo player duplicado do meio da tela (*"Console Dedicado Super Nintendo"*). O botão principal **"▶ Jogar"** abaixo da capa já abre diretamente a tela limpa.
   - Removidos os botões de curtidas e de relatar problemas.
   - Removido o card duplicado *"Sobre Este Jogo"* (a sinopse já fica no topo).
   - Removida a seção de avaliações e comentários.
4. **No Rodapé (Footer)**:
   - Removidas todas as colunas de links institucionais, idiomas e botões de *"Enviar lista de desejos"*. Mantida apenas uma linha discreta de direitos autorais.

---

## 📁 3. Estrutura Principal dos Arquivos do Projeto

```text
c:\Users\jonat\OneDrive\Desktop\CARTUCHOS\
├── REA/                          # Ferramenta de engenharia reversa (configurada e operacional)
├── public/
│   └── roms/                     # Pasta para colocar ROMs locais (.smc, .sfc, .zip)
├── src/
│   ├── app/
│   │   ├── api/rom/[id]/route.ts # Rota de entrega da ROM
│   │   ├── pt/snes-games/page.tsx # Catálogo principal de cartuchos
│   │   ├── pt/games/[id]/page.tsx # Página de detalhes do jogo
│   │   ├── pt/play/[id]/page.tsx  # Tela limpa de execução do jogo
│   │   ├── error.tsx             # Tratamento de erros
│   │   ├── global-error.tsx      # Fallback de erro global
│   │   └── layout.tsx            # Layout raiz
│   ├── components/
│   │   ├── CatalogExplorer.tsx   # Filtros, busca e paginação de 18 em 18
│   │   ├── CartridgeCard.tsx     # Card do cartucho SNES com botão Jogar direto
│   │   ├── CleanGameRoom.tsx     # Tela do jogo + controles dedicados para smartphone
│   │   ├── GameDetailClient.tsx  # Ficha técnica limpa do cartucho
│   │   ├── Navbar.tsx            # Topo minimalista apenas com o logo CARTUCHOS ZONE
│   │   ├── Sidebar.tsx           # Menu retrátil lateral (consoles, gêneros, tags)
│   │   └── Footer.tsx            # Rodapé limpo
│   ├── config/
│   │   └── site.ts               # Nome, cores e textos do projeto
│   ├── data/
│   │   └── catalog.json          # 326 jogos de SNES extraídos
│   └── lib/
│       ├── catalog.ts            # Funções de busca, gêneros e mapeamento
│       └── storage.ts            # IndexedDB para ROMs e LocalStorage para favoritos
├── package.json                  # Scripts e dependências
├── next.config.mjs               # Configurações do Next.js
└── tailwind.config.ts            # Paleta de cores retro SNES
```

---

## 🚀 4. Como Iniciar o Projeto Amanhã

No terminal aberto na pasta `c:\Users\jonat\OneDrive\Desktop\CARTUCHOS`:

### Para Desenvolvimento:
```bash
npm run dev
```

### Para Produção (mais rápido e estável na rede Wi-Fi):
```bash
npm run build
npm run start
```

### Endereços de Acesso:
- **No Computador**:
  - Catálogo: `http://localhost:3000/pt/snes-games?page=2`
  - Jogo (exemplo): `http://localhost:3000/pt/play/super-metroid`
- **No Smartphone (Wi-Fi Local)**:
  - Catálogo: `http://192.168.0.147:3000/pt/snes-games?page=2`
  - Jogo direto: `http://192.168.0.147:3000/pt/play/super-metroid`

---

## 🎯 5. Próximos Passos para a Próxima Sessão
- Alinhar os próximos ajustes de layout e funcionalidades pendentes.
- Ajustes finos nos botões touch do smartphone se necessário (tamanho, sensibilidade ou posicionamento).
- Qualquer personalização extra de cores, logo ou inclusão de novos cartuchos.
