const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");
const $inicio = document.querySelector("#inicio");
const $editor = document.querySelector("#editor");
const $tituloEditor = document.querySelector("#titulo-editor");
const $molduraOptions = document.querySelector("#moldura-options");
const $inputText = document.querySelector("#texto-moldura");
const $inputPhoto = document.querySelector("#foto-moldura");
const $fieldText = document.querySelector("#campo-texto");
const $fieldPhoto = document.querySelector("#campo-foto");
const $btnFoto = document.querySelector("#btnFoto");
const $ajusteFoto = document.querySelector("#ajuste-foto");
const $zoomFoto = document.querySelector("#zoom-foto");
const $aviso = document.querySelector("#aviso");
const $btnExportar = document.querySelector("#btnExportar");

const TIPOS = ["texto", "foto"];

// Doação: sem chave Pix, a faixa e o modal ficam desativados.
// O QR Code em assets/pix-qrcode.svg é gerado a partir desta mesma chave.
const DOACAO = {
  chavePix: "bde0b78c-7f7d-490d-a464-0aa40c8c9bc0",
};
const DOACAO_VISTA = "molduras-doacao-vista";

const $faixaDoacao = document.querySelector("#faixaDoacao");
const $modalDoacao = document.querySelector("#modalDoacao");
const $btnContinuar = document.querySelector("#btnContinuar");
const $avisoPix = document.querySelector("#avisoPix");
const $btnQrPix = document.querySelector("#btnQrPix");
const $qrPix = document.querySelector("#qrPix");
let acaoPendente = null;
const TEXTO_EXEMPLO = "SEU NOME";
const TITULO_SITE = document.title;

let moldura = molduras[0];
let modo = null;
let baseImageFigure = new Image();
let baseImageUsuario = null;
let ajuste = { zoom: 1, x: 0, y: 0 };
let desenhoAgendado = false;
const ponteiros = new Map();
let gesto = null;
let carregamentoAtual = 0;
let navegouParaEditor = false;

const baseImgEscolhaImagem = new Image();
baseImgEscolhaImagem.onload = drawCanvas;
baseImgEscolhaImagem.src = "./assets/imgEscolhaImagem.png";

const pantonFont = new FontFace(
  "myPantonFont",
  "url(./assets/panton-extrabold.otf)"
);

pantonFont
  .load()
  .then((font) => {
    document.fonts.add(font);
    drawCanvas();
  })
  .catch(drawCanvas);

function getImagePath(item, type = modo) {
  return type === "foto" ? item.imagens.figurePhoto : item.imagens.figureText;
}

function getThumbnailPath(item, type = modo) {
  return type === "foto"
    ? item.imagens.thumbnailPhoto
    : item.imagens.thumbnailText;
}

function getMoldurasDisponiveis(type = modo) {
  return molduras.filter(
    (item) => getThumbnailPath(item, type) && getImagePath(item, type)
  );
}

/* Navegação */

function readUrl() {
  const url = new URL(window.location.href);
  const tipo = url.searchParams.get("tipo");

  modo = TIPOS.includes(tipo) ? tipo : null;
  moldura =
    molduras.find((item) => item.dominio === url.searchParams.get("m")) ||
    moldura;
}

function buildUrl(tipo) {
  const url = new URL(window.location.href);
  url.searchParams.set("m", moldura.dominio);

  if (tipo) url.searchParams.set("tipo", tipo);
  else url.searchParams.delete("tipo");

  return url;
}

function openEditor(tipo) {
  trackEvent("select_content", { content_type: tipo });
  window.history.pushState({}, "", buildUrl(tipo));
  navegouParaEditor = true;
  render();
  window.scrollTo(0, 0);
}

function goHome() {
  if (navegouParaEditor) {
    window.history.back();
    return;
  }

  window.history.replaceState({}, "", buildUrl(null));
  render();
}

function render() {
  readUrl();

  const disponiveis = modo ? getMoldurasDisponiveis() : [];
  if (modo && !disponiveis.length) modo = null;

  $inicio.classList.toggle("hidden", Boolean(modo));
  $editor.classList.toggle("hidden", !modo);
  setAviso("");

  if (!modo) {
    document.title = TITULO_SITE;
    renderInicio();
    return;
  }

  if (!disponiveis.includes(moldura)) moldura = disponiveis[0];

  $tituloEditor.textContent =
    modo === "foto" ? "Coloque sua foto" : "Coloque seu nome";
  document.title = `${$tituloEditor.textContent} · ${TITULO_SITE}`;
  $fieldText.classList.toggle("hidden", modo !== "texto");
  $fieldPhoto.classList.toggle("hidden", modo !== "foto");
  updatePhotoControls();

  renderMolduraOptions(disponiveis);
  loadFigure();
}

