// Sorelly Admin · scripts/padrao-regras.mjs
// AS REGRAS DO PADRÃO VISUAL EM CÓDIGO (docs/design/PADRAO-VISUAL.md). Uma só lista, usada em dois lugares:
//   • scripts/hook-padrao.mjs  → confere cada edição do Claude na hora (hook PostToolUse);
//   • scripts/conferir-padrao.mjs → confere o que mudou antes de subir (npm run conferir, npm run verificar e o CI do GitHub).
// Só vale para telas e peças: src/apps/*/(pages|components|mobile) e src/shared. O que não dá para conferir em texto (R$ em todo
// valor, centralizado, medida real na tela) fica por conta das fotos de referência e do teste de medidas (tests/fotos).
// Exceção aprovada pelo Marcus: a linha recebe o comentário `padrao-ok: motivo e data` e passa (ex.: `// padrao-ok: título da capa, Marcus 20/11/2026`).
//
// PADRÃO DE 25/11/2026 (medido nas 4 telas de referência do Financeiro). O que a trava confere, em resumo:
//   texto            10 ou 11 px (tabela, campo, seletor, botão); 13 px só no título; 14 a 20 px só em número; nunca text-sm/text-lg, clamp ou vw
//   altura           controle e linha de 18 a 24 px (h-[18px], h-5, h-6). 30/32 px (h-8) = LEGADO: passa em arquivo que já existia, reprova em arquivo NOVO
//   escrita          sem caixa alta (uppercase), sem reticências, sem cinza
//   tabela           só TabelaPlanilha; sem faixa de totais, sem bloco "Filtros", sem chips, tudo no centro
//   peças            planilha-cheia.js e bloco-painel.js guardam as medidas (10 px, 18 px, borda branca 30%): conferidas SEMPRE (conferirPecaTabela)
// POR QUE 30/32 px AINDA PASSA EM ARQUIVO ANTIGO: a regra lê linha por linha e não sabe se a tela inteira é do visual antigo (Montagem, Representantes) ou do novo.
// Um botão de 18 px sozinho numa tela de 32 px fica pior que o legado. O Marcus ainda decide se essas telas migram (docs/pendencias/design-system.local.md).

export var DOC = "docs/design/PADRAO-VISUAL.md";
export var REGRAS = "Padrão visual (" + DOC + "), medido nas telas do Financeiro (Contas a pagar e a receber, Home da família, Negociações): Inter; tabela, campo, seletor e botão 10 px (Home da família 11 px), linha 18 a 24 px, controle 18 px; cabeçalho azul #1F3358 negrito; borda branca fina em toda célula; tudo centralizado; título 13 px negrito; texto branco, verde entra, vermelho sai; sem caixa alta; sem faixa de totais; R$ em todo valor; nada abreviado. TODA TABELA = TabelaPlanilha. RECEITA DA TELA NOVA (não escreva tamanho à mão): Pagina{className:PAGINA_CHEIA+\" [&_*]:!normal-case\"} > BlocoPainel{titulo, compacto:true} > BarraTabela com CelulaBarra{rotulo} e BuscaMini/CampoMini > div{ref:refCheia(), className:CLS_FINA_ESPACO} > TabelaPlanilha{fina:true, grade:true, semCaixaAlta:true, semContagem:true, semLimpar:true, semMao:true}. Peças em components/planilha-cheia.js, bloco-painel.js e tabela-planilha.js; modelo: pages/ContasPagarLista.js.";

var norm = function(f){ return String(f || "").replace(/\\/g, "/"); };

