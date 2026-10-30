// Sorelly Admin · scripts/padrao-regras.mjs
// AS REGRAS DO PADRÃO VISUAL EM CÓDIGO (docs/design/PADRAO-VISUAL.md). Uma só lista, usada em dois lugares:
//   • scripts/hook-padrao.mjs  → confere cada edição do Claude na hora (hook PostToolUse);
//   • scripts/conferir-padrao.mjs → confere o que mudou antes de subir (npm run conferir, npm run verificar e o CI do GitHub).
// Só vale para telas e peças: src/apps/*/(pages|components|mobile) e src/shared. O que não dá para conferir em texto (R$ em todo
// valor, centralizado, compacto) fica por conta das fotos de referência (tests/fotos).
// Exceção aprovada pelo Marcus: a linha recebe o comentário `padrao-ok` e passa (ex.: `// padrao-ok: título da capa`).

export var DOC = "docs/design/PADRAO-VISUAL.md";
export var REGRAS = "Padrão visual (" + DOC + "): fonte Inter, texto de 13 px FIXO (nunca clamp/vw), rótulo e cabeçalho 11 px, número até 20 px, campo/botão/linha 32 px (h-8), cabeçalho de tabela 30 px, letras brancas (nunca cinza), todo valor em reais com R$, filtros no topo, abas visíveis, peças de components/padrao.js e padrao-fin.js, menu do setor no padrão `menu`.";

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
    erros.unshift("tela nova sem as peças do padrão: importe de components/padrao.js (Pagina, Faixa, Indicador, Tab, Td) ou padrao-fin.js (Bloco, FaixaTotais, TabelaP, BlocoFiltros)");

  return erros;
}
