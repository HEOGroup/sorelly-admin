// Sorelly Admin · scripts/padrao-regras.mjs
// AS REGRAS DO PADRÃO VISUAL EM CÓDIGO (docs/design/PADRAO-VISUAL.md). Uma só lista, usada em dois lugares:
//   • scripts/hook-padrao.mjs  → confere cada edição do Claude na hora (hook PostToolUse);
//   • scripts/conferir-padrao.mjs → confere o que mudou antes de subir (npm run conferir, npm run verificar e o CI do GitHub).
// Só vale para telas e peças: src/apps/*/(pages|components|mobile) e src/shared. O que não dá para conferir em texto (R$ em todo
// valor, centralizado, compacto) fica por conta das fotos de referência (tests/fotos).
// Exceção aprovada pelo Marcus: a linha recebe o comentário `padrao-ok` e passa (ex.: `// padrao-ok: título da capa`).

export var DOC = "docs/design/PADRAO-VISUAL.md";
export var REGRAS = "Padrão visual (" + DOC + "): fonte Inter, texto de 13 px FIXO (nunca clamp/vw), rótulo e cabeçalho 11 px, número até 20 px, campo/botão/linha 32 px (h-8), cabeçalho de tabela 30 px, letras brancas (nunca cinza), todo valor em reais com R$, FILTRO SÓ NAS COLUNAS DA TABELA igual ao Google Planilhas (NUNCA bloco Filtros nem busca no topo), abas visíveis, SEM faixa de totais (blocos de números) no topo da tela, TODA TABELA = a peça TabelaPlanilha (components/tabela-planilha.js): cabeçalho escuro (layout D), SEM dourado, filtro e ordenação no cabeçalho de cada coluna igual ao Google Planilhas; nunca TabelaCampos, TabelaP, Tab/Td nem <table> à mão em tela mexida; nada abreviado (sem reticências) e tudo centralizado, peças de components/padrao.js, padrao-fin.js e tabela-planilha.js, menu do setor no padrão `menu`.";

var norm = function(f){ return String(f || "").replace(/\\/g, "/"); };