/* Tela inicial */

function renderInicio() {
  TIPOS.forEach((tipo) => {
    const $escolha = document.querySelector(`.escolha[data-tipo='${tipo}']`);
    const [primeira] = getMoldurasDisponiveis(tipo);

    $escolha.classList.toggle("hidden", !primeira);
  });

  const [primeiraTexto] = getMoldurasDisponiveis("texto");
  if (!primeiraTexto) return;

  const preferida = getThumbnailPath(moldura, "texto") ? moldura : primeiraTexto;
  document.querySelector("#previa-texto").src = getThumbnailPath(
    preferida,
    "texto"
  );
}

/* Editor */

function renderMolduraOptions(disponiveis) {
  const fragment = document.createDocumentFragment();

  disponiveis.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "moldura-option";
    button.dataset.dominio = item.dominio;
    button.setAttribute("aria-label", `Usar ${item.titulo}`);

    if (modo === "foto") {
      const placeholder = document.createElement("img");
      placeholder.src = baseImgEscolhaImagem.src;
      placeholder.alt = "";
      button.append(placeholder);
    }

    const thumbnail = document.createElement("img");
    thumbnail.src = getThumbnailPath(item);
    thumbnail.alt = "";
    thumbnail.loading = "lazy";

    button.append(thumbnail);
    button.addEventListener("click", () => selectMoldura(item));
    fragment.append(button);
  });

  $molduraOptions.replaceChildren(fragment);
  $molduraOptions.classList.toggle("hidden", disponiveis.length < 2);
  updateSelectedControls();
}

function updateSelectedControls() {
  $molduraOptions.querySelectorAll(".moldura-option").forEach((option) => {
    const selecionada = option.dataset.dominio === moldura.dominio;
    option.classList.toggle("selected", selecionada);
    option.setAttribute("aria-pressed", String(selecionada));
  });
}

function selectMoldura(item) {
  if (item.dominio === moldura.dominio) return;

  moldura = item;
  window.history.replaceState({}, "", buildUrl(modo));
  updateSelectedControls();
  loadFigure();
}

function setAviso(mensagem) {
  $aviso.textContent = mensagem;
}

/* Canvas */

function loadFigure() {
  const idCarregamento = ++carregamentoAtual;
  const novaImagem = new Image();

  novaImagem.onload = () => {
    if (idCarregamento !== carregamentoAtual) return;

    baseImageFigure = novaImagem;
    drawCanvas();
  };

  novaImagem.onerror = () => {
    if (idCarregamento !== carregamentoAtual) return;

    baseImageFigure = new Image();
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#063d22";
    context.font = "36px sans-serif";
    context.textAlign = "center";
    context.fillText(
      "Não foi possível carregar esta moldura.",
      canvas.width / 2,
      canvas.height / 2
    );
  };

  novaImagem.src = getImagePath(moldura);
}

function drawCanvas() {
  if (!modo || !baseImageFigure.complete || !baseImageFigure.naturalWidth)
    return;

  context.clearRect(0, 0, canvas.width, canvas.height);

  if (modo === "foto") {
    drawPhoto();
    return;
  }

  drawText();
}