// TRAVA "SEMPRE NO BANCO, NUNCA NO NAVEGADOR" (Nickolas, 25/11/2026: "bloqueie essa parte do navegador, sempre banco de dados").
// Vale para TODO o código do sistema (src/**/*.js), não só tela: linha nova ou mexida que grava no navegador (localStorage/sessionStorage .setItem ou indexedDB.open) é reprovada.
// Dado vai para o banco (módulo do estado, lib/sync-modulos.js; arquivo, lib/anexo.js). Única exceção: a chave de login em src/apps/montagem/lib/api.js (identificação, não é dado).
// As linhas antigas continuam até serem mexidas: quem mexer leva o dado para o banco (ver docs/DECISOES.md de 25/11/2026). Esta trava NÃO aceita padrao-ok.
var LIBERADOS_NAVEGADOR = ["src/apps/montagem/lib/api.js"];
var GRAVA_NAVEGADOR = /\b(localStorage|sessionStorage)\s*\.\s*setItem\s*\(|\bindexedDB\s*\.\s*open\s*\(|\bwindow\s*\.\s*(localStorage|sessionStorage)\s*\[/;
export function ehCodigo(f){ return /(^|\/)src\/.*\.js$/.test(norm(f)); }
export function conferirNavegador(arquivo, linhas){
  if(!ehCodigo(arquivo) || LIBERADOS_NAVEGADOR.some(function(x){ return norm(arquivo).endsWith(x); })) return [];
  var erros = [];
  (linhas || []).forEach(function(l){ var t = String(l).trim(); if(!t || t.indexOf("//") === 0 || t.indexOf("*") === 0) return; var c = String(l).replace(/\/\/.*$/, "");
    if(GRAVA_NAVEGADOR.test(c)) erros.push("grava no NAVEGADOR (trava de 25/11/2026: dado vai SEMPRE para o banco, pelo módulo do estado ou anexo): " + t.slice(0, 110)); });
  return erros;
}

/** Tela ou peça (o hook e o conferidor só olham estes arquivos). */
export function ehTela(f){ return /(^|\/)src\/(apps\/[^/]+\/(pages|components|mobile)|shared)\/.*\.js$/.test(norm(f)); }
/** Tela do admin (regras completas). Apps de celular (mobile/) seguem só as regras de fonte flexível e limite de 20 px. */
export function ehAdmin(f){ return /(^|\/)src\/apps\/[^/]+\/(pages|components)\//.test(norm(f)) || /(^|\/)src\/shared\//.test(norm(f)); }
/** Tela nova em pages/ (precisa usar as peças do padrão). */
export function ehPagina(f){ return /(^|\/)src\/apps\/[^/]+\/pages\/.*\.js$/.test(norm(f)); }

var TAM_TEXTO = [10, 11, 13];                   // 25/11/2026: tabela e controles 10 (padrão das telas do Financeiro), Home da família 11, título 13
var TAM_NUMERO_MAX = 20;                        // número até 20 px
var ALT_MIN = 18, ALT_MAX = 24;                 // 25/11/2026: controle (campo, seletor, botão) e linha de tabela: 18 a 24 px
var ALT_LEGADO = [30, 32];                      // visual antigo (cabeçalho 30, campo/linha 32 = h-8): passa em arquivo que já existia; reprova em arquivo novo
var ALT_TW = {4:16, 5:20, 6:24, 7:28, 8:32, 9:36, 10:40, 11:44, 12:48};   // classes h-N do Tailwind em px (h-4 = 16 px fica de fora: é tamanho de ícone e de rótulo)
var PISTA_NUMERO = /tabular-nums|brl\(|din\(|inteiro\(|Dinheiro|Indicador|\bMONO\b|n0\(|fmt\(|moeda\(|R\$/;
// linha que desenha campo, seletor, botão ou linha de tabela: pelo elemento, pela peça, ou pelo seletor que força a altura por fora ([&_td]:!h-[18px], [&_button]:!h-[18px]), que é como as telas do Financeiro chegam ao compacto
var PISTA_CAMPO = /"(input|select|button|textarea|tr)"|Botao|CAMPO|INPUT|MoneyInput|NumInput|CampoSel|CampoBusca|BarraFiltros|Segmentado|\[&[^\]]*_(td|th|tr|button|input|select|textarea)\b[^\]]*\]:!?h-/;
var PECAS = /@\/apps\/[^/]+\/components\/(padrao|padrao-fin|equipe-blocos|barra-menu|tabela-planilha|bloco-painel|planilha-cheia)|@\/shared\/kanban|@\/apps\/[^/]+\/ui\/page/;
var TAM_NOME = {xs:12, sm:14, base:16, lg:18, xl:20, "2xl":24, "3xl":30, "4xl":36, "5xl":48, "6xl":60};   // tamanhos "com nome" do Tailwind: a trava antiga não via (255 usos em 12/11/2026)

// CAIXA ALTA (regra 2o): a classe "uppercase" do Tailwind (também md:uppercase), textTransform:"uppercase" e text-transform:uppercase dentro de CSS escrito na tela.
var CAIXA_ALTA = /(^|[\s"'`:])uppercase(?![\w-])/;
// LEGADO CONHECIDO DE CAIXA ALTA: linha de tela de REFERÊNCIA que ganhou caixa alta depois de 20/11/2026 e ainda não foi corrigida. A trava não pode reprovar a própria referência,
// então a linha fica listada AQUI (e em docs/pendencias/design-system.local.md) até ser corrigida. Corrigiu a tela? Apague a linha desta lista. Não acrescente tela nova aqui.
var LEGADO_CAIXA_ALTA = [["src/apps/montagem/pages/FinFamiliar.js", /\.ff-cab\{/]];   // Home da família: título das seções por pessoa (.ff-cab), entrou em 23 e 24/11/2026
function legadoCaixaAlta(arquivo, linha){ return LEGADO_CAIXA_ALTA.some(function(x){ return norm(arquivo).endsWith(x[0]) && x[1].test(linha); }); }
function contarCaixaAlta(arquivo, texto){ var n = 0; String(texto || "").split("\n").forEach(function(l){ if(legadoCaixaAlta(arquivo, l)) return; var m = l.match(new RegExp(CAIXA_ALTA.source, "g")); if(m) n += m.length; }); return n; }

/** Tamanho certo para a mensagem de erro. */
var DICA_TEXTO = "tabela, campo e botão 10 ou 11 px; título 13 px";
var DICA_ALTURA = "padrão compacto: " + ALT_MIN + " a " + ALT_MAX + " px (h-[18px], h-5 ou h-6)";

// 2g. AS PEÇAS GUARDAM O PADRÃO (Marcus, 03/11/2026: "tem que colocar na trava dura"; refeito em 25/11/2026 para o padrão medido). Lidas SEMPRE, não só quando mudam:
//   TabelaPlanilha (peça única de tabela): cabeçalho escuro por padrão, menu de filtro e ordem em cada coluna, tabela cheia sem sobra;
//   TabelaP (antiga, só em tela velha): topo escuro, sem dourado;
//   planilha-cheia.js (o compacto das telas de referência): letra 10 px, linha 18 px, controle 18 px;
//   bloco-painel.js: linha branca a 30% em toda célula e bloco compacto.
// A TabelaOuro (dourada) saiu desta lista em 25/11/2026: a trava EXIGIA o degradê dourado, o contrário do padrão ("sem dourado decorativo"). Ela fica congelada; uso novo é reprovado pela regra 2k.
export var PECAS_TABELA = [["src/apps/montagem/components/padrao-fin.js", "TabelaP"], ["src/apps/montagem/components/tabela-planilha.js", "TabelaPlanilha"], ["src/apps/montagem/components/planilha-cheia.js", "PlanilhaCheia"], ["src/apps/montagem/components/bloco-painel.js", "BlocoPainel"]];
export function conferirPecaTabela(arquivo, conteudo){
  var item = PECAS_TABELA.filter(function(x){ return norm(arquivo).endsWith(x[0]); })[0];
  if(!item) return [];
  if(item[1] === "PlanilhaCheia"){   // as medidas do padrão moram aqui: mudou aqui, mudam as 4 telas de referência
    var ec = [], falta = function(re, msg){ if(!re.test(conteudo)) ec.push("planilha-cheia.js: " + msg + " (medida do padrão de 25/11/2026; só muda com o Marcus de acordo e com o " + DOC + " atualizado)"); };
    falta(/\[&_table_td\]:!text-\[10px\]/, "a letra da tabela fina deixou de ser 10 px");
    falta(/\[&_table_td\]:!h-\[var\(--lh,18px\)\]/, "a linha da tabela fina deixou de ser 18 px");
    falta(/CLS_BARRA_TAB\s*=\s*"[^"]*\[&_button\]:!h-\[18px\][^"]*\[&_button\]:!text-\[10px\]/, "os botões da barra em forma de tabela deixaram de ter 18 px e letra de 10 px");
    falta(/CLS_CAMPO\s*=\s*"[^"]*text-\[10px\]/, "o campo da barra deixou de ter letra de 10 px");
    falta(/function CampoMini[\s\S]{0,400}height\s*:\s*"18px"/, "o seletor CampoMini deixou de ter 18 px");
    falta(/function BuscaMini[\s\S]{0,400}height\s*:\s*"18px"/, "a busca BuscaMini deixou de ter 18 px");
    return ec;
  }
  if(item[1] === "BlocoPainel"){
    var eb = [];
    if(!/PADRAO_BLOCOS\s*=\s*"[^"]*\[--border:rgba\(255,255,255,0\.3\)\]/.test(conteudo)) eb.push("bloco-painel.js: a linha branca a 30% (PADRAO_BLOCOS, --border) sumiu; toda célula tem borda branca fina");
    if(!/var\s+COMPACTO\s*=/.test(conteudo) || !/p\.compacto\s*\?\s*COMPACTO/.test(conteudo)) eb.push("bloco-painel.js: o bloco compacto (compacto:true) sumiu; as telas de referência dependem dele");
    return eb;
  }
  var ini = conteudo.indexOf("function " + item[1] + "(");
  if(ini < 0) return [item[1] + ": a função da peça de tabela não foi encontrada em " + item[0]];
  var resto = conteudo.slice(ini + 10), fim = resto.search(/\n(function |export )/), corpo = fim < 0 ? resto : resto.slice(0, fim), erros = [];
  if(item[1] === "TabelaPlanilha"){   // 11/11/2026: a peça única de tabela é ESCURA e tem filtro e ordem em cada coluna
    if(!/escura\s*=\s*!p\.dourada/.test(corpo)) erros.push("TabelaPlanilha: o padrão tem que ser o cabeçalho ESCURO (var escura = !p.dourada); o dourado só com dourada:true");
    if(!/1c1d21|1f3358|--bloco-colunas/i.test(corpo)) erros.push("TabelaPlanilha: o fundo escuro da tabela sumiu (#1c1d21 de hoje, ou o azul do padrão: #1F3358 / var(--bloco-colunas))");   // 25/11/2026: aceita também o azul do padrão, para a peça poder nascer certa sem a trava travar a correção
    if(!/relative"\s*\+\s*\(p\.cheia\s*\?\s*" min-h-0 flex-1"/.test(conteudo)) erros.push("TabelaPlanilha: com cheia:true o contêiner da tabela precisa ocupar a altura toda (relative + min-h-0 flex-1); sem isso a tabela encolhe e sobra espaço preto embaixo do bloco (Visão geral das compras, 17/11/2026)");
    if(!/Ordenar de A a Z/.test(conteudo) || !/Ordenar de Z a A/.test(conteudo) || !/Limpar o filtro desta coluna/.test(conteudo)) erros.push("TabelaPlanilha: o menu de filtro e ordem em cada coluna (Ordenar de A a Z, de Z a A, buscar, lista de valores, Limpar o filtro) perdeu itens");
    return erros;
  }
  if(item[1] === "TabelaP"){   // 12/11/2026 (Marcus: "tire o dourado"): a TabelaP antiga também tem topo ESCURO, sem dourado
    if(!/1c1d21/i.test(corpo)) erros.push("TabelaP: o topo escuro (#1c1d21) sumiu; nada dourado desde 06/11/2026");
    if(/9A6F1E|E8B84B/i.test(corpo)) erros.push("TabelaP: o topo voltou a ser dourado; nada dourado desde 06/11/2026");
    return erros;
  }
  return erros;
}

/** Conta as exceções (`padrao-ok`) num grupo de linhas e separa as que não dizem o motivo. Serve para o relatório e para o aviso do conferidor. */
export function contarExcecoes(linhas){
  var total = 0, semMotivo = 0;
  linhas.forEach(function(l){ if(!/padrao-ok/.test(l)) return; total++; if(!/padrao-ok\s*:\s*\S{3,}/.test(l)) semMotivo++; });
  return {total:total, semMotivo:semMotivo};
}

// 2m. TELA TRAVADA: VISÃO GERAL DAS COMPRAS (Marcus, 17/11/2026: "trava as regras dessa visão geral sobre padronização"; antes ele reclamou de blocos quebrados, alturas diferentes e sobra preta embaixo da tabela).
// Esta tela é uma GRADE DE FAIXAS. As regras abaixo são lidas do arquivo inteiro (sempre, no hook, em npm run padrao e no CI), não só das linhas novas:
//  1. todo bloco nasce do componente Bloco (um único e(BlocoPainel) no arquivo): tamanho, letra e tabela iguais em todos;
//  2. o Bloco usa a constante FAIXA ([&>section]:flex-1): o bloco estica até a altura da faixa e as bordas de cima e de baixo ficam alinhadas com o vizinho;
//  3. a tabela do bloco é cheia por padrão (cheia:p.cheia!==false): as linhas esticam e a tabela fecha na borda de baixo, sem sobra preta;
//  4. nenhuma grade de blocos usa items-start/center/end (isso deixa os blocos com alturas diferentes);
//  5. nenhuma divisão de coluna desigual (grid-cols-[...]): a faixa é um bloco de largura inteira ou duas metades iguais, e as faixas não mudam de divisão entre si;
//  6. só a peça TabelaPlanilha desenha tabela (nada de <table> à mão) e nada de faixa de números (Faixa, Indicador, FaixaTotais).
export var TELAS_TRAVADAS = ["src/apps/montagem/pages/compras/VisaoCompras.js", "src/apps/montagem/pages/compras/CompraConfig.js"];   // a Configurações entrou em 17/11/2026 (Marcus: "aba de configurações sem nenhum padrão"): mesmas regras de grade; a regra 3 (tabela cheia) só vale na Visão geral
export function conferirTelaTravada(arquivo, conteudo){
  if(!TELAS_TRAVADAS.some(function(x){ return norm(arquivo).endsWith(x); })) return [];
  var nome = /CompraConfig\.js$/.test(norm(arquivo)) ? "Configurações de compras" : "Visão geral das compras", ehVisao = nome==="Visão geral das compras";
  var erros = [], sem = conteudo.replace(/\/\/[^\n]*/g, "");   // ignora comentários
  var n = (sem.match(/\be\(\s*BlocoPainel\b/g) || []).length;
  if(n !== 1) erros.push(nome + ": todo bloco tem que nascer do componente Bloco (achei " + n + " usos diretos de e(BlocoPainel), o certo é 1, dentro do Bloco); assim todos ficam com o mesmo tamanho, letra e tabela");
  if(!/var\s+FAIXA\s*=\s*"[^"]*\[&>section\]:flex-1/.test(sem) || !/className\s*:\s*FAIXA\b/.test(sem)) erros.push(nome + ": o Bloco perdeu a constante FAIXA ([&>section]:flex-1); sem ela os blocos da mesma faixa ficam com alturas diferentes e as bordas desalinham");
  if(ehVisao && !/cheia\s*:\s*p\.cheia\s*!==\s*false/.test(sem)) erros.push(nome + ": a tabela do Bloco tem que ser cheia por padrão (cheia:p.cheia!==false): as linhas esticam e a tabela fecha na borda de baixo do bloco, sem sobra preta");
  (sem.match(/className\s*:\s*"[^"]*\bgrid\b[^"]*"/g) || []).forEach(function(c){
    if(/\bitems-(start|center|end|baseline)\b/.test(c)) erros.push(nome + ": grade de blocos com items-start/center/end deixa os blocos com alturas diferentes; use o padrão (esticar): " + c.slice(0, 90));
    if(/grid-cols-\[/.test(c)) erros.push(nome + ": divisão de coluna desigual (grid-cols-[...]); a faixa é um bloco de largura inteira ou duas metades iguais (lg:grid-cols-2): " + c.slice(0, 90));
  });
  if(/\be\(\s*"table"|<table\b/.test(sem)) erros.push(nome + ": tabela feita à mão; use só a TabelaPlanilha");
  if(/\b(FaixaTotais|Faixa|Indicador)\b/.test(sem)) erros.push(nome + ": faixa de números ou Indicador no topo (proibido desde 02/11/2026); os números ficam em tabela");
  return erros;
}

/**
 * Confere linhas (novas ou mudadas) de um arquivo. Devolve a lista de erros em texto.
 * @param {string} arquivo caminho
 * @param {string[]} linhas linhas a conferir (as NOVAS no diff, ou todas num arquivo novo)
 * @param {{arquivoNovo?:boolean, conteudo?:string, antes?:string, aoEditar?:boolean}} op arquivoNovo: confere também o uso das peças e exige o compacto.
 *   antes = o arquivo como estava na base (git): linha de import mexida só reprova a peça proibida que NÃO era importada antes (o uso novo, e(Peca, ...), reprova sempre).
 */
export function conferirLinhas(arquivo, linhas, op){
  op = op || {};
  var erros = [], admin = ehAdmin(arquivo);
  var add = function(regra, l){ erros.push(regra + ": " + l.trim().slice(0, 110)); };
  // LEGADO NA LINHA DE IMPORT (25/11/2026): mexer no import de uma tela antiga (ex.: acrescentar MenuMulti) reprovava a linha inteira porque ela ainda traz BlocoFiltros ou TabelaP para as abas velhas do mesmo arquivo.
  // Isso travava as próprias telas de referência (FinFamiliar.js). Agora o import só reprova o nome proibido que é NOVO no arquivo. Sem "antes" (arquivo novo, teste) vale a regra cheia.
  var importavaAntes = function(nome){ return !!op.antes && new RegExp("\\bimport\\b[^;]*\\b" + nome + "\\b").test(op.antes); };
  var importaNovo = function(codigo, nomes, origem){
    if(!/^\s*import\b/.test(codigo) || (origem && !origem.test(codigo))) return false;
    var lista = codigo.replace(/from\s*["'][^"']*["']/, "");   // só os nomes importados, sem o caminho
    return nomes.some(function(n){ return new RegExp("\\b" + n + "\\b").test(lista) && !importavaAntes(n); });
  };
  // regra 2o: há caixa alta NOVA no arquivo? (inteiro = o arquivo de agora; antes = o da base)
  var caixaAltaNova = !!op.arquivoNovo || !op.antes || !op.inteiro || contarCaixaAlta(arquivo, op.inteiro) > contarCaixaAlta(arquivo, op.antes);
  linhas.forEach(function(l){
    var t = l.trim();
    if(!t || t.indexOf("//") === 0 || t.indexOf("*") === 0 || /padrao-ok/.test(l)) return;
    var codigo = l.replace(/\/\/.*$/, "");   // ignora comentário no fim da linha

    // 1. fonte flexível (vale para tudo, inclusive celular)
    if(/text-\[(?:clamp\(|[^\]]*vw)/.test(codigo) || /fontSize\s*:\s*["'`]?(?:clamp\(|[^,}]*vw)/.test(codigo)) add("fonte com clamp/vw (use tamanho fixo: " + DICA_TEXTO + ")", l);

    // 2. tamanho do texto
    var m, re = /text-\[(\d+(?:\.\d+)?)px\]/g;
    while((m = re.exec(codigo))){
      var n = parseFloat(m[1]);
      if(n > TAM_NUMERO_MAX) add("texto de " + m[1] + " px (máximo 20 px; " + DICA_TEXTO + ")", l);
      else if(admin && TAM_TEXTO.indexOf(n) < 0){
        if(n >= 14 && n <= TAM_NUMERO_MAX){ if(!PISTA_NUMERO.test(codigo)) add("texto de " + m[1] + " px só para NÚMERO (" + DICA_TEXTO + ")", l); }
        else add("texto de " + m[1] + " px fora do padrão (" + DICA_TEXTO + ")", l);
      }
    }
    var mi, ri = /fontSize\s*:\s*["'`]?(\d+(?:\.\d+)?)(px)?["'`]?/g;
    while((mi = ri.exec(codigo))){
      var ni = parseFloat(mi[1]);
      if(ni > TAM_NUMERO_MAX) add("fontSize de " + mi[1] + " px (máximo 20 px)", l);
      else if(admin && TAM_TEXTO.indexOf(ni) < 0 && !(ni >= 14 && PISTA_NUMERO.test(codigo))) add("fontSize solto de " + mi[1] + " px (use a classe text-[10px] ou text-[11px]; título text-[13px])", l);
    }

    if(!admin) return;

    // 2n. TAMANHO COM NOME (25/11/2026): text-xs, text-sm, text-base, text-lg, text-xl... são 12, 14, 16, 18 e 20 px, fora da lista, e a regra 2 não via. Foi por aqui que muita fonte errada entrou.
    var mn = /(^|[\s"'`:])text-(xs|sm|base|lg|[2-6]?xl)(?![\w-])/.exec(codigo);
    if(mn && !(TAM_NOME[mn[2]] >= 14 && TAM_NOME[mn[2]] <= TAM_NUMERO_MAX && PISTA_NUMERO.test(codigo))) add("texto com tamanho de nome (text-" + mn[2] + " = " + TAM_NOME[mn[2]] + " px): escreva o tamanho do padrão (" + DICA_TEXTO + ")", l);

    // 2o. SEM CAIXA ALTA (Marcus, 20/11/2026: "não quero letras maiúsculas em nada": título de bloco, cabeçalho de coluna, rótulo de campo, linha de total). A escrita é normal.
    // Peças que ainda nascem em caixa alta (BlocoPainel, CelulaBarra, TabelaPlanilha sem semCaixaAlta): a tela desliga com "[&_*]:!normal-case" na raiz e semCaixaAlta:true na tabela (modelo: pages/pf/Resumo.js).
    // LEGADO: a regra reprova caixa alta NOVA. Em arquivo que já existia, ela compara a quantidade de "uppercase" de antes (git) com a de agora: se não aumentou, a linha mexida só carrega a caixa alta antiga e passa
    // (tirar a caixa alta de uma peça muda o sistema inteiro: é proposta para o Marcus, não efeito colateral de outra edição). Arquivo novo, ou sem o "antes": reprova sempre.
    if(CAIXA_ALTA.test(codigo) && !legadoCaixaAlta(arquivo, codigo) && caixaAltaNova)
      add("caixa alta (uppercase proibido em 20/11/2026: escrita normal; na raiz da tela use [&_*]:!normal-case e, na TabelaPlanilha, semCaixaAlta:true)", l);

    // 2b. SEM faixa de totais (blocos de números no topo da tela). Pedido do Marcus em 02/11/2026: nunca mais.
    if(/(\be\(\s*|<)(FaixaTotais|Faixa)\b|^\s*(FaixaTotais|Faixa)\s*,?\s*$/.test(codigo) || importaNovo(codigo, ["FaixaTotais", "Faixa"]))
      add("faixa de totais no topo da tela (proibida em 02/11/2026: comece pelo título e a tabela; o filtro fica nas colunas)", l);

    // 2c. NADA ABREVIADO (Marcus, 02/11/2026): proibido cortar texto com "…" (truncate, ellipsis, line-clamp, slice + "…"). O texto aparece inteiro: a coluna cresce ou o texto quebra em 2 linhas.
    if(/\b(truncate|text-ellipsis|line-clamp-\d+)\b|textOverflow\s*:|\.slice\([^)]*\)\s*\+\s*["'`](…|\.\.\.)["'`]|["'`](…|\.\.\.)["'`]\s*\+\s*\w/.test(codigo))
      add("texto abreviado/cortado (proibido em 02/11/2026: a coluna cresce ou o texto quebra, nunca \"…\")", l);

    // 2d. TUDO ALINHADO NO MEIO (Marcus, 02/11/2026): célula e cabeçalho de tabela sempre centralizados (nada à esquerda nem à direita).
    if(/"(td|th)"|<t[dh]\b|\bTd\b|\bTh\b|TabelaP\b|TabelaPlanilha|CabSimples|TdSimples/.test(codigo) && (/\btext-(left|right)\b|textAlign\s*:\s*["'`](left|right)|\bjustify-(start|end)\b/.test(codigo) || (/\bTd\b/.test(codigo) && /\bn\s*:\s*(true|!0)\b/.test(codigo))))
      add("célula de tabela fora do centro (proibido em 02/11/2026: tudo centralizado)", l);

    // 2e. TABELA FEITA À MÃO (02/11/2026; texto corrigido em 25/11/2026: o motivo antigo era "topo dourado", que não vale mais). Em pages/ a tabela é sempre a peça TabelaPlanilha: filtro e ordem na coluna, borda branca fina.
    if(ehPagina(arquivo) && /\be\(\s*["'](table|thead)["']|<(table|thead)\b/.test(codigo))
      add("tabela feita à mão (use TabelaPlanilha de components/tabela-planilha.js: filtro e ordem em cada coluna; modelo: pages/ContasPagarLista.js)", l);

    // 2e-bis. A peça antiga Tab/Td de padrao.js tem cabeçalho cinza e não tem filtro na coluna (02/11/2026). Em pages/ use TabelaPlanilha.
    if(ehPagina(arquivo) && (/\be\(\s*Tab\s*,/.test(codigo) || importaNovo(codigo, ["Tab"], /components\/padrao["']/)))
      add("tabela com a peça antiga Tab (cabeçalho cinza): use TabelaPlanilha de components/tabela-planilha.js (filtro e ordem em cada coluna; modelo: pages/ContasPagarLista.js)", l);

    // 2h. TabelaP (peça antiga da tabela do Financeiro) não entra mais em tela mexida (06/11/2026). A trava reprova só na hora de editar, no hook; telas antigas que já usam TabelaP não travam o conferir nem o CI até serem mexidas.
    if(op.aoEditar && ehPagina(arquivo) && (/\be\(\s*TabelaP\s*,/.test(codigo) || importaNovo(codigo, ["TabelaP"], /padrao-fin/)))
      add("TabelaP saiu em 06/11/2026: use TabelaPlanilha de components/tabela-planilha.js (filtro e ordem em cada coluna; modelo: pages/ContasPagarLista.js)", l);

    // 2k. UMA PEÇA DE TABELA SÓ (Marcus, 11/11/2026: "toda tabela tem que ter o filtro igual do Google Planilhas"): em tela nova ou mexida, tabela de dados = TabelaPlanilha. As peças antigas não entram em linha nova; telas antigas mudam quando forem mexidas.
    // 25/11/2026: entram também TabelaOuro (dourada), GradeFiltro e TabelaSimples, as outras peças antigas de tabela que a regra não via.
    if(ehPagina(arquivo) && (/\be\(\s*(TabelaCampos|FileiraCampos|TabelaP|TabelaOuro|GradeFiltro|TabelaSimples)\s*,/.test(codigo) || importaNovo(codigo, ["TabelaCampos", "FileiraCampos"], /padrao-fin/) || importaNovo(codigo, ["TabelaOuro", "GradeFiltro", "TabelaSimples"])))
      add("peça antiga de tabela (TabelaCampos, FileiraCampos, TabelaP, TabelaOuro, GradeFiltro e TabelaSimples saíram): use TabelaPlanilha de components/tabela-planilha.js (filtro e ordem em cada coluna; modelo: pages/ContasPagarLista.js)", l);

    // 2l. SEM TOPO DOURADO (Marcus, 06/11/2026: "nada dourado"): a TabelaPlanilha é escura por padrão; dourada:true só existe para tela velha e não entra em linha nova.
    if(/\bdourada\s*:\s*(true|!0|1)\b/.test(codigo))
      add("tabela dourada (dourada:true saiu em 11/11/2026: a TabelaPlanilha é escura por padrão, sem dourado)", l);

    // 2f. SEM DEGRADÊ NA CÉLULA (02/11/2026; texto corrigido em 25/11/2026): cabeçalho e célula têm cor sólida (cabeçalho azul #1F3358).
    if(/"(td|th)"|<t[dh]\b|\bTh\b|\bTd\b/.test(codigo) && /gradient|degrade\(/.test(codigo))
      add("degradê dentro da célula (cabeçalho e célula têm cor sólida; cabeçalho azul #1F3358)", l);

    // 2i. SEM CHIPS NEM PÍLULAS (Marcus, 09/11/2026: "eu não quero nunca mais isso"): botão arredondado em forma de pílula para marcar várias opções (ex.: Peito, Costas, Ombros...) é proibido. Escolha de uma opção = select (CampoSel); várias opções = menu suspenso com marcação (MenuMulti de padrao-fin.js); 2 a 5 opções da mesma visão = Segmentado.
    if(/\b(var|let|const|function)\s+chip\w*\b/.test(codigo) || (/["']button["']|<button\b/.test(codigo) && /\brounded-full\b/.test(codigo) && /\bpx-\d/.test(codigo)))
      add("chip/pílula (proibido em 09/11/2026: uma opção = select; várias = menu suspenso MenuMulti; 2 a 5 da mesma visão = Segmentado)", l);

    // 2j. FILTRO SÓ NAS COLUNAS (Marcus, 11/11/2026: "os filtros ficam nas colunas igual do Google Planilhas, trave isso"): bloco de filtros acima da tabela é proibido em tela nova ou mexida. Filtro e ordenação ficam no cabeçalho de cada coluna (TabelaPlanilha de components/tabela-planilha.js).
    // 25/11/2026: o que continua proibido é o BLOCO separado. A barra em forma de tabela das telas de referência (BarraTabela + CelulaBarra, de planilha-cheia.js) faz parte da tabela e passa.
    if(/(\be\(\s*|<)(BlocoFiltros|BarraFiltros)\b/.test(codigo) || importaNovo(codigo, ["BlocoFiltros", "BarraFiltros"]))
      add("bloco de filtros no topo (proibido em 11/11/2026: filtro e ordenação ficam no cabeçalho de cada coluna; controle da tela inteira vai na BarraTabela de planilha-cheia.js)", l);
    // 2j-bis. O mesmo bloco FEITO À MÃO também é proibido: título "Filtros", busca (CampoBusca) ou botão "Filtrar" no topo da tela. A busca é o item "Buscar" do menu de cada coluna.
    if(ehPagina(arquivo) && (/\b(Bloco|BlocoBarra|Painel|Secao|Janela)\b[^;]*\bt\s*:\s*["'`]Filtros["'`]|\bt\s*:\s*["'`]Filtros["'`]/.test(codigo) || /\be\(\s*CampoBusca\b/.test(codigo) || /\be\(\s*Botao\b[^;]*["'`]Filtrar["'`]/.test(codigo)))
      add("filtro ou busca feito à mão no topo (proibido em 11/11/2026: o filtro fica no cabeçalho de cada coluna da TabelaPlanilha; busca da tela inteira = BuscaMini dentro da BarraTabela)", l);

    // 3. ALTURA DE CAMPO, SELETOR, BOTÃO E LINHA (25/11/2026): compacto de 18 a 24 px. Antes a regra exigia 32 px (h-8) e REPROVAVA o compacto, o contrário do padrão.
    //    18 a 24 px = passa · 30 e 32 px = legado (passa em arquivo que já existia, reprova em arquivo novo) · qualquer outro valor de 8 a 48 px = reprova.
    //    Abaixo de 8 px é fio ou separador e acima de 48 px é caixa, não controle: a regra não olha. Confere a classe (h-6, h-[18px]).
    //    O estilo direto (height:"28px") só é conferido em ARQUIVO NOVO: a janela azul de pagamento (FinFamiliar.js, botão principal de 28 px) usa esse caminho e a medida da janela ainda não está no padrão (pendência).
    if(PISTA_CAMPO.test(codigo)){
      var semTroca = codigo.replace(/\.replace\(\s*["'`][^"'`]*["'`]\s*,/g, ".replace(,");   // CAMPO.replace("h-8", "py-1") TIRA a altura: não é um controle de 32 px
      var alturas = [], ma, rta = /(^|[\s"'`:!])h-(5|6|7|8|9|10|11|12)(?![\w.\/\[-])/g, mh, rh = /\bh-\[(\d+(?:\.\d+)?)px\]/g, ms, rs = /\b(?:height|minHeight)\s*:\s*["'`](\d+(?:\.\d+)?)px["'`]/g, visto = {};
      while((ma = rta.exec(semTroca))) alturas.push([ALT_TW[ma[2]], "h-" + ma[2]]);
      while((mh = rh.exec(semTroca))) alturas.push([parseFloat(mh[1]), "h-[" + mh[1] + "px]"]);
      if(op.arquivoNovo) while((ms = rs.exec(semTroca))) alturas.push([parseFloat(ms[1]), "height " + ms[1] + "px"]);
      alturas.forEach(function(a){
        var h = a[0]; if(h < 8 || h > 48 || (h >= ALT_MIN && h <= ALT_MAX) || visto[a[1]]) return;
        if(ALT_LEGADO.indexOf(h) >= 0){ if(op.arquivoNovo){ visto[a[1]] = 1; add("campo/botão/linha com " + h + " px (" + a[1] + ") em arquivo novo (30/32 px é o visual antigo; " + DICA_ALTURA + ")", l); } return; }
        visto[a[1]] = 1; add("campo/botão/linha com " + h + " px (" + a[1] + "; " + DICA_ALTURA + ")", l);
      });
    }

    // 4. letras brancas, nunca cinza
    var mc = /\btext-(gray|slate|zinc|neutral|stone)-\d+\b/.exec(codigo);
    if(mc) add("texto cinza (" + mc[0] + "): letras brancas", l);
    var mw = /\btext-white\/([1-4]\d)\b/.exec(codigo);
    if(mw) add("texto apagado (" + mw[0] + "): letras brancas, no mínimo text-white/50", l);
    // 4b. O cinza do tema (text-muted-foreground = cinza a 68%) também é cinza: a regra só via text-gray-500 e deixava este passar (Marcus, 12/11/2026: "não quero nada cinza").
    if(/(^|[\s"'`:])text-muted-foreground(?![\w-])/.test(codigo)) add("texto cinza (text-muted-foreground): letras brancas (text-foreground ou text-white)", l);
  });

  // 5. tela nova em pages/ sem as peças do padrão
  if(op.arquivoNovo && ehPagina(arquivo) && !PECAS.test(op.conteudo || linhas.join("\n")))
    erros.unshift("tela nova sem as peças do padrão: importe Pagina (components/padrao.js), BlocoPainel (bloco-painel.js), as peças compactas de planilha-cheia.js e a TabelaPlanilha (tabela-planilha.js, a peça única de tabela); receita em " + DOC);

  return erros;
}
