---
applyTo: "**"
---

# Instruções do projeto para IAs

## Contexto

Este é um site estático, sem framework, gerenciador de pacotes ou etapa de compilação. Ele cria imagens de campanha no navegador usando HTML Canvas. `dbMolduras.js` expõe o array global `molduras`, consumido por `scripts/main.js`.

## Arquitetura

- `index.html`: marcação, metadados e carregamento dos recursos.
- `dbMolduras.js`: cadastro declarativo das campanhas.
- `scripts/main.js`: navegação, desenho no canvas, download e compartilhamento.
- `styles/style.css`: apresentação e responsividade.
- `assets/`: fontes e recursos compartilhados.
- `imagens/`: artes específicas de cada campanha.
- `docker/`: configuração do servidor usado no ambiente local.

`scripts/script.js` é uma implementação legada e não é carregado por `index.html`. Não adicione funcionalidades novas a esse arquivo.

## Regras para alterações

1. Use JavaScript, HTML e CSS nativos, salvo se a adoção de uma dependência for explicitamente solicitada.
2. Preserve caminhos relativos (`./assets/...`, `./imagens/...`) para que o site funcione tanto na raiz local quanto no subdiretório do GitHub Pages.
3. Não altere dimensões, proporções ou compressão das artes sem solicitação explícita; o canvas de saída mede 1080 × 1080 pixels.
4. Ao cadastrar uma campanha, use um `dominio` único e mantenha os arquivos correspondentes em `imagens/`.
5. Trate campos opcionais de campanha. A ausência de uma miniatura deve apenas ocultar a opção associada.
6. Mantenha os textos visíveis ao usuário em português do Brasil e os nomes técnicos do código consistentes com o padrão existente.
7. Não inclua segredos, tokens, dados pessoais ou arquivos gerados no repositório.
8. Atualize o `README.md` quando uma mudança alterar uso local, campanhas, estrutura ou publicação.

## Validação mínima

- Execute `node --check scripts/main.js` e `node --check dbMolduras.js`.
- Inicie `docker compose up --build -d` e confirme que `http://localhost:8080/` responde com HTTP 200.
- Teste uma campanha com nome e outra com foto.
- Verifique a URL sem parâmetro, uma URL com `?m=` válido e outra com valor inválido.
- Ao terminar a validação Docker, execute `docker compose down`.