function drawText() {
  context.drawImage(baseImageFigure, 0, 0, canvas.width, canvas.height);

  const textoDigitado = $inputText.value.trim();
  const texto = (textoDigitado || TEXTO_EXEMPLO).toLocaleUpperCase("pt-BR");
  const style = moldura.styleText;
  let fontSize = style.fontSize;

  const getPaddingX = (size) => size * 0.5;
  const setFont = (size) => {
    context.font = `${size}px myPantonFont, sans-serif`;
  };

  context.save();
  context.globalAlpha = textoDigitado ? 1 : 0.5;

  if (style.rotate) {
    context.translate(style.translateX, style.translateY);
    context.rotate((style.rotate * Math.PI) / 180);
    context.translate(-style.translateX, -style.translateY);
  }

  setFont(fontSize);

  while (
    context.measureText(texto).width + getPaddingX(fontSize) * 2 >
      style.maxWidth &&
    fontSize > style.minFontSize
  ) {
    fontSize -= 2;
    setFont(fontSize);
  }

  const paddingX = getPaddingX(fontSize);
  const larguraTexto = Math.min(
    context.measureText(texto).width,
    style.maxWidth - paddingX * 2
  );
  const alturaMaiuscula = context.measureText("H").actualBoundingBoxAscent;
  const larguraFaixa = larguraTexto + paddingX * 2;
  const alturaFaixa = alturaMaiuscula + fontSize * 0.6;

  if (style.backgroundColor) {
    context.save();
    context.fillStyle = style.backgroundColor;
    context.shadowColor = "rgba(0, 0, 0, 0.35)";
    context.shadowBlur = 18;
    context.shadowOffsetY = 8;
    context.beginPath();
    context.roundRect(
      style.translateX - larguraFaixa / 2,
      style.translateY - alturaFaixa / 2,
      larguraFaixa,
      alturaFaixa,
      alturaFaixa / 2
    );
    context.fill();
    context.restore();
  }

  const baseline = style.translateY + alturaMaiuscula / 2;
  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  context.fillStyle = style.color;
  context.strokeStyle = style.color;
  context.lineJoin = "round";
  context.lineWidth = fontSize * 0.05;
  context.strokeText(texto, style.translateX, baseline, larguraTexto);
  context.fillText(texto, style.translateX, baseline, larguraTexto);
  context.restore();
}

function drawPhoto() {
  if (baseImageUsuario) {
    drawUserPhoto(baseImageUsuario);
  } else if (baseImgEscolhaImagem.complete && baseImgEscolhaImagem.naturalWidth) {
    context.drawImage(baseImgEscolhaImagem, 0, 0, canvas.width, canvas.height);
  }

  context.drawImage(baseImageFigure, 0, 0, canvas.width, canvas.height);
}

/* Ajuste da foto: o zoom 1 cobre o canvas inteiro, e o deslocamento (x, y)
   é medido em pixels do canvas a partir do centro. */

function getPhotoSize(image, zoom = ajuste.zoom) {
  const cover = Math.max(
    canvas.width / image.naturalWidth,
    canvas.height / image.naturalHeight
  );

  return {
    width: image.naturalWidth * cover * zoom,
    height: image.naturalHeight * cover * zoom,
  };
}

function clampAjuste() {
  if (!baseImageUsuario) return;

  const { width, height } = getPhotoSize(baseImageUsuario);
  const limiteX = (width - canvas.width) / 2;
  const limiteY = (height - canvas.height) / 2;

  ajuste.x = Math.min(limiteX, Math.max(-limiteX, ajuste.x));
  ajuste.y = Math.min(limiteY, Math.max(-limiteY, ajuste.y));
}

function drawUserPhoto(image) {
  const { width, height } = getPhotoSize(image);

  context.drawImage(
    image,
    (canvas.width - width) / 2 + ajuste.x,
    (canvas.height - height) / 2 + ajuste.y,
    width,
    height
  );
}

function scheduleDraw() {
  if (desenhoAgendado) return;

  desenhoAgendado = true;
  requestAnimationFrame(() => {
    desenhoAgendado = false;
    drawCanvas();
  });
}

function setZoom(novoZoom, pontoX = canvas.width / 2, pontoY = canvas.height / 2) {
  const min = Number($zoomFoto.min);
  const max = Number($zoomFoto.max);
  const zoom = Math.min(max, Math.max(min, novoZoom));
  const proporcao = zoom / ajuste.zoom;

  // Mantém parado o ponto da foto que está sob o dedo ou o cursor.
  const centroX = canvas.width / 2 + ajuste.x;
  const centroY = canvas.height / 2 + ajuste.y;
  ajuste.x = pontoX + (centroX - pontoX) * proporcao - canvas.width / 2;
  ajuste.y = pontoY + (centroY - pontoY) * proporcao - canvas.height / 2;
  ajuste.zoom = zoom;

  clampAjuste();
  $zoomFoto.value = String(zoom);
  scheduleDraw();
}

function toCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: ((event.clientX - rect.left) * canvas.width) / rect.width,
    y: ((event.clientY - rect.top) * canvas.height) / rect.height,
  };
}

function getGesto() {
  const pontos = [...ponteiros.values()];
  const [a, b] = pontos;

  if (!b) return { x: a.x, y: a.y, distancia: 0 };

  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    distancia: Math.hypot(a.x - b.x, a.y - b.y),
  };
}

