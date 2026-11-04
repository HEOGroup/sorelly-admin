// Sorelly Admin · scripts/padrao-regras.mjs
// AS REGRAS DO PADRÃO VISUAL EM CÓDIGO (docs/design/PADRAO-VISUAL.md). Uma só lista, usada em dois lugares:
//   • scripts/hook-padrao.mjs  → confere cada edição do Claude na hora (hook PostToolUse);
//   • scripts/conferir-padrao.mjs → confere o que mudou antes de subir (npm run conferir, npm run verificar e o CI do GitHub).
// Só vale para telas e peças: src/apps/*/(pages|components|mobile) e src/shared. O que não dá para conferir em texto (R$ em todo
// valor, centralizado, compacto) fica por conta das fotos de referência (tests/fotos).
// Exceção aprovada pelo Marcus: a linha recebe o comentário `padrao-ok` e passa (ex.: `// padrao-ok: título da capa`).

export var DOC = "docs/design/PADRAO-VISUAL.md";
export var REGRAS = "Padrão visual (" + DOC + "): fonte Inter, texto de 13 px FIXO (nunca clamp/vw), rótulo e cabeçalho 11 px, número até 20 px, campo/botão/linha 32 px (h-8), cabeçalho de tabela 30 px, letras brancas (nunca cinza), todo valor em reais com R$, filtros no topo, abas visíveis, SEM faixa de totais (blocos de números) no topo da tela, tabela com topo dourado em degradê, nada abreviado (sem reticências) e tudo centralizado, peças de components/padrao.js e padrao-fin.js, menu do setor no padrão `menu`.";

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
var PECAS = /@\/apps\/[^/]+\/components\/(padrao|padrao-fin|equipe-blocos|barra-menu)|@\/shared\/kanban|@\/apps\/[^/]+\/ui\/page/;

// 2g. A PEÇA DE TABELA TEM QUE SER DOURADA DE VERDADE (Marcus, 03/11/2026: "tem que colocar na trava dura"). As regras 2e e 2e-bis mandam usar TabelaP/TabelaPlanilha/TabelaOuro "porque elas já trazem o topo dourado".
// Esta conferência garante que é verdade: lê a própria peça (sempre, não só quando ela muda) e reprova se o degradê dourado sumir ou se o topo voltar a ser cinza (bg-white/5, bg-muted).
export var PECAS_TABELA = [["src/apps/montagem/components/padrao-fin.js", "TabelaP"], ["src/apps/montagem/components/tabela-planilha.js", "TabelaPlanilha"], ["src/apps/montagem/components/tabela-ouro.js", "TabelaOuro"]];
export function conferirPecaTabela(arquivo, conteudo){
  var item = PECAS_TABELA.filter(function(x){ return norm(arquivo).endsWith(x[0]); })[0];
  if(!item) return [];
  var ini = conteudo.indexOf("function " + item[1] + "(");
  if(ini < 0) return [item[1] + ": a função da peça de tabela não foi encontrada em " + item[0]];
  var resto = conteudo.slice(ini + 10), fim = resto.search(/\n(function |export )/), corpo = fim < 0 ? resto : resto.slice(0, fim), erros = [];
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
      add("faixa de totais no topo da tela (proibida em 02/11/2026: comece pelo título, filtros e tabela)", l);

    // 2c. NADA ABREVIADO (Marcus, 02/11/2026): proibido cortar texto com "…" (truncate, ellipsis, line-clamp, slice + "…"). O texto aparece inteiro: a coluna cresce ou o texto quebra em 2 linhas.
    if(/\b(truncate|text-ellipsis|line-clamp-\d+)\b|textOverflow\s*:|\.slice\([^)]*\)\s*\+\s*["'`](…|\.\.\.)["'`]|["'`](…|\.\.\.)["'`]\s*\+\s*\w/.test(codigo))
      add("texto abreviado/cortado (proibido em 02/11/2026: a coluna cresce ou o texto quebra, nunca \"…\")", l);

    // 2d. TUDO ALINHADO NO MEIO (Marcus, 02/11/2026): célula e cabeçalho de tabela sempre centralizados (nada à esquerda nem à direita).
    if(/"(td|th)"|<t[dh]\b|\bTd\b|\bTh\b|TabelaP\b|TabelaPlanilha|CabSimples|TdSimples/.test(codigo) && (/\btext-(left|right)\b|textAlign\s*:\s*["'`](left|right)|\bjustify-(start|end)\b/.test(codigo) || (/\bTd\b/.test(codigo) && /\bn\s*:\s*(true|!0)\b/.test(codigo))))
      add("célula de tabela fora do centro (proibido em 02/11/2026: tudo centralizado)", l);

    // 2e. TOPO DOURADO (Marcus, 02/11/2026): toda tabela tem cabeçalho dourado em degradê. Tabela feita à mão em pages/ não tem: use TabelaP (padrao-fin.js) ou TabelaPlanilha (tabela-planilha.js), que já trazem o topo dourado.
    if(ehPagina(arquivo) && /\be\(\s*["'](table|thead)["']|<(table|thead)\b/.test(codigo))
      add("tabela feita à mão (use TabelaP ou TabelaPlanilha: o topo dourado em degradê vem da peça)", l);

    // 2e-bis. A peça antiga Tab/Td de padrao.js tem cabeçalho cinza, sem a barra dourada (02/11/2026, Marcus: "travou errado"). Em pages/ use GradeFiltro (planilha com filtro), TabelaP ou TabelaPlanilha.
    if(ehPagina(arquivo) && /\be\(\s*Tab\s*,|\bimport\b[^;]*\bTab\b[^;]*components\/padrao["']/.test(codigo))
      add("tabela com a peça antiga Tab (cabeçalho cinza): use GradeFiltro, TabelaP ou TabelaPlanilha, que trazem a barra dourada inteira", l);

    // 2f. UM DEGRADÊ SÓ (Marcus, 02/11/2026): o topo dourado é um degradê esticado na barra inteira; nunca um degradê por célula.
    if(/"(td|th)"|<t[dh]\b|\bTh\b|\bTd\b/.test(codigo) && /gradient|degrade\(/.test(codigo))
      add("degradê dentro da célula (o topo dourado é UM degradê na barra inteira, não um por célula)", l);

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
    erros.unshift("tela nova sem as peças do padrão: importe de components/padrao.js (Pagina, Indicador, Tab, Td) ou padrao-fin.js (Bloco, TabelaP, BlocoFiltros)");

  return erros;
}