/** Tela ou peça (o hook e o conferidor só olham estes arquivos). */
export function ehTela(f){ return /(^|\/)src\/(apps\/[^/]+\/(pages|components|mobile)|shared)\/.*\.js$/.test(norm(f)); }
/** Tela do admin (regras completas). Apps de celular (mobile/) seguem só as regras de fonte flexível e limite de 20 px. */
export function ehAdmin(f){ return /(^|\/)src\/apps\/[^/]+\/(pages|components)\//.test(norm(f)) || /(^|\/)src\/shared\//.test(norm(f)); }
/** Tela nova em pages/ (precisa usar as peças do padrão). */
export function ehPagina(f){ return /(^|\/)src\/apps\/[^/]+\/pages\/.*\.js$/.test(norm(f)); }

var TAM_TEXTO = [11, 13];                       // corpo 13, rótulo e cabeçalho 11
var TAM_NUMERO_MAX = 20;                        // número até 20 px (Indicador)
var PISTA_NUMERO = /tabular-nums|brl\(|din\(|inteiro\(|Dinheiro|Indicador|\bMONO\b|n0\(|fmt\(|moeda\(|R\$/;
var PISTA_CAMPO = /"(input|select|button|textarea|tr)"|Botao|CAMPO|INPUT|MoneyInput|NumInput|CampoSel|CampoBusca|BarraFiltros|Segmentado/;
var PECAS = /@\/apps\/[^/]+\/components\/(padrao|padrao-fin|equipe-blocos|barra-menu|tabela-planilha)|@\/shared\/kanban|@\/apps\/[^/]+\/ui\/page/;

// 2g. A PEÇA DE TABELA TEM QUE SER DOURADA DE VERDADE (Marcus, 03/11/2026: "tem que colocar na trava dura"). As regras 2e e 2e-bis mandam usar TabelaP/TabelaPlanilha/TabelaOuro "porque elas já trazem o topo dourado".
// Esta conferência garante que é verdade: lê a própria peça (sempre, não só quando ela muda) e reprova se o degradê dourado sumir ou se o topo voltar a ser cinza (bg-white/5, bg-muted).
export var PECAS_TABELA = [["src/apps/montagem/components/padrao-fin.js", "TabelaP"], ["src/apps/montagem/components/tabela-planilha.js", "TabelaPlanilha"], ["src/apps/montagem/components/tabela-ouro.js", "TabelaOuro"]];
export function conferirPecaTabela(arquivo, conteudo){
  var item = PECAS_TABELA.filter(function(x){ return norm(arquivo).endsWith(x[0]); })[0];
  if(!item) return [];
  var ini = conteudo.indexOf("function " + item[1] + "(");
  if(ini < 0) return [item[1] + ": a função da peça de tabela não foi encontrada em " + item[0]];
  var resto = conteudo.slice(ini + 10), fim = resto.search(/\n(function |export )/), corpo = fim < 0 ? resto : resto.slice(0, fim), erros = [];
  if(item[1] === "TabelaPlanilha"){   // 11/11/2026: a peça única de tabela é ESCURA (layout D) e tem filtro e ordem em cada coluna
    if(!/escura\s*=\s*!p\.dourada/.test(corpo)) erros.push("TabelaPlanilha: o padrão tem que ser o cabeçalho ESCURO (var escura = !p.dourada); o dourado só com dourada:true");
    if(!/1c1d21/i.test(corpo)) erros.push("TabelaPlanilha: o fundo escuro do layout D (#1c1d21) sumiu");
    if(!/Ordenar de A a Z/.test(conteudo) || !/Ordenar de Z a A/.test(conteudo) || !/Limpar o filtro desta coluna/.test(conteudo)) erros.push("TabelaPlanilha: o menu de filtro e ordem em cada coluna (Ordenar de A a Z, de Z a A, buscar, lista de valores, Limpar o filtro) perdeu itens");
    return erros;
  }
  if(item[1] === "TabelaP"){   // 12/11/2026 (Marcus: "tire o dourado"): a TabelaP antiga também tem topo ESCURO, sem dourado
    if(!/1c1d21/i.test(corpo)) erros.push("TabelaP: o topo escuro (#1c1d21) sumiu; nada dourado desde 06/11/2026");
    if(/9A6F1E|E8B84B/i.test(corpo)) erros.push("TabelaP: o topo voltou a ser dourado; nada dourado desde 06/11/2026");
    return erros;
  }
  var dourado = /9A6F1E/i.test(corpo) || (/\bBARRA_OURO\b/.test(corpo) && /BARRA_OURO\s*=\s*\{[^}]*9A6F1E/i.test(conteudo));   // o degradê pode estar numa constante do arquivo
  if(!dourado) erros.push(item[1] + ": o topo da tabela perdeu o degradê dourado (linear-gradient(90deg,#9A6F1E,#E8B84B 48%,#F5E7BE)); toda tabela tem topo dourado em degradê");
  if(/<th|"th"/.test(corpo) && /bg-white\/5|bg-muted|bg-sidebar/.test(corpo)) erros.push(item[1] + ": cabeçalho com fundo cinza (bg-white/5, bg-muted ou bg-sidebar): o topo é dourado em degradê, UM só na tabela inteira");
  return erros;
}

/**
 * Confere linhas (novas ou mudadas) de um arquivo. Devolve a lista de erros em texto.
 * @param {string} arquivo caminho
 * @param {string[]} linhas linhas a conferir (as NOVAS no diff, ou todas num arquivo novo)
 * @param {{arquivoNovo?:boolean, conteudo?:string}} op arquivoNovo: confere também o uso das peças
 */
export function conferirLinhas(arquivo, linhas, op){
  op = op || {};
  var erros = [], admin = ehAdmin(arquivo);
  var add = function(regra, l){ erros.push(regra + ": " + l.trim().slice(0, 110)); };
  linhas.forEach(function(l){
    var t = l.trim();
    if(!t || t.indexOf("//") === 0 || t.indexOf("*") === 0 || /padrao-ok/.test(l)) return;
    var codigo = l.replace(/\/\/.*$/, "");   // ignora comentário no fim da linha

    // 1. fonte flexível (vale para tudo, inclusive celular)
    if(/text-\[(?:clamp\(|[^\]]*vw)/.test(codigo) || /fontSize\s*:\s*["'`]?(?:clamp\(|[^,}]*vw)/.test(codigo)) add("fonte com clamp/vw (use 13px fixo)", l);

    // 2. tamanho do texto
    var m, re = /text-\[(\d+(?:\.\d+)?)px\]/g;
    while((m = re.exec(codigo))){
      var n = parseFloat(m[1]);
      if(n > TAM_NUMERO_MAX) add("texto de " + m[1] + " px (máximo 20 px, corpo 13 px)", l);
      else if(admin && TAM_TEXTO.indexOf(n) < 0){
        if(n >= 14 && n <= TAM_NUMERO_MAX){ if(!PISTA_NUMERO.test(codigo)) add("texto de " + m[1] + " px só para NÚMERO (corpo 13 px, rótulo 11 px)", l); }
        else add("texto de " + m[1] + " px fora do padrão (corpo 13 px, rótulo 11 px)", l);
      }
    }
    var mi, ri = /fontSize\s*:\s*["'`]?(\d+(?:\.\d+)?)(px)?["'`]?/g;
    while((mi = ri.exec(codigo))){
      var ni = parseFloat(mi[1]);
      if(ni > TAM_NUMERO_MAX) add("fontSize de " + mi[1] + " px (máximo 20 px)", l);
      else if(admin && TAM_TEXTO.indexOf(ni) < 0 && !(ni >= 14 && PISTA_NUMERO.test(codigo))) add("fontSize solto de " + mi[1] + " px (use a classe text-[13px] ou text-[11px])", l);
    }

    if(!admin) return;

    // 2b. SEM faixa de totais (blocos de números no topo da tela). Pedido do Marcus em 02/11/2026: nunca mais.
    if(/(\be\(\s*|<)(FaixaTotais|Faixa)\b|\bimport\b[^;]*\b(FaixaTotais|Faixa)\b|^\s*(FaixaTotais|Faixa)\s*,?\s*$/.test(codigo))
      add("faixa de totais no topo da tela (proibida em 02/11/2026: comece pelo título e a tabela; o filtro fica nas colunas)", l);

    // 2c. NADA ABREVIADO (Marcus, 02/11/2026): proibido cortar texto com "…" (truncate, ellipsis, line-clamp, slice + "…"). O texto aparece inteiro: a coluna cresce ou o texto quebra em 2 linhas.
    if(/\b(truncate|text-ellipsis|line-clamp-\d+)\b|textOverflow\s*:|\.slice\([^)]*\)\s*\+\s*["'`](…|\.\.\.)["'`]|["'`](…|\.\.\.)["'`]\s*\+\s*\w/.test(codigo))
      add("texto abreviado/cortado (proibido em 02/11/2026: a coluna cresce ou o texto quebra, nunca \"…\")", l);

    // 2d. TUDO ALINHADO NO MEIO (Marcus, 02/11/2026): célula e cabeçalho de tabela sempre centralizados (nada à esquerda nem à direita).
    if(/"(td|th)"|<t[dh]\b|\bTd\b|\bTh\b|TabelaP\b|TabelaPlanilha|CabSimples|TdSimples/.test(codigo) && (/\btext-(left|right)\b|textAlign\s*:\s*["'`](left|right)|\bjustify-(start|end)\b/.test(codigo) || (/\bTd\b/.test(codigo) && /\bn\s*:\s*(true|!0)\b/.test(codigo))))
      add("célula de tabela fora do centro (proibido em 02/11/2026: tudo centralizado)", l);

    // 2e. TOPO DOURADO (Marcus, 02/11/2026): toda tabela tem cabeçalho dourado em degradê. Tabela feita à mão em pages/ não tem: use TabelaP (padrao-fin.js) ou TabelaPlanilha (tabela-planilha.js), que já trazem o topo dourado.
    if(ehPagina(arquivo) && /\be\(\s*["'](table|thead)["']|<(table|thead)\b/.test(codigo))
      add("tabela feita à mão (use TabelaPlanilha de components/tabela-planilha.js: cabeçalho escuro com filtro e ordem em cada coluna; exemplo: pages/inad/Dividas.js)", l);

    // 2e-bis. A peça antiga Tab/Td de padrao.js tem cabeçalho cinza, sem a barra dourada (02/11/2026, Marcus: "travou errado"). Em pages/ use GradeFiltro (planilha com filtro), TabelaP ou TabelaPlanilha.
    if(ehPagina(arquivo) && /\be\(\s*Tab\s*,|\bimport\b[^;]*\bTab\b[^;]*components\/padrao["']/.test(codigo))
      add("tabela com a peça antiga Tab (cabeçalho cinza): use TabelaPlanilha de components/tabela-planilha.js (filtro e ordem em cada coluna; exemplo: pages/inad/Dividas.js)", l);

    // 2h. LAYOUT D (Marcus, 06/11/2026: "não quero linhas quebradas, nada dourado, tudo ordenado"): tabela simples = TabelaCampos + FileiraCampos (padrao-fin.js): fileira de campos com fio fino, cabeçalho e total em faixa escura, colunas de largura fixa, nada quebra. TabelaP (topo dourado) não entra mais em tela mexida. (A trava reprova só na hora de editar, no hook; telas antigas que já usam TabelaP não travam o conferir nem o CI até serem mexidas.)
    if(op.aoEditar && ehPagina(arquivo) && /\be\(\s*TabelaP\s*,|\bimport\b[^;]*\bTabelaP\b[^;]*padrao-fin/.test(codigo))
      add("TabelaP (topo dourado) saiu em 06/11/2026: use TabelaPlanilha de components/tabela-planilha.js (filtro e ordem em cada coluna; exemplo: pages/inad/Dividas.js)", l);

    // 2k. UMA PEÇA DE TABELA SÓ (Marcus, 11/11/2026: "toda tabela tem que ter o filtro igual do Google Planilhas"): em tela nova ou mexida, tabela de dados = TabelaPlanilha (cabeçalho escuro, filtro e ordem em cada coluna). TabelaCampos/FileiraCampos (layout D antigo, sem filtro) e TabelaP (dourada) não entram em linha nova. Telas antigas mudam quando forem mexidas.
    if(ehPagina(arquivo) && /\be\(\s*(TabelaCampos|FileiraCampos|TabelaP)\s*,|\bimport\b[^;]*\b(TabelaCampos|FileiraCampos)\b[^;]*padrao-fin/.test(codigo))
      add("tabela sem filtro na coluna (TabelaCampos, FileiraCampos e TabelaP saíram em 11/11/2026): use TabelaPlanilha de components/tabela-planilha.js (cabeçalho escuro, filtro e ordem em cada coluna; exemplo: pages/inad/Dividas.js)", l);

    // 2l. SEM TOPO DOURADO (Marcus, 06/11/2026: "nada dourado"): a TabelaPlanilha é escura por padrão; dourada:true só existe para tela velha e não entra em linha nova.
    if(/\bdourada\s*:\s*(true|!0|1)\b/.test(codigo))
      add("tabela dourada (dourada:true saiu em 11/11/2026: a TabelaPlanilha é escura por padrão, sem dourado)", l);

    // 2f. UM DEGRADÊ SÓ (Marcus, 02/11/2026): o topo dourado é um degradê esticado na barra inteira; nunca um degradê por célula.
    if(/"(td|th)"|<t[dh]\b|\bTh\b|\bTd\b/.test(codigo) && /gradient|degrade\(/.test(codigo))
      add("degradê dentro da célula (o topo dourado é UM degradê na barra inteira, não um por célula)", l);

    // 2i. SEM CHIPS NEM PÍLULAS (Marcus, 09/11/2026: "eu não quero nunca mais isso"): botão arredondado em forma de pílula para marcar várias opções (ex.: Peito, Costas, Ombros...) é proibido. Escolha de uma opção = select (CampoSel); várias opções = menu suspenso com marcação (MenuMulti de padrao-fin.js); 2 a 5 opções da mesma visão = Segmentado.
    if(/\b(var|let|const|function)\s+chip\w*\b/.test(codigo) || (/["']button["']|<button\b/.test(codigo) && /\brounded-full\b/.test(codigo) && /\bpx-\d/.test(codigo)))
      add("chip/pílula (proibido em 09/11/2026: uma opção = select; várias = menu suspenso MenuMulti; 2 a 5 da mesma visão = Segmentado)", l);

    // 2j. FILTRO SÓ NAS COLUNAS (Marcus, 11/11/2026: "os filtros ficam nas colunas igual do Google Planilhas, trave isso"): bloco de filtros acima da tabela é proibido em tela nova ou mexida. Filtro e ordenação ficam no cabeçalho de cada coluna (TabelaPlanilha de components/tabela-planilha.js).
    if(/(\be\(\s*|<)(BlocoFiltros|BarraFiltros)\b|\bimport\b[^;]*\b(BlocoFiltros|BarraFiltros)\b/.test(codigo))
      add("bloco de filtros no topo (proibido em 11/11/2026: filtro e ordenação ficam no cabeçalho de cada coluna, igual ao Google Planilhas; use TabelaPlanilha)", l);
    // 2j-bis. O mesmo bloco FEITO À MÃO também é proibido: título "Filtros", busca (CampoBusca) ou botão "Filtrar" no topo da tela. A busca é o item "Buscar" do menu de cada coluna.
    if(ehPagina(arquivo) && (/\b(Bloco|BlocoBarra|Painel|Secao|Janela)\b[^;]*\bt\s*:\s*["'`]Filtros["'`]|\bt\s*:\s*["'`]Filtros["'`]/.test(codigo) || /\be\(\s*CampoBusca\b/.test(codigo) || /\be\(\s*Botao\b[^;]*["'`]Filtrar["'`]/.test(codigo)))
      add("filtro ou busca feito à mão no topo (proibido em 11/11/2026: o filtro fica no cabeçalho de cada coluna; use TabelaPlanilha, que já traz Buscar, ordenar e marcar valores)", l);

    // 3. altura de campo, botão e linha: 32 px (h-8); cabeçalho de tabela 30 px
    if(PISTA_CAMPO.test(codigo)){
      var ma = /\bh-(6|7|9|10|11|12)\b/.exec(codigo);
      if(ma) add("campo/botão com h-" + ma[1] + " (padrão 32 px = h-8)", l);
      var mh, rh = /\bh-\[(\d+)px\]/g;
      while((mh = rh.exec(codigo))){ var h = parseInt(mh[1], 10); if(h >= 24 && h <= 48 && h !== 30 && h !== 32) add("campo/botão com " + h + " px (padrão 32 px = h-8)", l); }
    }

    // 4. letras brancas, nunca cinza
    var mc = /\btext-(gray|slate|zinc|neutral|stone)-\d+\b/.exec(codigo);
    if(mc) add("texto cinza (" + mc[0] + "): letras brancas", l);
    var mw = /\btext-white\/([1-4]\d)\b/.exec(codigo);
    if(mw) add("texto apagado (" + mw[0] + "): letras brancas, no mínimo text-white/50", l);
  });

  // 5. tela nova em pages/ sem as peças do padrão
  if(op.arquivoNovo && ehPagina(arquivo) && !PECAS.test(op.conteudo || linhas.join("\n")))
    erros.unshift("tela nova sem as peças do padrão: importe de components/padrao.js (Pagina, Indicador), padrao-fin.js (Bloco) ou tabela-planilha.js (TabelaPlanilha, a peça única de tabela)");

  return erros;
}