function onPointerDown(event) {
  if (modo !== "foto" || !baseImageUsuario) return;

  try {
    canvas.setPointerCapture(event.pointerId);
  } catch {
    // Ponteiros sintéticos não podem ser capturados; o gesto segue funcionando.
  }
  ponteiros.set(event.pointerId, toCanvasPoint(event));
  gesto = getGesto();
  canvas.classList.add("arrastando");
}

function onPointerMove(event) {
  if (!ponteiros.has(event.pointerId)) return;

  ponteiros.set(event.pointerId, toCanvasPoint(event));
  const atual = getGesto();

  ajuste.x += atual.x - gesto.x;
  ajuste.y += atual.y - gesto.y;

  if (atual.distancia && gesto.distancia) {
    setZoom(ajuste.zoom * (atual.distancia / gesto.distancia), atual.x, atual.y);
  } else {
    clampAjuste();
    scheduleDraw();
  }

  gesto = atual;
}

function onPointerUp(event) {
  ponteiros.delete(event.pointerId);
  gesto = ponteiros.size ? getGesto() : null;
  if (!ponteiros.size) canvas.classList.remove("arrastando");
}

function onWheel(event) {
  if (modo !== "foto" || !baseImageUsuario) return;

  event.preventDefault();
  const { x, y } = toCanvasPoint(event);
  setZoom(ajuste.zoom * Math.exp(-event.deltaY * 0.0015), x, y);
}

function updatePhotoControls() {
  const ajustavel = modo === "foto" && Boolean(baseImageUsuario);

  canvas.classList.toggle("clicavel", modo === "foto" && !baseImageUsuario);
  canvas.classList.toggle("ajustavel", ajustavel);
  $ajusteFoto.classList.toggle("hidden", !ajustavel);
}

function loadUserPhoto() {
  const [file] = $inputPhoto.files;
  if (!file) return;

  const imageUrl = URL.createObjectURL(file);
  const image = new Image();

  image.onload = () => {
    URL.revokeObjectURL(imageUrl);
    baseImageUsuario = image;
    ajuste = { zoom: 1, x: 0, y: 0 };
    $zoomFoto.value = "1";
    $btnFoto.textContent = "Trocar foto";
    updatePhotoControls();
    setAviso("");
    drawCanvas();
  };
  image.onerror = () => {
    URL.revokeObjectURL(imageUrl);
    setAviso("Não foi possível abrir essa imagem. Escolha outro arquivo.");
  };
  image.src = imageUrl;
}

/* Exportação */

function trackEvent(eventName, params = {}) {
  if (typeof gtag !== "function") return;

  gtag("event", eventName, {
    content_type: modo,
    item_id: moldura.dominio,
    ...params,
  });
}

function isReadyToExport() {
  if (modo === "texto" && !$inputText.value.trim()) {
    setAviso("Digite seu nome antes de exportar.");
    $inputText.focus();
    return false;
  }

  if (modo === "foto" && !baseImageUsuario) {
    setAviso("Escolha sua foto antes de exportar.");
    return false;
  }

  setAviso("");
  return true;
}

function getFileName() {
  return `${moldura.dominio}-${Date.now()}.png`;
}

function saveImage(origem = "baixar_imagem") {
  if (!isReadyToExport()) return;

  try {
    trackEvent("download_image", { method: origem });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = getFileName();
    link.click();
  } catch (error) {
    setAviso(
      "Não foi possível salvar a imagem. Tente outra vez. " +
        (error.message || error)
    );
  }
}

async function exportImage() {
  if (!isReadyToExport()) return;

  $btnExportar.disabled = true;

  try {
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    if (!blob) throw new Error("A imagem não pôde ser gerada.");

    const file = new File([blob], getFileName(), {
      type: "image/png",
      lastModified: Date.now(),
    });
    const shareData = { files: [file] };

    if (!navigator.canShare || !navigator.canShare(shareData)) {
      saveImage("exportar");
      setAviso("Imagem baixada! Agora é só postar ou enviar para os amigos.");
      return;
    }

    await navigator.share(shareData);
    trackEvent("share", { method: "compartilhamento_nativo" });
  } catch (error) {
    if (error.name === "AbortError") return;

    setAviso(
      "Não foi possível compartilhar. Use o botão “Baixar imagem”. " +
        (error.message || error)
    );
  } finally {
    $btnExportar.disabled = false;
  }
}

