# 🕹️ CARTUCHOS ZONE — Clone Personalizado Super Nintendo (Next.js + EmulatorJS)

Clone completo de **ClassicGameZone (`/pt/snes-games?page=2`)** construído a partir da engenharia reversa realizada com o **REA (`rea-agents@6.8.0`)**, com identidade visual própria inspirada nos cartuchos de Super Nintendo (16-Bit) e emulador **EmulatorJS** integrado.

---

## ✨ Funcionalidades Incluídas

1. **Catálogo Completo Extraído via REA (`326 Jogos de SNES`)**:
   - Arquivo [`src/data/catalog.json`](./src/data/catalog.json) contendo todos os **326 jogos** (`id`, `title`, `platform`, `genre`, `year`, `description`, `series`, `imageUrl`, `isHack`) e todas as categorias da barra lateral (`23 plataformas`, `20 gêneros`, `20 séries` e `20 tags`).
2. **Filtros em Tempo Real & Paginação Sincronizada com a URL**:
   - Filtro por **Gênero** (31 gêneros traduzidos em português), **Ano** (`1990`–`2026`), **ROM Hack** (`Todos`, `Apenas ROM hacks`, `Apenas jogos oficiais`), **Série/Franquia**, **Favoritos** e **Busca instantânea**.
   - Paginação de **18 cartuchos por página** (`19 páginas` no total), suportando acesso direto como `/pt/snes-games?page=2`.
3. **Sidebar Retrátil Esquerda**:
   - Aba flutuante amarela na borda esquerda da tela para expandir/recolher rapidamente `🕹️ Consoles`, `🎮 Gêneros`, `🎯 Séries` e `🏷️ Tags`.
4. **Página de Detalhes do Jogo + Emulador EmulatorJS (`/pt/games/[id]`)**:
   - Emulador **EmulatorJS (`snes9x`)** integrado direto no navegador com suporte a **Save State / Load State**, **Tela Cheia**, **Gamepad USB/Bluetooth** e **Teclado**.
   - Botão **"Inserir Minha ROM (.sfc / .smc / .zip)"** para carregar qualquer arquivo ROM do seu computador e salvá-lo automaticamente no navegador (`IndexedDB`).
   - Rota de proxy [`src/app/api/rom/[id]/route.ts`](./src/app/api/rom/[id]/route.ts) que carrega primeiro ROMs locais colocadas em `public/roms/<id>.smc` (ou `.sfc`/`.zip`) e faz fallback automático para o servidor remoto.
5. **Criador de Cartuchos Personalizados (`+ Inserir / Criar Cartucho`)**:
   - Modal completo para cadastrar seus próprios jogos/cartuchos com capa, título, ano, gênero, série e arquivo ROM `.sfc`/`.smc`/`.zip`.

---

## 🛠️ Onde Personalizar Facilmente

- **Nome, Slogan, Textos do Banner e Configs Gerais**: edite [`src/config/site.ts`](./src/config/site.ts).
- **Cores do Tema SNES**: edite [`tailwind.config.ts`](./tailwind.config.ts).
- **Catálogo de Jogos**: edite [`src/data/catalog.json`](./src/data/catalog.json) ou use o botão **"+ Inserir / Criar Cartucho"** direto na interface.
- **ROMs Locais no Servidor**: coloque arquivos `.smc`, `.sfc` ou `.zip` dentro da pasta `public/roms/` com o ID do jogo (ex.: `public/roms/super-metroid.smc`).

---

## 🚀 Como Executar

```bash
npm run dev
```

Depois acesse:
- Catálogo Geral: `http://localhost:3000/pt/snes-games`
- Página 2 (igual ao link de referência): `http://localhost:3000/pt/snes-games?page=2`
- Página de Jogo + Emulador: `http://localhost:3000/pt/games/super-metroid`
