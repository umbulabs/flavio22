# Molduras

Aplicação web estática para criar e compartilhar artes personalizadas de campanhas. O resultado é processado inteiramente no navegador por meio da API Canvas.

## Fluxo

1. **Início:** a pessoa escolhe entre colocar o **nome** ou a **foto**.
2. **Editor:** a prévia mostra a moldura; abaixo dela ficam as miniaturas para trocar de arte e o campo de nome ou o botão para escolher a foto. No modo foto, a imagem pode ser posicionada arrastando na prévia e ampliada com pinça, roda do mouse ou o controle de zoom; ela sempre cobre a moldura inteira.
3. **Exportar:** abre o compartilhamento nativo do dispositivo (WhatsApp, Instagram etc.). Quando o navegador não oferece esse recurso, a imagem é baixada. O botão **Baixar imagem** sempre faz o download.

## Métricas (Google Analytics 4)

A tag `G-M7PPV3Y7DJ` fica em `index.html`. Além das visitas (`page_view`), o site envia:

| Evento | Quando | Parâmetros |
| --- | --- | --- |
| `select_content` | a pessoa escolhe nome ou foto na tela inicial | `content_type` (`texto` ou `foto`), `item_id` |
| `share` | o compartilhamento nativo é concluído | `method`, `content_type`, `item_id` (moldura) |
| `download_image` | a imagem é baixada | `method` (`baixar_imagem` ou `exportar`), `content_type`, `item_id` |

Para ver `content_type`, `item_id` e `method` nos relatórios, cadastre-os como dimensões personalizadas em **Administrador → Definições personalizadas** no GA4.

## Executar localmente com Docker

É necessário ter Docker com o plugin Docker Compose instalado.

```bash
docker compose up --build
```

Acesse <http://localhost:8080>. Para usar outra porta:

```bash
APP_PORT=3000 docker compose up --build
```

Para encerrar o ambiente:

```bash
docker compose down
```

## Executar sem Docker

Como o projeto não possui etapa de compilação, qualquer servidor de arquivos estáticos pode ser usado. Por exemplo:

```bash
python3 -m http.server 8080
```

Evite abrir o `index.html` diretamente pelo sistema de arquivos, pois alguns recursos do navegador exigem uma origem HTTP. O compartilhamento de arquivos também depende de HTTPS (ou `localhost`) e de suporte do navegador à Web Share API.

## Molduras disponíveis

| Parâmetro | URL local |
| --- | --- |
| `moldura-1` | <http://localhost:8080/?m=moldura-1> |
| `moldura-2` | <http://localhost:8080/?m=moldura-2> |
| `moldura-3` | <http://localhost:8080/?m=moldura-3> |
| `moldura-4` | <http://localhost:8080/?m=moldura-4> |
| `moldura-5` | <http://localhost:8080/?m=moldura-5> |

Sem o parâmetro `m`, ou quando ele for inválido, a primeira campanha cadastrada é usada. Sem o parâmetro `tipo`, a tela inicial é exibida; `tipo=texto` ou `tipo=foto` abrem o editor diretamente (ex.: <http://localhost:8080/?m=moldura-2&tipo=foto>).

## Adicionar uma moldura

1. Coloque as imagens quadradas da campanha em `imagens/`.
2. Adicione um item ao array `molduras` em `dbMolduras.js` com um `dominio` único.
3. Configure `styleText` para posicionar o nome (`translateX`, `translateY`, `maxWidth`, `fontSize`, `minFontSize`) e definir as cores: `color` para as letras e `backgroundColor` para a faixa arredondada atrás do nome. Configure também `imagens` para indicar as artes e miniaturas de texto e foto.
4. Valide a seleção, o texto e a foto em telas desktop e mobile.

As imagens `thumbnailText` e `thumbnailPhoto` controlam se a moldura aparece em cada galeria. Quando uma delas não é informada, a opção correspondente fica oculta.

## Estrutura do projeto

```text
.
├── .github/              # instruções para IAs e workflow do GitHub Pages
├── assets/               # fontes, ícones, favicon e imagem de compartilhamento
├── docker/               # configuração do servidor Nginx
├── imagens/              # artes e molduras das campanhas
├── scripts/main.js       # interação da interface e geração das imagens
├── styles/style.css      # estilos da aplicação
├── dbMolduras.js         # cadastro e configuração das campanhas
└── index.html            # página principal
```

## Publicação

O workflow `.github/workflows/deploy-pages.yml` publica o site no GitHub Pages a cada push na branch `main` e também pode ser executado manualmente na aba **Actions**.

No repositório do GitHub, configure **Settings → Pages → Build and deployment → Source** como **GitHub Actions**. O site é publicado no domínio próprio <https://flavio22.joaoeymard.dev/>, configurado pelo arquivo `CNAME` e em **Settings → Pages → Custom domain**. Ao trocar o domínio, atualize também as URLs absolutas dos metadados em `index.html`.

## Desenvolvimento assistido por IA

As orientações de arquitetura, convenções e validação para agentes de IA estão em `.github/instructions/project.instructions.md`. O arquivo `AGENTS.md` serve como ponto de entrada para ferramentas compatíveis com esse padrão.