/* Doação */

function doacaoAtiva() {
  return Boolean(DOACAO.chavePix) && typeof $modalDoacao.showModal === "function";
}

function doacaoJaVista() {
  try {
    return localStorage.getItem(DOACAO_VISTA) === "1";
  } catch {
    return false;
  }
}

function marcarDoacaoVista() {
  try {
    localStorage.setItem(DOACAO_VISTA, "1");
  } catch {
    // Sem armazenamento, o modal pode voltar a aparecer; nada mais muda.
  }
}

function abrirDoacao(acao = null) {
  acaoPendente = acao;
  $avisoPix.textContent = "";
  toggleQrPix(false);
  $btnContinuar.textContent = acao ? "Continuar sem doar" : "Agora não";
  marcarDoacaoVista();
  trackEvent("view_donation", { method: acao ? "antes_da_acao" : "faixa" });
  $modalDoacao.showModal();
}

function comDoacao(acao) {
  if (!isReadyToExport()) return;

  if (!doacaoAtiva() || doacaoJaVista()) {
    acao();
    return;
  }

  abrirDoacao(acao);
}

function toggleQrPix(mostrar) {
  $qrPix.classList.toggle("hidden", !mostrar);
  $btnQrPix.setAttribute("aria-expanded", String(mostrar));
  $btnQrPix.textContent = mostrar ? "Ocultar QR Code" : "Mostrar QR Code";
}

async function copiarPix() {
  try {
    await navigator.clipboard.writeText(DOACAO.chavePix);
    $avisoPix.textContent = "Chave copiada! Cole no app do seu banco.";
  } catch {
    $avisoPix.textContent = `Não foi possível copiar. Chave Pix: ${DOACAO.chavePix}`;
  }

  trackEvent("copy_pix_key");
}

function setupDoacao() {
  $faixaDoacao.classList.toggle("hidden", !doacaoAtiva());
  if (!doacaoAtiva()) return;

  $faixaDoacao.addEventListener("click", () => abrirDoacao());
  document.querySelector("#btnCopiarPix").addEventListener("click", copiarPix);
  $btnQrPix.addEventListener("click", () => {
    const mostrar = $qrPix.classList.contains("hidden");
    toggleQrPix(mostrar);
    if (mostrar) trackEvent("view_pix_qrcode");
  });
  $modalDoacao.querySelectorAll("[data-fechar]").forEach((botao) => {
    botao.addEventListener("click", () => $modalDoacao.close());
  });
  $modalDoacao.addEventListener("click", (event) => {
    if (event.target === $modalDoacao) $modalDoacao.close();
  });
  // Fechar o modal de qualquer forma segue com a exportação pedida.
  $modalDoacao.addEventListener("close", () => {
    const acao = acaoPendente;
    acaoPendente = null;
    if (acao) acao();
  });
}

/* Eventos */

document.querySelectorAll(".escolha").forEach((option) => {
  option.addEventListener("click", () => openEditor(option.dataset.tipo));
});
document.querySelector("#btnVoltar").addEventListener("click", goHome);
$btnFoto.addEventListener("click", () => $inputPhoto.click());
canvas.addEventListener("click", () => {
  if (modo === "foto" && !baseImageUsuario) $inputPhoto.click();
});
canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerup", onPointerUp);
canvas.addEventListener("pointercancel", onPointerUp);
canvas.addEventListener("wheel", onWheel, { passive: false });
$zoomFoto.addEventListener("input", () => setZoom(Number($zoomFoto.value)));
document
  .querySelector("#btnZoomMenos")
  .addEventListener("click", () => setZoom(ajuste.zoom - 0.25));
document
  .querySelector("#btnZoomMais")
  .addEventListener("click", () => setZoom(ajuste.zoom + 0.25));
$inputText.addEventListener("input", () => {
  setAviso("");
  drawCanvas();
});
$inputText.addEventListener("keydown", (event) => {
  if (event.key === "Enter") $inputText.blur();
});
$inputPhoto.addEventListener("change", loadUserPhoto);
$btnExportar.addEventListener("click", () => comDoacao(exportImage));
document
  .querySelector("#btnBaixar")
  .addEventListener("click", () => comDoacao(() => saveImage()));
window.addEventListener("popstate", () => {
  navegouParaEditor = false;
  render();
});

setupDoacao();
render();
