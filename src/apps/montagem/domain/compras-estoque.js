import { globLocal } from "@/lib/glob-local";
// Sorelly Admin · montagem — domain/compras-estoque.js
// Materiais & Estoque: "Compras" + "Estoque interno (materiais)", trazidos do SorellyAdmin (docs/modulos/compras.md e estoque-interno.md) e ampliados por decisão do Marcus (16/10/2026).
// NÃO é o "Estoque Sorelly" (estoque geral de joias mês a mês): esse é outro módulo e vai para o Financeiro.
// COMPRAS vale para TUDO da empresa (cadeira, material, consumo, insumo, serviço...). Cada item tem uma CLASSIFICAÇÃO (config.classificacoes): material e consumo/insumo ENTRAM no estoque de material; patrimônio e serviço NÃO.
// FLUXO: quem negocia (ex.: Nickolas) cria a SOLICITAÇÃO (fornecedor, itens, valor, CNPJ pagador, prazos, condições) → FINANCEIRO (quem tem a autorização "compra_aprova") aprova ou reprova (com motivo)
//   → (acima do limite, autorização extra) → FINANCEIRO LIBERA PARA COMPRA (pedido_liberar: "ok" = só liberação, o comprador decide como comprar; "plano" = o financeiro já definiu COMO comprar, com plano de pagamento fechado; atalho: pedido_aprovar com liberar:true)
//   → COMPRADOR (autorização "compra_efetua": Nayale, Lucas, Marcus; o aprovador também pode) marca "compra efetuada" (só com o plano de pagamento fechado) → recebida (parcial ou total, por item) → entrada no estoque quando a classificação pedir → entregue. Pode ser cancelada antes de receber algo.
//   Status: NAO_VERIFICADA (solicitada) · AGUARDANDO · AGUARDANDO_ORCAMENTO · AGUARDANDO_AUTORIZACAO · AGUARDANDO_CNPJ · AGUARDANDO_FORMA_PAGAMENTO · APROVADA · LIBERADA (liberada para compra) · COMPRADA (efetuada) · EM_TRANSITO · RECEBIDA_PARCIAL · RECEBIDA · ENTREGUE · NEGADA (reprovada) · CANCELADA. Cada passo grava quem e quando em p.eventos.
// PLANO DE PAGAMENTO dentro da compra (p.plano): partes com forma (Pix revendedora, Pix empresa, boleto, cartão, outro), valor e vencimento; a soma tem que fechar o total (tolerância config.toleranciaPlano = R$ 0,01), senão aviso.
// Ligação PREPARADA (nada é gravado lá): compraParaPedidoPagamentos(compra) → formato do pf.js "pedido_add"; compraParaOrientacoes(compra) → formato das orientações do controle-pagamentos.js; p.enviadaPagamentos = {em, por, destino} marca o envio.
// ESTOQUE = materiais de uso interno em abas (tipos), contagem periódica, mínimo, status Crítico/Atenção/OK, solicitação de compra por item, consumo do mês. Todo movimento (contagem, entrada, saída, ajuste) fica com quem/quando/motivo.
// Integrações externas NÃO existem: tudo entra à mão. Anexos (nota fiscal, assinatura) não existem aqui: só guardamos número/nome do arquivo em texto.
// Estado s.ce (só neste navegador). Nasce VAZIO (repositório é público). Dados reais, se existirem, vêm só de domain/compras-estoque.local.js (gitignored):
//   export default {config:{}, fornecedores:[], setores:[], categorias:[], catalogo:[], contas:[], motivosNegativa:[], regras:"", pedidos:[], matCategorias:[], materiais:[], movimentos:[], solicitacoes:[]}
// Datas ISO no fuso America/Sao_Paulo ("2026-10-16" ou "2026-10-16T14:30:00"). Dinheiro em reais. Números e prazos moram em s.ce.config.
// ceReduz(s,a) → {patch,msg}: patch vazio + msg = recusado. Toda ação guarda a.por (nome) e, nas decisões do financeiro, a.porId (id da pessoa, para checar a autorização). Papéis de tela (papelCompras/capacidadesEstoque) a tela confere.

import { hojeSP, agoraSP, somaDias, diasEntre, ultimoDiaDoMes } from "./cadastro-leads";
import { temAutorizacao } from "./autorizacoes";
import { CNPJS0 } from "./cnpjs";

var LOCAL = (function(){ try { var m = globLocal("apps/montagem/domain/compras-estoque.local.js"); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(e){ return null; } })();

var SYNC = (function(){ try { var m = globLocal("apps/montagem/domain/compras-estoque-sync.local.js"); var k = Object.keys(m)[0]; return k ? m[k].default : []; } catch(e){ return []; } })();   // atualização dos pedidos do admin antigo (22/10/2026)

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var num = function(v){ var n = Number(v); return isFinite(n) ? n : 0; };
var clone = function(o){ return JSON.parse(JSON.stringify(o)); };
var trim = function(v){ return String(v==null ? "" : v).trim(); };
var diaDe = function(iso){ return iso ? String(iso).slice(0,10) : ""; };
var norm = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
var vazio = function(v){ return v===undefined || v===null || v===""; };
var mesmoId = function(a, b){ return String(a)===String(b); };
var digitos = function(v){ return String(v==null ? "" : v).replace(/\D/g, ""); };
// dia que existe de verdade ("2026-02-31" não vale)
function ehDia(v){ var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v||"")); if(!m) return false; var d = new Date(Date.UTC(+m[1], +m[2]-1, +m[3])); return d.getUTCFullYear()===+m[1] && d.getUTCMonth()===+m[2]-1 && d.getUTCDate()===+m[3]; }
// minutos desde 1970 de um ISO local (sem fuso): serve só para diferenças
function minutosDe(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(String(iso||"")); if(!m) return null; return Date.UTC(+m[1], +m[2]-1, +m[3], +(m[4]||0), +(m[5]||0), +(m[6]||0))/60000; }
var horasEntre = function(de, ate){ var a = minutosDe(de), b = minutosDe(ate); return a==null || b==null ? null : (b-a)/60; };
var ehInt = function(v){ var n = Number(v); return vazio(v) ? false : (isFinite(n) && n===Math.floor(n)); };

// ---------- formatação ----------
function formatarReais(v){ return "R$ "+Number(v||0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); }
function formatarDia(dia){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dia||"")); return m ? m[3]+"/"+m[2]+"/"+m[1] : ""; }
function formatarDataHora(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(String(iso||"")); return m ? m[3]+"/"+m[2]+"/"+m[1]+(m[4] ? " "+m[4]+":"+m[5] : "") : ""; }
// 36.5 → "1 dia e 12h"; 5 → "5h"; null → "—"
function formatarHoras(h){ if(h==null) return "—"; var t = Math.round(h); if(t<1) return "menos de 1h"; if(t<24) return t+"h"; var d = Math.floor(t/24), r = t%24; return d+" "+(d===1 ? "dia" : "dias")+(r ? " e "+r+"h" : ""); }

// ---------- vocabulário: compras ----------
var STATUS_PEDIDO = ["NAO_VERIFICADA", "AGUARDANDO", "AGUARDANDO_ORCAMENTO", "AGUARDANDO_AUTORIZACAO", "AGUARDANDO_CNPJ", "AGUARDANDO_FORMA_PAGAMENTO", "APROVADA", "LIBERADA", "COMPRADA", "EM_TRANSITO", "RECEBIDA_PARCIAL", "RECEBIDA", "ENTREGUE", "NEGADA", "CANCELADA"];
var ROTULO_STATUS = {NAO_VERIFICADA:"Solicitada", AGUARDANDO:"Aguardando", AGUARDANDO_ORCAMENTO:"Novo orçamento", AGUARDANDO_AUTORIZACAO:"Aguard. autorização", AGUARDANDO_CNPJ:"Aguard. CNPJ", AGUARDANDO_FORMA_PAGAMENTO:"Aguard. pagamento", APROVADA:"Aprovada", LIBERADA:"Liberada para compra", COMPRADA:"Compra efetuada", EM_TRANSITO:"Em trânsito", RECEBIDA_PARCIAL:"Recebida em parte", RECEBIDA:"Recebida", ENTREGUE:"Entregue", NEGADA:"Reprovada", CANCELADA:"Cancelada"};
var TOM_STATUS = {NAO_VERIFICADA:"primary", AGUARDANDO:"muted", AGUARDANDO_ORCAMENTO:"warning", AGUARDANDO_AUTORIZACAO:"warning", AGUARDANDO_CNPJ:"info", AGUARDANDO_FORMA_PAGAMENTO:"info", APROVADA:"success", LIBERADA:"primary", COMPRADA:"info", EM_TRANSITO:"info", RECEBIDA_PARCIAL:"warning", RECEBIDA:"success", ENTREGUE:"success", NEGADA:"danger", CANCELADA:"muted"};
var FUNIL_STATUS = ["NAO_VERIFICADA", "AGUARDANDO", "AGUARDANDO_ORCAMENTO", "AGUARDANDO_AUTORIZACAO", "AGUARDANDO_CNPJ", "AGUARDANDO_FORMA_PAGAMENTO", "APROVADA", "LIBERADA", "COMPRADA", "EM_TRANSITO", "RECEBIDA_PARCIAL", "RECEBIDA"];   // sai do funil ao ficar ENTREGUE, NEGADA ou CANCELADA
var HISTORICO_STATUS = ["ENTREGUE", "NEGADA", "CANCELADA"];
var PAGAVEL_STATUS = ["COMPRADA", "EM_TRANSITO", "RECEBIDA_PARCIAL", "RECEBIDA", "ENTREGUE"];   // compra efetuada em diante
var ETIQUETA_ELEGIVEL = ["APROVADA", "LIBERADA", "COMPRADA", "EM_TRANSITO", "RECEBIDA_PARCIAL", "RECEBIDA", "ENTREGUE"];
var ETIQUETAS = ["RETIRADO_ESTOQUE", "CONFIRMAR_ENTREGA", "ENTREGUE"];
var ROTULO_ETIQUETA = {RETIRADO_ESTOQUE:"Retirado do estoque", CONFIRMAR_ENTREGA:"Confirmar entrega", ENTREGUE:"Entregue"};
var UNIDADES = ["UNID", "CX", "KIT", "PAR", "ROLO", "PACOTE"];
var ROTULO_UNIDADE = {UNID:"Unid", CX:"Cx", KIT:"Kit", PAR:"Par", ROLO:"Rolo", PACOTE:"Pacote"};
var URGENCIAS = ["BAIXA", "MEDIA", "ALTA"];
var ROTULO_URGENCIA = {BAIXA:"Baixa", MEDIA:"Média", ALTA:"Alta"};
var TIPOS_ENTREGA = ["PADRAO", "FINANCEIRO", "RETIRADA"];
var ROTULO_ENTREGA = {PADRAO:"Padrão", FINANCEIRO:"Financeiro", RETIRADA:"Retirada"};   // ASSUMIDO: o doc não explica os três; confirmar com o Marcus
var FORMAS_PAGAMENTO = ["CARTAO", "PIX", "DINHEIRO", "BOLETO"];   // tipo das contas pagadoras (cadastro de contas)
var ROTULO_FORMA = {CARTAO:"Cartão", PIX:"Pix", DINHEIRO:"Dinheiro", BOLETO:"Boleto"};
// forma de cada PARTE do plano de pagamento (mesmas chaves do pf.js, mais "outro")
var FORMAS_PLANO = ["pix_revendedora", "pix_empresa", "boleto", "cartao", "outro"];
var ROTULO_FORMA_PLANO = {pix_revendedora:"Pix revendedora", pix_empresa:"Pix empresa", boleto:"Boleto", cartao:"Cartão", outro:"Outro"};
var NF_DA_FORMA = {pix_revendedora:"sem", pix_empresa:"com", boleto:"com", cartao:"com"};   // igual ao pf.js; "outro" não tem: não vai para Pagamentos a fornecedores
var MOTIVOS_ORCAMENTO = ["PRECO_ACIMA_ESPERADO", "ESPECIFICACAO_INCOMPLETA", "FORNECEDOR_NAO_APROVADO", "OUTRO"];
var ROTULO_MOTIVO_ORC = {PRECO_ACIMA_ESPERADO:"Preço acima do esperado", ESPECIFICACAO_INCOMPLETA:"Especificação incompleta", FORNECEDOR_NAO_APROVADO:"Fornecedor não aprovado", OUTRO:"Outro"};
var PAPEIS_COMPRAS = ["SOLICITANTE", "FINANCEIRO", "AUTORIZADOR", "FATURAMENTO", "LOGISTICA"];   // SOLICITANTE = sem papel (só pede e acompanha os próprios); ADMIN = diretoria
var ROTULO_PAPEL = {SOLICITANTE:"Solicitante", FINANCEIRO:"Financeiro", AUTORIZADOR:"Autorizador", FATURAMENTO:"Faturamento", LOGISTICA:"Logística", ADMIN:"Diretoria"};
// quem pode cada capacidade (igual ao original: lib/compras/access.ts)
var CAPS_COMPRAS = {operar:["ADMIN", "AUTORIZADOR", "FINANCEIRO"], autorizar:["ADMIN", "AUTORIZADOR"], faturar:["ADMIN", "FATURAMENTO"], logistica:["ADMIN", "AUTORIZADOR", "FINANCEIRO", "LOGISTICA"], contas:["ADMIN", "AUTORIZADOR", "FINANCEIRO", "FATURAMENTO"], admin:["ADMIN"]};
// ações do pedido: de onde pode sair e quem pode (cap). O original só escondia botão na tela; aqui o reducer também recusa.
// "decide": exige a autorização "compra_aprova" (a.porId). A tela mostra a ação se podeCompras(papel, cap) e, para decide, podeAprovarCompra(s, id).
var TODOS_ATIVOS = ["NAO_VERIFICADA", "AGUARDANDO", "AGUARDANDO_ORCAMENTO", "AGUARDANDO_AUTORIZACAO", "AGUARDANDO_CNPJ", "AGUARDANDO_FORMA_PAGAMENTO", "APROVADA", "LIBERADA", "COMPRADA", "EM_TRANSITO", "RECEBIDA_PARCIAL", "RECEBIDA"];
var TRANSICOES = {
  aprovar:{rotulo:"Aprovar", de:["NAO_VERIFICADA", "AGUARDANDO", "AGUARDANDO_ORCAMENTO"], cap:"operar", decide:true},
  ajustar_orcamento:{rotulo:"Ajustar orçamento e aprovar", de:["NAO_VERIFICADA"], cap:"operar", decide:true},
  autorizar:{rotulo:"Autorizar", de:["AGUARDANDO_AUTORIZACAO"], cap:"autorizar"},
  cnpj:{rotulo:"Definir CNPJ pagador", de:["AGUARDANDO_CNPJ"], cap:"faturar"},
  cnpj_desfazer:{rotulo:"Voltar ao CNPJ", de:["AGUARDANDO_FORMA_PAGAMENTO", "APROVADA"], cap:"contas"},
  pagamento:{rotulo:"Conta pagadora", de:["AGUARDANDO_FORMA_PAGAMENTO"], cap:"operar"},
  liberar:{rotulo:"Liberar para compra", de:["APROVADA"], cap:"operar", decide:true},   // o financeiro libera (só OK, ou já definindo COMO comprar: plano de pagamento)
  comprar:{rotulo:"Marcar compra efetuada", de:["LIBERADA"], cap:"membro", decide:"efetua"},   // quem tem a autorização "compra_efetua" (ou aprova)
  negar:{rotulo:"Reprovar", de:["NAO_VERIFICADA", "AGUARDANDO", "AGUARDANDO_ORCAMENTO", "AGUARDANDO_AUTORIZACAO", "AGUARDANDO_CNPJ", "AGUARDANDO_FORMA_PAGAMENTO", "APROVADA", "LIBERADA"], cap:"operar", decide:true},   // depois de efetuada só cancelando
  cancelar:{rotulo:"Cancelar", de:["NAO_VERIFICADA", "AGUARDANDO", "AGUARDANDO_ORCAMENTO", "AGUARDANDO_AUTORIZACAO", "AGUARDANDO_CNPJ", "AGUARDANDO_FORMA_PAGAMENTO", "APROVADA", "LIBERADA", "COMPRADA", "EM_TRANSITO"], cap:"membro", decide:"depois_de_solicitada"},   // solicitante cancela a própria solicitação ainda não aprovada; depois precisa da autorização. Sem nada recebido.
  novo_orcamento:{rotulo:"Pedir novo orçamento", de:["NAO_VERIFICADA", "AGUARDANDO", "AGUARDANDO_AUTORIZACAO"], cap:"operar", decide:true},   // ASSUMIDO: o doc não lista os status de origem
  reenviar:{rotulo:"Reenviar com novo valor", de:["AGUARDANDO_ORCAMENTO"], cap:"operar_ou_solicitante"},
  esperar:{rotulo:"Colocar em espera", de:["NAO_VERIFICADA", "AGUARDANDO_AUTORIZACAO"], cap:"operar", decide:true},                      // ASSUMIDO
  itens_set:{rotulo:"Editar itens", de:["NAO_VERIFICADA", "AGUARDANDO", "AGUARDANDO_ORCAMENTO"], cap:"operar_ou_solicitante"},
  plano_set:{rotulo:"Plano de pagamento", de:TODOS_ATIVOS, cap:"operar"},
  enviar_pagamentos:{rotulo:"Enviar aos pagamentos", de:PAGAVEL_STATUS, cap:"operar"},
  transito:{rotulo:"Em trânsito", de:["COMPRADA"], cap:"logistica"},
  receber:{rotulo:"Registrar recebimento", de:["COMPRADA", "EM_TRANSITO", "RECEBIDA_PARCIAL"], cap:"logistica"},
  entregar:{rotulo:"Confirmar entrega", de:["RECEBIDA"], cap:"logistica"},
  etiqueta:{rotulo:"Etiqueta de logística", de:ETIQUETA_ELEGIVEL, cap:"membro"}
};

// ---------- vocabulário: estoque ----------
var SITUACOES = ["NAO_PRECISA_COMPRAR", "SOLICITADO", "AGUARDANDO_APROVACAO", "AGUARDAR", "AGUARDANDO_ENTREGA", "VERIFICAR", "VERIFICAR_UNIDADE"];
var ROTULO_SITUACAO = {NAO_PRECISA_COMPRAR:"Não precisa comprar", SOLICITADO:"Solicitado", AGUARDANDO_APROVACAO:"Aguardando aprovação", AGUARDAR:"Aguardar", AGUARDANDO_ENTREGA:"Aguardando entrega", VERIFICAR:"Verificar", VERIFICAR_UNIDADE:"Verificar unidade"};
var STATUS_SOLICITACAO = ["SOLICITADO", "APROVADO", "RECUSADO", "SEGURAR", "RECEBIDO"];
var ROTULO_SOL = {SOLICITADO:"Solicitado", APROVADO:"Aprovado", RECUSADO:"Recusado", SEGURAR:"Segurar", RECEBIDO:"Recebido"};
var SITUACAO_APOS_DECISAO = {APROVADO:"AGUARDANDO_ENTREGA", RECUSADO:"NAO_PRECISA_COMPRAR", SEGURAR:"AGUARDAR"};
var STATUS_MATERIAL = ["CRITICO", "ATENCAO", "OK"];
var ROTULO_STATUS_MAT = {CRITICO:"Crítico", ATENCAO:"Atenção", OK:"OK"};
var TIPOS_MOV = ["contagem", "entrada", "saida", "ajuste"];
var ROTULO_MOV = {contagem:"Contagem", entrada:"Entrada", saida:"Saída", ajuste:"Ajuste"};
var CAPS_ESTOQUE = ["CONTAGEM", "COMPRA", "APROVACAO"];   // contar · cadastrar/solicitar compra/situação · decidir compra e marcar parado. Diretoria tem as três.
var ROTULO_CAP_ESTOQUE = {CONTAGEM:"Contagem", COMPRA:"Compra", APROVACAO:"Aprovação"};

// ---------- estado ----------
var CONFIG_PADRAO = {
  // compras
  limiteAutorizacao:3000, autorizacoesNecessarias:1,         // pedido ≥ R$ 3.000 pede autorização extra; o original libera com 1 autorizador (o texto da tela dizia "dupla": confirmar)
  aprovadores:[],                                            // ids de quem aprova/reprova/efetua compras; vazio = vale a autorização "compra_aprova" (domain/autorizacoes.js, padrão 16, 28, 29)
  classificacoes:[{id:"material", nome:"Material", entraEstoque:true}, {id:"consumo_insumo", nome:"Consumo / insumo", entraEstoque:true}, {id:"patrimonio", nome:"Patrimônio", entraEstoque:false}, {id:"servico", nome:"Serviço", entraEstoque:false}],
  pularFormaPagamento:true,                                  // com CNPJ pagador e plano de pagamento, a aprovação não pede mais a "conta pagadora" do original
  toleranciaPlano:0.01,                                      // a soma do plano de pagamento pode diferir do total em até R$ 0,01
  orcFaixa1Min:500, orcFaixa2Min:2000,                       // 500–2.000 = 2 orçamentos · acima de 2.000 = 3 (só informativo, como no original; antes o texto era fixo na tela)
  slaHoras:24, parcelasMax:12, opcaoSemNota:"Sem Nota Fiscal", motivoMax:300, paginaPedidos:50,
  // estoque
  atencaoPct:130,                                            // Atenção: até 130% do mínimo
  diasContagem:[1, 3, 5],                                    // seg/qua/sex (0 = domingo); só lembrete para a tela
  entradaAoReceber:true,                                     // recebimento (pedido ou solicitação) dá entrada no estoque do material
  bloquearContagemRetroativa:true,                           // contagem com data anterior à última contagem "voltava" o estoque no original
  permitirSaldoNegativo:false, topConsumo:10,
  tipos:[{id:"materiais_embalagens", nome:"Materiais e Embalagens", aprovador:"Financeiro"}, {id:"limpeza", nome:"Limpeza", aprovador:"Financeiro"}, {id:"materiais_producao", nome:"Materiais de Produção", aprovador:"Diretoria"}]};   // no original: Anamaria nas duas primeiras, Marcus em Produção (só exibição)
function ceDemo(){
  var s = {v:3, seq:0, config:clone(CONFIG_PADRAO), acessos:{compras:{}, estoque:{}}, regras:"", fornecedores:[], setores:[], categorias:[], catalogo:[], contas:[], motivosNegativa:[],
    pedidos:[], matCategorias:[], materiais:[], movimentos:[], solicitacoes:[], logMateriais:[]};
  if(LOCAL){
    if(LOCAL.config) Object.assign(s.config, LOCAL.config);
    s.regras = LOCAL.regras||""; s.motivosNegativa = (LOCAL.motivosNegativa||[]).slice();
    ["fornecedores", "setores", "categorias", "catalogo", "contas", "matCategorias", "materiais", "movimentos", "solicitacoes", "logMateriais"].forEach(function(k){ (LOCAL[k]||[]).forEach(function(d){ var o = clone(d); o.id = proximoId(s, o); s[k].push(o); }); });
    (LOCAL.pedidos||[]).forEach(function(d){ s.pedidos.push(novoPedido(s, d, agoraSP(), "arquivo", true)); });
    s.syncV = 1; aplicarSync(s);
  }
  return s;
}
// atualização do admin antigo: acha o pedido pelo título e dia da solicitação; só troca se ninguém mexeu nele aqui (todo o histórico veio do admin antigo); o que não existe entra como novo
function aplicarSync(s){
  (SYNC||[]).forEach(function(d){
    var k = norm(d.titulo), dia = diaDe(d.solicitadoEm), i = s.pedidos.findIndex(function(p){ return norm(p.titulo)===k && diaDe(p.solicitadoEm)===dia; });
    if(i<0){ s.pedidos.push(novoPedido(s, d, agoraSP(), "arquivo", true)); return; }
    var ex = s.pedidos[i]; if(!(ex.eventos||[]).every(function(e){ return e.por==="Admin antigo" || e.por==="arquivo"; })) return;
    s.pedidos[i] = novoPedido(s, Object.assign({}, d, {id:ex.id}), agoraSP(), "arquivo", true);
  });
}
// confere o estado salvo (migração: campos novos entram com o padrão)
function ceMigrar(ce){
  if(!ce) return ceDemo(); var base = ceDemo();
  Object.keys(base).forEach(function(k){ if(ce[k]===undefined) ce[k] = base[k]; });
  Object.keys(CONFIG_PADRAO).forEach(function(k){ if(ce.config[k]===undefined) ce.config[k] = clone(CONFIG_PADRAO[k]); });
  ce.acessos = ce.acessos||{}; ce.acessos.compras = ce.acessos.compras||{}; ce.acessos.estoque = ce.acessos.estoque||{};
  // v3 (16/10/2026): etapa "Liberada para compra". Pedidos antigos em APROVADA continuam APROVADA (o financeiro libera); só ganham o campo liberacao vazio
  (ce.pedidos||[]).forEach(function(p){ if(p.liberacao===undefined) p.liberacao = null; });
  // carga do admin antigo (arquivo local, 21/10/2026): entra uma vez no estado salvo, sem apagar o que já foi lançado aqui
  if(LOCAL && ce.importV!==1){
    ["setores", "categorias", "contas"].forEach(function(k){ (base[k]||[]).forEach(function(x){ if(!(ce[k]||[]).some(function(y){ return mesmoId(y.id, x.id); })) ce[k].push(x); }); });
    (base.motivosNegativa||[]).forEach(function(m){ if(ce.motivosNegativa.indexOf(m)<0) ce.motivosNegativa.push(m); });
    (base.pedidos||[]).forEach(function(p){ if(!ce.pedidos.some(function(q){ return q.titulo===p.titulo && q.solicitadoEm===p.solicitadoEm; })){ var n = clone(p); n.id = ++ce.seq; ce.pedidos.push(n); } });
    ce.importV = 1;
  }
  if(SYNC && SYNC.length && ce.syncV!==1){ aplicarSync(ce); ce.syncV = 1; }
  ce.v = 3;
  return ce;
}
function proximoId(s, d){ var id = d && d.id!=null ? d.id : (++s.seq); if(typeof id==="number" && id>s.seq) s.seq = id; return id; }
function evento(p, por, texto, agora){ p.eventos.push({em:agora, por:por, texto:texto}); }
var classif = function(cfg, id){ return (cfg.classificacoes||[]).find(function(c){ return c.id===id; })||null; };
// "34" → "CNPJ 34 · Sorelly Atacadista (34.753.252/0001-03)"; "outro" usa o texto digitado
function rotuloCnpj(id, outro, cfg){
  if(!id) return ""; if(id==="outro") return trim(outro)||"Outro CNPJ"; if(id==="sem_nota") return (cfg && cfg.opcaoSemNota) || "Sem Nota Fiscal";
  var c = CNPJS0.find(function(x){ return x.id===id; }); if(!c) return String(id); return (c.num ? "CNPJ "+c.num+" · " : "")+c.nome+(c.cnpj ? " ("+c.cnpj+")" : "");
}
function novoItem(ce, d){
  var cfg = ce.config, vu = vazio(d.valorUnitario) ? null : r2(num(d.valorUnitario)), qtd = Math.max(1, Math.round(num(d.quantidade)||1)), un = trim(d.unidade).toUpperCase();
  var tot = !vazio(d.valorTotal) ? r2(num(d.valorTotal)) : (vu!=null ? r2(vu*qtd) : 0), cl = d.classificacao || "material";
  return {id:proximoId(ce, d.id!=null ? {id:d.id} : null), titulo:trim(d.titulo), catalogoId:d.catalogoId||null, marca:trim(d.marca), quantidade:qtd, unidade:UNIDADES.indexOf(un)>=0 ? un : "UNID", valorUnitario:vu, valorTotal:tot,
    classificacao:cl, materialId:d.materialId||null, fatorEntrada:Math.max(1, Math.round(num(d.fatorEntrada)||1)), qtdRecebida:Math.max(0, Math.round(num(d.qtdRecebida)||0))};   // fatorEntrada = unidades de estoque por unidade comprada (caixa com 100 = 100)
}
var somaItens = function(its){ return r2(its.reduce(function(t, i){ return t+i.valorTotal; }, 0)); };
function nomeDoPedido(its, titulo){ var t = trim(titulo); if(t) return t; if(!its.length) return ""; return its[0].titulo+(its.length>1 ? " + "+(its.length-1)+(its.length===2 ? " item" : " itens") : ""); }
function novoPedido(s, d, agora, por, doArquivo){
  var criado = d.solicitadoEm||agora, cond = d.condicoes||{};
  var itens = (d.itens && d.itens.length ? d.itens : (d.titulo ? [{titulo:d.titulo, quantidade:d.quantidade, unidade:d.unidade, valorUnitario:d.valorUnitario, catalogoId:d.catalogoId, materialId:d.materialId, classificacao:d.classificacao}] : [])).map(function(i){ return novoItem(s, i); });
  var ve = !vazio(d.valorEstimado) ? r2(num(d.valorEstimado)) : somaItens(itens);
  var cnpjId = d.cnpjId||null;
  var p = {id:proximoId(s, d), titulo:nomeDoPedido(itens, d.titulo), itens:itens, categoriaId:d.categoriaId||null, link:trim(d.link), observacao:trim(d.observacao),
    setorId:d.setorId||null, urgencia:URGENCIAS.indexOf(d.urgencia)>=0 ? d.urgencia : "MEDIA", tipoEntrega:TIPOS_ENTREGA.indexOf(d.tipoEntrega)>=0 ? d.tipoEntrega : "PADRAO",
    valorEstimado:ve, solicitante:trim(d.solicitante)||por,
    condicoes:{formasAceitas:(cond.formasAceitas||[]).filter(function(f){ return FORMAS_PAGAMENTO.indexOf(f)>=0; }), temJuros:cond.temJuros==null ? null : !!cond.temJuros, parcelas:vazio(cond.parcelas) ? null : Math.round(num(cond.parcelas)), valorJuros:vazio(cond.valorJuros) ? null : r2(num(cond.valorJuros)), valorParcela:vazio(cond.valorParcela) ? null : r2(num(cond.valorParcela))},
    condicoesTxt:trim(d.condicoesTxt), prazoPagamentoDias:vazio(d.prazoPagamentoDias) ? null : Math.round(num(d.prazoPagamentoDias)), previsaoEntrega:d.previsaoEntrega||null, numeroFornecedor:trim(d.numeroFornecedor),
    fornecedorId:d.fornecedorId||null, fornecedorNome:trim(d.fornecedorNome), cnpjId:cnpjId, cnpjOutro:trim(d.cnpjOutro), cnpj:d.cnpj || rotuloCnpj(cnpjId, d.cnpjOutro, s.config) || null,
    plano:(d.plano||[]).map(function(x){ return Object.assign({id:proximoId(s), obs:"", pago:false, pagoEm:null, parcelas:null}, x); }), enviadaPagamentos:d.enviadaPagamentos||null,
    status:d.status||"NAO_VERIFICADA", liberacao:d.liberacao||null, etiqueta:d.etiqueta||null, aprovadoPor:d.aprovadoPor||null, aprovadoEm:d.aprovadoEm||null, motivoNegativa:d.motivoNegativa||null, canceladoPor:d.canceladoPor||null, canceladoEm:d.canceladoEm||null, motivoCancelamento:d.motivoCancelamento||null,
    esperaAte:d.esperaAte||null, autorizadoPor:(d.autorizadoPor||[]).slice(), orcamentoMotivo:d.orcamentoMotivo||null, orcamentoDetalhe:d.orcamentoDetalhe||null,
    contaId:d.contaId||null, tipoPagamento:d.tipoPagamento||null, parcelas:d.parcelas==null ? null : d.parcelas,
    valorCompra:d.valorCompra==null ? null : r2(num(d.valorCompra)), comprador:d.comprador||null, palavraChave:d.palavraChave||null, vencimento:d.vencimento||null, pago:!!d.pago, pagoEm:d.pagoEm||null, notaFiscal:trim(d.notaFiscal),
    recebimentos:(d.recebimentos||[]).slice(), recebidoPor:d.recebidoPor||null, entregueParaNome:d.entregueParaNome||null, assinaturaConfirmada:!!d.assinaturaConfirmada,
    solicitadoEm:criado, solicitadoOriginalEm:d.solicitadoOriginalEm||criado, respondidoEm:d.respondidoEm||null, compradoEm:d.compradoEm||null, recebidoEm:d.recebidoEm||null, entregueEm:d.entregueEm||null,
    eventos:(d.eventos||[]).slice(), mensagens:(d.mensagens||[]).slice()};
  if(!doArquivo && !d.eventos) evento(p, por, "Solicitação enviada ao financeiro", criado);
  return p;
}

// ---------- papéis e autorização ----------
// papel de quem está logado em Compras: diretoria = "ADMIN"; senão o que foi dado em Acessos (s.ce.acessos.compras[quem]); sem vínculo = null (só pede e acompanha os próprios)
function papelCompras(s, quem, diretoria){ if(diretoria) return "ADMIN"; var p = s.ce.acessos.compras[quem]; return p && p!=="SOLICITANTE" ? p : null; }
// cap: "membro" (qualquer um), operar, autorizar, faturar, logistica, contas, admin
function podeCompras(papel, cap){ if(cap==="membro") return true; return !!papel && (CAPS_COMPRAS[cap]||[]).indexOf(papel)>=0; }
// vê o funil inteiro? quem opera, define CNPJ ou faz logística; os demais só os próprios pedidos
function veFunilCompleto(papel){ return podeCompras(papel, "operar") || podeCompras(papel, "faturar") || podeCompras(papel, "logistica"); }
// quem APROVA/REPROVA e marca compra efetuada: lista de config.aprovadores, ou (vazia) a autorização "compra_aprova" do projeto (domain/autorizacoes.js)
function podeAprovarCompra(s, id){ if(id==null || id==="") return false; var l = s.ce.config.aprovadores||[]; return l.length ? l.map(String).indexOf(String(id))>=0 : temAutorizacao("compra_aprova", id); }
// quem EFETUA a compra liberada: a autorização "compra_efetua" (Nayale, Lucas, Marcus) ou quem aprova (podeAprovarCompra)
function podeEfetuarCompra(s, id){ if(id==null || id==="") return false; return temAutorizacao("compra_efetua", id) || podeAprovarCompra(s, id); }
// quem pode mexer no plano de pagamento: depois de LIBERADA, se o financeiro definiu o plano (modo "plano") só quem aprova; se liberou só com OK, também quem efetua. Nas outras etapas vale o papel "operar" (a tela confere)
function podeEditarPlano(s, p, id, papel){
  if(!podeAcaoPedido(p, "plano_set")) return false;
  if(p.status==="LIBERADA"){ var modo = p.liberacao && p.liberacao.modo; return modo==="plano" ? podeAprovarCompra(s, id) : (podeEfetuarCompra(s, id) || podeAprovarCompra(s, id)); }
  return podeCompras(papel, "operar");
}
// capacidades do estoque ["CONTAGEM","COMPRA","APROVACAO"]; diretoria tem as três
function capacidadesEstoque(s, quem, diretoria){ return diretoria ? CAPS_ESTOQUE.slice() : (s.ce.acessos.estoque[quem]||[]).slice(); }
function podeEstoque(caps, cap){ return caps.indexOf(cap)>=0; }

// ---------- leituras: cadastros ----------
var porId = function(lista, id){ return (lista||[]).find(function(x){ return mesmoId(x.id, id); })||null; };
var nomeDe = function(lista, id, vazioTxt){ var x = porId(lista, id); return x ? x.nome : (vazioTxt||""); };
// "Cartão · Itaú · 34.xxx · final 1234"
function rotuloConta(c){ return c ? [ROTULO_FORMA[c.tipo]||c.tipo, c.banco, c.documento||c.titular, c.finalOuChave ? "final/chave "+c.finalOuChave : ""].filter(Boolean).join(" · ") : ""; }
// opções do CNPJ pagador: os CNPJs da empresa (domain/cnpjs.js: 34, 46, 59, 67, H&O), "Outro" (com texto) e "Sem Nota Fiscal". [{id, rotulo}]
function opcoesCnpj(s){ var cfg = s ? s.ce.config : null; return CNPJS0.map(function(c){ return {id:c.id, rotulo:rotuloCnpj(c.id, "", cfg)}; }).concat([{id:"outro", rotulo:"Outro CNPJ"}, {id:"sem_nota", rotulo:rotuloCnpj("sem_nota", "", cfg)}]); }
var cnpjIdValido = function(id){ return id==="outro" || id==="sem_nota" || CNPJS0.some(function(c){ return c.id===id; }); };
// contas ativas daquele CNPJ (por cnpjId da conta ou pelo número do documento)
function contasDoCnpj(s, cnpjId){ var c0 = CNPJS0.find(function(c){ return c.id===cnpjId; }), dg = c0 ? digitos(c0.cnpj) : ""; return s.ce.contas.filter(function(c){ return c.ativa!==false && (c.cnpjId===cnpjId || (dg && digitos(c.documento)===dg)); }); }
// quantos orçamentos pedir pelo valor (informativo): abaixo da faixa 1 = 0 (livre), faixa 1 até a 2 = 2, acima = 3
function orcamentosExigidos(cfg, valor){ var v = num(valor); return v>cfg.orcFaixa2Min ? 3 : v>=cfg.orcFaixa1Min ? 2 : 0; }
function textoOrcamentos(cfg){ return "R$ "+cfg.orcFaixa1Min.toLocaleString("pt-BR")+" a "+cfg.orcFaixa2Min.toLocaleString("pt-BR")+": 2 orçamentos · acima de R$ "+cfg.orcFaixa2Min.toLocaleString("pt-BR")+": 3 orçamentos"; }
var entraNoEstoque = function(cfg, classificacaoId){ var c = classif(cfg, classificacaoId); return !!(c && c.entraEstoque); };

// ---------- leituras: plano de pagamento ----------
// total de referência da compra: o valor da compra efetuada ou, antes disso, o estimado
var totalDaCompra = function(p){ return p.valorCompra!=null ? p.valorCompra : p.valorEstimado; };
// {total, soma, diferenca (soma - total), fecha, vazio, aviso}. fecha = diferença dentro da tolerância
function planoSituacao(p, cfg){
  var tol = cfg && cfg.toleranciaPlano!=null ? cfg.toleranciaPlano : 0.01, total = r2(totalDaCompra(p)), soma = r2((p.plano||[]).reduce(function(t, x){ return t+x.valor; }, 0)), dif = r2(soma-total), fecha = Math.abs(dif)<=tol+1e-9;
  return {total:total, soma:soma, diferenca:dif, fecha:fecha && (p.plano||[]).length>0, vazio:!(p.plano||[]).length, aviso:!(p.plano||[]).length ? "Sem plano de pagamento." : fecha ? "" : (dif<0 ? "Faltam "+formatarReais(-dif)+" para fechar o total." : "Passou "+formatarReais(dif)+" do total.")};
}
var vencimentoDe = function(p){ var v = (p.plano||[]).filter(function(x){ return !x.pago && x.vencimento; }).map(function(x){ return x.vencimento; }).sort(); return v.length ? v[0] : p.vencimento||null; };
// Para o módulo "Pagamentos a fornecedores" (pf.js, op "pedido_add"). Função pura: não grava nada.
// opts = {fornecedores:[s.ce.fornecedores], pfFornecedores:[{id,nome} de s.pf.fornecedores]} (para achar o fornId pelo nome). Devolve o objeto do pedido_add:
//   {fornId (null se não achou: a tela escolhe), fornecedorNome, numero, data, total, nfTipo ("com"|"sem"|"misto"), comNF, semNF, cnpj, nfNum, linhas:[{forma, venc, valor, qtd, conta, status}], obs, avisos:[], pronto:boolean}
// pronto = plano fecha com o total e não há parte "outro" (sem forma no pf.js). Cartão: valor da linha = valor de CADA parcela (o pf.js repete pela qtd). Parte já paga vai como "Pendente" (o pf.js lança baixa ao receber "Pago"): confirmar.
function compraParaPedidoPagamentos(p, opts){
  opts = opts||{}; var avisos = [], nome = p.fornecedorId && opts.fornecedores ? nomeDe(opts.fornecedores, p.fornecedorId, p.fornecedorNome) : trim(p.fornecedorNome), cfg = opts.config||null, linhas = [], comNF = 0, semNF = 0;
  var pf = (opts.pfFornecedores||[]).find(function(f){ return norm(f.nome)===norm(nome); });
  if(!nome) avisos.push("Compra sem fornecedor."); else if(!pf && opts.pfFornecedores) avisos.push("Fornecedor \""+nome+"\" não está em Pagamentos a fornecedores.");
  var plano = p.plano||[]; if(!plano.length) avisos.push("Compra sem plano de pagamento.");
  plano.forEach(function(x){
    if(!NF_DA_FORMA[x.forma]){ avisos.push("Parte de "+formatarReais(x.valor)+" em \"Outro\" não tem forma em Pagamentos a fornecedores: lance à mão."); return; }
    var qtd = x.forma==="cartao" ? Math.max(1, x.parcelas||1) : 1; linhas.push({forma:x.forma, venc:x.vencimento, valor:r2(x.valor/qtd), qtd:qtd, conta:p.contaId ? "—" : "—", status:"Pendente"});
    if(NF_DA_FORMA[x.forma]==="com") comNF += x.valor; else semNF += x.valor;
    if(x.forma==="cartao" && qtd>1 && Math.abs(r2(x.valor/qtd)*qtd-x.valor)>0.005) avisos.push("Cartão em "+qtd+"x: o centavo da divisão não fecha (confira).");
  });
  var sit = planoSituacao(p, cfg); if(plano.length && !sit.fecha) avisos.push(sit.aviso);
  var total = r2(totalDaCompra(p)), tipo = comNF>0 && semNF>0 ? "misto" : semNF>0 ? "sem" : "com";
  return {fornId:pf ? pf.id : null, fornecedorNome:nome, numero:p.numeroFornecedor||("C"+p.id), data:diaDe(p.compradoEm||p.solicitadoEm), total:total, nfTipo:tipo, comNF:r2(comNF), semNF:r2(semNF), cnpj:p.cnpj||"", nfNum:p.notaFiscal||"", linhas:linhas, obs:"Compra #"+p.id+": "+p.titulo, avisos:avisos, pronto:!!plano.length && sit.fecha && !plano.some(function(x){ return !NF_DA_FORMA[x.forma]; })};
}
// Para o Controle de pagamentos (cp.orientacoes, op "orient_add" {destinoId, valor, ate, obs}): uma orientação por parte "Pix revendedora" ainda não paga, destino = o fornecedor.
// opts = {destinos:[s.cp.destinos]} (acha o destino pelo nome do fornecedor; destinoId null se não houver). Devolve [{destinoId, destinoNome, destinoTipo:"FORNECEDOR", valor, ate (vencimento), obs}]
function compraParaOrientacoes(p, opts){
  opts = opts||{}; var nome = p.fornecedorId && opts.fornecedores ? nomeDe(opts.fornecedores, p.fornecedorId, p.fornecedorNome) : trim(p.fornecedorNome), d = (opts.destinos||[]).find(function(x){ return x.ativo!==false && norm(x.nome)===norm(nome); });
  return (p.plano||[]).filter(function(x){ return x.forma==="pix_revendedora" && !x.pago; }).map(function(x){ return {destinoId:d ? d.id : null, destinoNome:nome, destinoTipo:"FORNECEDOR", valor:r2(x.valor), ate:x.vencimento||"", obs:"Compra #"+p.id+" · "+p.titulo}; });
}

// ---------- leituras: pedidos de compra ----------
function pedidoAtrasado(p, agora, cfg){ if(p.status!=="NAO_VERIFICADA") return false; var h = horasEntre(p.solicitadoEm, agora||agoraSP()); return h!=null && h>cfg.slaHoras; }
// ações possíveis neste status (a tela filtra por papel com podeCompras(papel, a.cap) e, se a.decide, podeAprovarCompra; "operar_ou_solicitante" vale para quem opera ou é o solicitante do pedido)
function acoesDoPedido(p){ return Object.keys(TRANSICOES).filter(function(k){ return TRANSICOES[k].de.indexOf(p.status)>=0; }).map(function(k){ return {op:k, rotulo:TRANSICOES[k].rotulo, cap:TRANSICOES[k].cap, decide:TRANSICOES[k].decide||false}; }); }
function podeAcaoPedido(p, op){ return !!TRANSICOES[op] && TRANSICOES[op].de.indexOf(p.status)>=0; }
var temEntradaVigente = function(ce, p){ return (p.recebimentos||[]).some(function(r){ return r.itens.some(function(i){ return i.entradaId && ce.movimentos.some(function(m){ return mesmoId(m.id, i.entradaId) && !m.estornado; }); }); }); };
// item pronto para a tela
function itemVisto(s, i){ var m = i.materialId ? porId(s.ce.materiais, i.materialId) : null, c = classif(s.ce.config, i.classificacao); return Object.assign({}, i, {rotuloUnidade:ROTULO_UNIDADE[i.unidade]||i.unidade, materialNome:m ? m.material : "", classificacaoNome:c ? c.nome : i.classificacao, entraEstoque:!!(c && c.entraEstoque), pendente:Math.max(0, i.quantidade-i.qtdRecebida), semMaterial:!!(c && c.entraEstoque && !i.materialId)}); }
// pedido pronto para a tela: com nomes, atraso, itens, plano, ações e se está no funil
function pedidoVista(s, p, agora){
  var a = agora||agoraSP(), c = s.ce, its = p.itens.map(function(i){ return itemVisto(s, i); }), pedida = p.itens.reduce(function(t, i){ return t+i.quantidade; }, 0), recebida = p.itens.reduce(function(t, i){ return t+i.qtdRecebida; }, 0);
  return Object.assign({}, p, {itens:its, rotuloStatus:ROTULO_STATUS[p.status], tom:TOM_STATUS[p.status], noFunil:FUNIL_STATUS.indexOf(p.status)>=0, atrasado:pedidoAtrasado(p, a, c.config), horasParado:p.status==="NAO_VERIFICADA" ? Math.round(horasEntre(p.solicitadoEm, a)||0) : 0,
    setorNome:nomeDe(c.setores, p.setorId, "Sem setor"), setorCor:(porId(c.setores, p.setorId)||{}).cor||null, categoriaNome:nomeDe(c.categorias, p.categoriaId, "Sem categoria"), rotuloUrgencia:ROTULO_URGENCIA[p.urgencia],
    classificacoesTxt:its.map(function(i){ return i.classificacaoNome; }).filter(function(x, k, l){ return l.indexOf(x)===k; }).join(" · "), entraEstoque:its.some(function(i){ return i.entraEstoque; }),
    rotuloEtiqueta:p.etiqueta ? ROTULO_ETIQUETA[p.etiqueta] : null, rotuloConta:rotuloConta(porId(c.contas, p.contaId)), fornecedor:p.fornecedorId ? nomeDe(c.fornecedores, p.fornecedorId, p.fornecedorNome) : p.fornecedorNome,
    plano:p.plano.map(function(x){ return Object.assign({}, x, {rotuloForma:ROTULO_FORMA_PLANO[x.forma]||x.forma, vencido:!x.pago && !!x.vencimento && x.vencimento<diaDe(a)}); }), planoInfo:planoSituacao(p, c.config), proximoVencimento:vencimentoDe(p),
    recebimento:{pedida:pedida, recebida:recebida, pendente:Math.max(0, pedida-recebida), completo:pedida>0 && recebida>=pedida}, acoes:acoesDoPedido(p), valorFinal:totalDaCompra(p), vencido:!!vencimentoDe(p) && !p.pago && vencimentoDe(p)<diaDe(a), enviada:!!p.enviadaPagamentos});
}
// escopo: "funil" (não finalizados, o mais antigo primeiro) · "historico" (entregue/reprovada/cancelada, o mais recente primeiro) · "minhas" (o.solicitante, qualquer status) · "todos".
// o = {escopo, solicitante, status, setorId, categoriaId, urgencia, classificacao, atrasada:true, q, pagina (0 = primeira), limite, agora}
function listarPedidos(s, o){
  o = o||{}; var agora = o.agora||agoraSP(), cfg = s.ce.config, esc = o.escopo||"funil", alvo = norm(o.q), lim = Math.max(1, o.limite||cfg.paginaPedidos), pg = Math.max(0, o.pagina||0);
  var lista = s.ce.pedidos.filter(function(p){
    if(esc==="funil" && FUNIL_STATUS.indexOf(p.status)<0) return false; if(esc==="historico" && HISTORICO_STATUS.indexOf(p.status)<0) return false; if(esc==="minhas" && norm(p.solicitante)!==norm(o.solicitante)) return false;
    if(o.status && p.status!==o.status) return false; if(o.setorId && !mesmoId(p.setorId, o.setorId)) return false; if(o.categoriaId && !mesmoId(p.categoriaId, o.categoriaId)) return false; if(o.urgencia && p.urgencia!==o.urgencia) return false;
    if(o.classificacao && !p.itens.some(function(i){ return i.classificacao===o.classificacao; })) return false; if(o.atrasada && !pedidoAtrasado(p, agora, cfg)) return false;
    if(!alvo) return true; return norm([p.titulo, p.itens.map(function(i){ return i.titulo+" "+i.marca; }).join(" "), p.solicitante, "#"+p.id, p.fornecedorNome, nomeDe(s.ce.fornecedores, p.fornecedorId, ""), nomeDe(s.ce.setores, p.setorId, ""), p.cnpj, p.numeroFornecedor].join(" ")).indexOf(alvo)>=0;
  });
  var fim = function(p){ return p.entregueEm||p.canceladoEm||p.respondidoEm||p.solicitadoEm; };
  if(esc==="historico") lista.sort(function(a, b){ return fim(b).localeCompare(fim(a)) || (Number(b.id)-Number(a.id)); });
  else if(esc==="minhas" || esc==="todos") lista.sort(function(a, b){ return b.solicitadoEm.localeCompare(a.solicitadoEm) || (Number(b.id)-Number(a.id)); });
  else lista.sort(function(a, b){ return a.solicitadoEm.localeCompare(b.solicitadoEm) || (Number(a.id)-Number(b.id)); });
  return {itens:lista.slice(pg*lim, (pg+1)*lim).map(function(p){ return pedidoVista(s, p, agora); }), paginacao:{total:lista.length, limit:lim, offset:pg*lim, hasMore:(pg+1)*lim<lista.length}};
}
function pedidoDe(s, id, agora){ var p = porId(s.ce.pedidos, id); return p ? pedidoVista(s, p, agora) : null; }
// contagem por status do funil + indicadores do topo
function indicadoresPedidos(s, agora){
  var a = agora||agoraSP(), cfg = s.ce.config, c = {}; STATUS_PEDIDO.forEach(function(st){ c[st] = 0; }); s.ce.pedidos.forEach(function(p){ c[p.status]++; });
  var funil = s.ce.pedidos.filter(function(p){ return FUNIL_STATUS.indexOf(p.status)>=0; });
  return {porStatus:c, noFunil:funil.length, atrasadas:s.ce.pedidos.filter(function(p){ return pedidoAtrasado(p, a, cfg); }).length, aguardandoAutorizacao:c.AGUARDANDO_AUTORIZACAO, aprovadasParaComprar:c.APROVADA, aprovadasALiberar:c.APROVADA, liberadasParaComprar:c.LIBERADA, aguardandoNovoOrcamento:c.AGUARDANDO_ORCAMENTO,
    valorNoFunil:r2(funil.reduce(function(t, p){ return t+totalDaCompra(p); }, 0)), recebidasEmParte:c.RECEBIDA_PARCIAL, entregues:c.ENTREGUE, negadas:c.NEGADA, canceladas:c.CANCELADA,
    planoNaoFecha:s.ce.pedidos.filter(function(p){ return FUNIL_STATUS.indexOf(p.status)>=0 && p.plano.length && !planoSituacao(p, cfg).fecha; }).length, naoEnviadasAosPagamentos:s.ce.pedidos.filter(function(p){ return PAGAVEL_STATUS.indexOf(p.status)>=0 && !p.enviadaPagamentos; }).length};
}
function periodoDe(periodo, agora){ var h = diaDe(agora||agoraSP()); switch(periodo){ case "hoje": return {de:h, ate:h, rotulo:"hoje"}; case "7d": return {de:somaDias(h, -7), ate:h, rotulo:"últimos 7 dias"}; case "30d": return {de:somaDias(h, -30), ate:h, rotulo:"últimos 30 dias"}; case "mes": return {de:h.slice(0, 7)+"-01", ate:h, rotulo:"mês atual"}; default: return {de:null, ate:h, rotulo:"todo o período"}; } }
var noPeriodo = function(dia, per){ var d = diaDe(dia); return !!d && (!per.de || d>=per.de) && d<=per.ate; };
var media = function(xs){ return xs.length ? xs.reduce(function(t, x){ return t+x; }, 0)/xs.length : null; };
// Visão geral das compras (só quem opera). periodo: "hoje"|"7d"|"30d"|"mes"|"tudo". Datas no fuso de São Paulo (o original usava o relógio do servidor)
function dashboardCompras(s, periodo, agora){
  var a = agora||agoraSP(), c = s.ce, cfg = c.config, per = periodoDe(periodo, a), P = c.pedidos;
  var comprados = P.filter(function(p){ return p.valorCompra!=null && p.status!=="CANCELADA" && noPeriodo(p.compradoEm, per); }), gasto = r2(comprados.reduce(function(t, p){ return t+p.valorCompra; }, 0));
  var resp = P.filter(function(p){ return p.respondidoEm; }).map(function(p){ return horasEntre(p.solicitadoOriginalEm||p.solicitadoEm, p.respondidoEm); }).filter(function(h){ return h!=null; });
  var compra = P.filter(function(p){ return p.compradoEm && p.respondidoEm; }).map(function(p){ return horasEntre(p.respondidoEm, p.compradoEm); }).filter(function(h){ return h!=null; });
  var entrega = P.filter(function(p){ return (p.entregueEm||p.recebidoEm) && p.compradoEm; }).map(function(p){ return horasEntre(p.compradoEm, p.entregueEm||p.recebidoEm); }).filter(function(h){ return h!=null; });
  var hr = media(resp), hc = media(compra), he = media(entrega), etapas = [["Resposta", hr], ["Compra", hc], ["Entrega", he]].filter(function(x){ return x[1]!=null; }).sort(function(x, y){ return y[1]-x[1]; });
  var pedidosNoPeriodo = P.filter(function(p){ return noPeriodo(p.solicitadoEm, per); });
  var agrupa = function(chave, nomeDoId){
    var m = {}; pedidosNoPeriodo.forEach(function(p){ var k = nomeDoId(p[chave]); m[k] = m[k]||{nome:k, pedidos:0, valorPedido:0, gasto:0}; m[k].pedidos++; m[k].valorPedido = r2(m[k].valorPedido+p.valorEstimado); if(p.valorCompra!=null && p.status!=="CANCELADA" && noPeriodo(p.compradoEm, per)) m[k].gasto = r2(m[k].gasto+p.valorCompra); });
    return Object.keys(m).map(function(k){ return m[k]; }).sort(function(x, y){ return y.valorPedido-x.valorPedido; });
  };
  var contas = {}; comprados.forEach(function(p){ var k = rotuloConta(porId(c.contas, p.contaId)) || rotuloCnpj(p.cnpjId, p.cnpjOutro, cfg) || "Sem conta"; contas[k] = contas[k]||{rotulo:k, compras:0, gasto:0}; contas[k].compras++; contas[k].gasto = r2(contas[k].gasto+p.valorCompra); });
  var cls = {}; comprados.forEach(function(p){ var tot = somaItens(p.itens) || 0; p.itens.forEach(function(i){ var n = (classif(cfg, i.classificacao)||{nome:i.classificacao}).nome, parte = tot>0 ? i.valorTotal/tot : 1/Math.max(1, p.itens.length); cls[n] = r2((cls[n]||0)+p.valorCompra*parte); }); });
  return {periodo:{rotulo:per.rotulo, de:per.de, ate:per.ate}, atrasadasNoSla:P.filter(function(p){ return pedidoAtrasado(p, a, cfg); }).length, aguardandoAutorizacao:P.filter(function(p){ return p.status==="AGUARDANDO_AUTORIZACAO"; }).length, aprovadasParaComprar:P.filter(function(p){ return p.status==="APROVADA"; }).length, liberadasParaComprar:P.filter(function(p){ return p.status==="LIBERADA"; }).length,
    gastoTotal:gasto, qtdCompras:comprados.length, leadTime:{respostaHoras:hr, compraHoras:hc, entregaHoras:he, gargalo:etapas.length ? etapas[0][0] : null},
    maisParadas:P.filter(function(p){ return p.status==="NAO_VERIFICADA"; }).sort(function(x, y){ return x.solicitadoEm.localeCompare(y.solicitadoEm); }).slice(0, 10).map(function(p){ return pedidoVista(s, p, a); }),
    porCategoria:agrupa("categoriaId", function(id){ return nomeDe(c.categorias, id, "Sem categoria"); }), porSetor:agrupa("setorId", function(id){ return nomeDe(c.setores, id, "Sem setor"); }),
    porClassificacao:Object.keys(cls).map(function(k){ return {nome:k, gasto:cls[k]}; }).sort(function(x, y){ return y.gasto-x.gasto; }),
    porConta:Object.keys(contas).map(function(k){ var x = contas[k]; return {rotulo:x.rotulo, compras:x.compras, gasto:x.gasto, parte:gasto>0 ? x.gasto/gasto : 0}; }).sort(function(x, y){ return y.gasto-x.gasto; })};
}
// o que ficou a pagar. Compra efetuada com plano: uma linha por PARTE não paga; sem plano: uma linha (valor da compra, não paga). Solicitação do estoque aprovada com valor e não paga.
// Devolve [{origem:"compra"|"estoque", id, parteId, descricao, fornecedor, valor, vencimento, forma, cnpj, conta, compradoEm, vencido, enviada}] — vencimento mais antigo primeiro, sem data por último
function pagamentosAPagar(s, hoje){
  var h = hoje||hojeSP(), c = s.ce, out = [];
  c.pedidos.forEach(function(p){ if(p.valorCompra==null || PAGAVEL_STATUS.indexOf(p.status)<0) return; var forn = p.fornecedorId ? nomeDe(c.fornecedores, p.fornecedorId, p.fornecedorNome) : p.fornecedorNome;
    var base = {origem:"compra", id:p.id, descricao:p.titulo, fornecedor:forn, cnpj:p.cnpj, conta:rotuloConta(porId(c.contas, p.contaId)), compradoEm:p.compradoEm, enviada:!!p.enviadaPagamentos};
    if(p.plano.length){ p.plano.forEach(function(x){ if(!x.pago) out.push(Object.assign({}, base, {parteId:x.id, valor:x.valor, vencimento:x.vencimento, forma:x.forma, vencido:!!x.vencimento && x.vencimento<h})); }); }
    else if(!p.pago) out.push(Object.assign({}, base, {parteId:null, valor:p.valorCompra, vencimento:p.vencimento, forma:p.tipoPagamento, vencido:!!p.vencimento && p.vencimento<h})); });
  c.solicitacoes.forEach(function(x){ if(x.valor==null || x.pago || ["APROVADO", "RECEBIDO"].indexOf(x.status)<0) return; var m = porId(c.materiais, x.materialId);
    out.push({origem:"estoque", id:x.id, parteId:null, descricao:(m ? m.material : "Material")+" ("+x.quantidade+")", fornecedor:x.fornecedorId ? nomeDe(c.fornecedores, x.fornecedorId, "") : (m ? m.fornecedor : ""), valor:x.valor, vencimento:x.vencimento, forma:x.formaPagamento, cnpj:null, conta:"", compradoEm:x.dataCompra, vencido:!!x.vencimento && x.vencimento<h, enviada:false}); });
  return out.sort(function(x, y){ return (x.vencimento||"9999").localeCompare(y.vencimento||"9999"); });
}

// ---------- leituras: estoque de materiais ----------
function saldoMaterial(m){ return m.estoqueAtual-m.estoqueMinimo; }
// Crítico: abaixo do mínimo · Atenção: até atencaoPct% do mínimo · OK: acima
function statusMaterial(m, cfg){ var pct = (cfg && cfg.atencaoPct) || 130; if(m.estoqueAtual<m.estoqueMinimo) return "CRITICO"; if(m.estoqueAtual<=m.estoqueMinimo*pct/100) return "ATENCAO"; return "OK"; }
var solicitacoesDoMaterial = function(s, id){ return s.ce.solicitacoes.filter(function(x){ return mesmoId(x.materialId, id); }); };
function materialVisto(s, m){
  var sol = solicitacoesDoMaterial(s, m.id), cat = porId(s.ce.matCategorias, m.categoriaId);
  return Object.assign({}, m, {status:statusMaterial(m, s.ce.config), rotuloStatus:ROTULO_STATUS_MAT[statusMaterial(m, s.ce.config)], saldo:saldoMaterial(m), rotuloSituacao:ROTULO_SITUACAO[m.situacao], categoriaNome:cat ? cat.nome : "", tipoId:cat ? cat.tipoId : null, solicitacoes:sol,
    aguardandoDecisao:sol.some(function(x){ return x.status==="SOLICITADO"; }), comprasChegando:sol.filter(function(x){ return x.status==="APROVADO"; }).length});
}
var materiaisDoTipo = function(s, tipoId){ var ids = s.ce.matCategorias.filter(function(c){ return c.tipoId===tipoId; }).map(function(c){ return String(c.id); }); return s.ce.materiais.filter(function(m){ return ids.indexOf(String(m.categoriaId))>=0; }); };
// cartões de alerta do topo de uma aba. Parados ficam fora. "Aguardando aprovação" = itens com solicitação ainda sem decisão (o original contava a situação manual, o que deixava a solicitação nova de fora: corrigido)
function alertasDoTipo(s, tipoId){
  var r = {criticosOuZerados:0, atencao:0, comprasChegando:0, aguardandoAprovacao:0};
  materiaisDoTipo(s, tipoId).forEach(function(m){ if(m.parado) return; var v = materialVisto(s, m);
    if(v.status==="CRITICO" || m.estoqueAtual===0) r.criticosOuZerados++; else if(v.status==="ATENCAO") r.atencao++;
    if(v.aguardandoDecisao) r.aguardandoAprovacao++; r.comprasChegando += v.comprasChegando; });
  return r;
}
// tabela da aba: por categoria (na ordem), itens ativos e "Materiais Parados" separados. o = {q, status:"CRITICO"|"ATENCAO"|"OK", situacao}
function agruparPorStatus(s, tipoId, o){
  o = o||{}; var alvo = norm(o.q);
  var filtra = function(v){ if(o.status && v.status!==o.status) return false; if(o.situacao && v.situacao!==o.situacao) return false; return !alvo || norm([v.material, v.fornecedor, v.observacoes, v.unidade].join(" ")).indexOf(alvo)>=0; };
  return s.ce.matCategorias.filter(function(c){ return c.tipoId===tipoId; }).sort(function(a, b){ return (a.ordem-b.ordem) || (Number(a.id)-Number(b.id)); }).map(function(c){
    var itens = s.ce.materiais.filter(function(m){ return mesmoId(m.categoriaId, c.id); }).sort(function(a, b){ return a.numero-b.numero; }).map(function(m){ return materialVisto(s, m); }).filter(filtra);
    return {categoria:c, ativos:itens.filter(function(i){ return !i.parado; }), parados:itens.filter(function(i){ return i.parado; })};
  });
}
function resumoAba(s, tipoId){
  var r = {tipoId:tipoId, nome:nomeDe(s.ce.config.tipos, tipoId, tipoId), totalItens:0, criticos:0, atencao:0, ok:0, aguardandoAprovacao:0, comprasChegando:0};
  materiaisDoTipo(s, tipoId).forEach(function(m){ r.totalItens++; if(m.parado) return; var v = materialVisto(s, m); if(v.status==="CRITICO") r.criticos++; else if(v.status==="ATENCAO") r.atencao++; else r.ok++; if(v.aguardandoDecisao) r.aguardandoAprovacao++; r.comprasChegando += v.comprasChegando; });
  return r;
}
// Dashboard Geral: totais das abas, aguardando aprovação por responsável, comparação por aba e ranking de consumo do mês por aba
function dashboardGeral(s, mes){
  var tipos = s.ce.config.tipos, porAba = tipos.map(function(t){ return resumoAba(s, t.id); }), resp = {};
  porAba.forEach(function(a, i){ var r = tipos[i].aprovador||"—"; resp[r] = (resp[r]||0)+a.aguardandoAprovacao; });
  var soma = function(k){ return porAba.reduce(function(t, a){ return t+a[k]; }, 0); }, m = mes||hojeSP().slice(0, 7);
  return {mes:m, porAba:porAba, totalItens:soma("totalItens"), criticos:soma("criticos"), atencao:soma("atencao"), aguardandoAprovacao:soma("aguardandoAprovacao"), comprasChegando:soma("comprasChegando"),
    porResponsavel:Object.keys(resp).map(function(k){ return {responsavel:k, aguardandoAprovacao:resp[k]}; }), consumoPorAba:tipos.map(function(t){ return {tipoId:t.id, nome:t.nome, ranking:consumoDoMes(s, t.id, m)}; })};
}
// consumo do mês de uma aba: soma das saídas + quedas na contagem (contado menor que o saldo esperado) com data dentro do mês. Reposição não conta. "Vezes comprado" = compras com data de compra no mês.
// Devolve [{materialId, material, categoria, consumoMes, vezesComprado}] do maior para o menor (só quem consumiu); top = quantos (padrão config.topConsumo; 0 = todos)
function consumoDoMes(s, tipoId, mes, top){
  var m = mes||hojeSP().slice(0, 7), de = m+"-01", ate = ultimoDiaDoMes(m), c = s.ce, n = top===undefined ? c.config.topConsumo : top;
  var rk = materiaisDoTipo(s, tipoId).map(function(mat){
    var cons = 0; c.movimentos.forEach(function(mv){ if(!mesmoId(mv.materialId, mat.id) || mv.estornado || mv.data<de || mv.data>ate) return; if((mv.tipo==="saida" || mv.tipo==="contagem") && mv.delta<0) cons += -mv.delta; });
    var vezes = c.solicitacoes.filter(function(x){ return mesmoId(x.materialId, mat.id) && x.dataCompra && x.dataCompra>=de && x.dataCompra<=ate; }).length + c.pedidos.filter(function(p){ return p.itens.some(function(i){ return mesmoId(i.materialId, mat.id); }) && p.compradoEm && diaDe(p.compradoEm)>=de && diaDe(p.compradoEm)<=ate; }).length;
    return {materialId:mat.id, material:mat.material, categoria:nomeDe(c.matCategorias, mat.categoriaId, ""), consumoMes:cons, vezesComprado:vezes};
  }).filter(function(x){ return x.consumoMes>0; }).sort(function(x, y){ return y.consumoMes-x.consumoMes; });
  return n>0 ? rk.slice(0, n) : rk;
}
// movimentos de um material, do mais novo para o mais antigo (com rótulos)
function movimentosDe(s, materialId){ return s.ce.movimentos.filter(function(x){ return mesmoId(x.materialId, materialId); }).sort(function(a, b){ return b.em.localeCompare(a.em) || (Number(b.id)-Number(a.id)); }).map(function(x){ return Object.assign({}, x, {rotuloTipo:ROTULO_MOV[x.tipo]}); }); }
// histórico do item: log de cadastro + movimentos (contagens, entradas, saídas, ajustes), do mais novo para o mais antigo
function historicoMaterial(s, materialId){
  var l = s.ce.logMateriais.filter(function(x){ return mesmoId(x.materialId, materialId); }).map(function(x){ return {tipo:"log", acao:x.acao, em:x.em, por:x.por, texto:x.detalhe||"", id:"log:"+x.id}; });
  var mv = movimentosDe(s, materialId).map(function(x){ return {tipo:"movimento", acao:x.tipo, em:x.em, por:x.quem||x.por, texto:(x.tipo==="contagem" ? "Contagem: "+x.qtd+" (era "+x.saldoAntes+")" : ROTULO_MOV[x.tipo]+": "+(x.delta>0 ? "+" : "")+x.delta+" → saldo "+x.saldoApos)+(x.motivo ? " · "+x.motivo : "")+(x.estornado ? " · estornado" : ""), id:"mov:"+x.id}; });
  return l.concat(mv).sort(function(a, b){ return b.em.localeCompare(a.em); });
}
// solicitações de compra de estoque. o = {status, materialId, tipoId}
function listarSolicitacoes(s, o){
  o = o||{}; return s.ce.solicitacoes.filter(function(x){ if(o.status && x.status!==o.status) return false; if(o.materialId && !mesmoId(x.materialId, o.materialId)) return false; if(o.tipoId){ var m = porId(s.ce.materiais, x.materialId), c = m && porId(s.ce.matCategorias, m.categoriaId); if(!c || c.tipoId!==o.tipoId) return false; } return true; })
    .sort(function(a, b){ return b.solicitadoEm.localeCompare(a.solicitadoEm) || (Number(b.id)-Number(a.id)); }).map(function(x){ var m = porId(s.ce.materiais, x.materialId); return Object.assign({}, x, {rotuloStatus:ROTULO_SOL[x.status], material:m ? m.material : "(material excluído)", unidade:m ? m.unidade : ""}); });
}
// próxima contagem prevista: o próximo dia de config.diasContagem a partir de hoje (inclui hoje)
function proximaContagem(cfg, hoje){ var h = hoje||hojeSP(), dias = cfg.diasContagem||[]; if(!dias.length) return null; for(var i=0; i<8; i++){ var d = somaDias(h, i), w = new Date(Date.UTC(+d.slice(0, 4), +d.slice(5, 7)-1, +d.slice(8, 10))).getUTCDay(); if(dias.indexOf(w)>=0) return d; } return null; }
// itens para o relatório "o que comprar": críticos/zerados e atenção, sem os parados e sem os já solicitados/aguardando entrega
function listaParaComprar(s, tipoId){
  return (tipoId ? materiaisDoTipo(s, tipoId) : s.ce.materiais).filter(function(m){ return !m.parado; }).map(function(m){ return materialVisto(s, m); }).filter(function(v){ return (v.status==="CRITICO" || v.status==="ATENCAO") && !v.aguardandoDecisao && v.comprasChegando===0; })
    .sort(function(a, b){ return (a.status===b.status ? 0 : a.status==="CRITICO" ? -1 : 1) || (a.saldo-b.saldo); });
}

// ---------- ações ----------
// movimenta o estoque de um material. tipo: contagem (qtd = valor contado) | entrada | saida (qtd > 0) | ajuste (qtd com sinal, diferente de 0). o = {data, agora, por, quem, motivo, ref}. Devolve {erro} ou {mov}
function movimenta(ce, m, tipo, qtd, o){
  var cfg = ce.config, antes = m.estoqueAtual, delta = tipo==="contagem" ? qtd-antes : tipo==="saida" ? -qtd : qtd, depois = antes+delta;
  if(depois<0 && !cfg.permitirSaldoNegativo) return {erro:"Saldo insuficiente: há "+antes+" e a saída é de "+qtd+"."};
  m.estoqueAtual = depois; m.atualizadoEm = o.agora; if(tipo==="contagem") m.ultimaContagem = o.data;
  var mv = {id:proximoId(ce), materialId:m.id, tipo:tipo, qtd:qtd, delta:delta, saldoAntes:antes, saldoApos:depois, data:o.data, em:o.agora, por:o.por, quem:trim(o.quem)||o.por, motivo:trim(o.motivo), ref:o.ref||null, estornado:false};
  ce.movimentos.push(mv); return {mov:mv};
}
function logMat(ce, m, acao, detalhe, por, agora){ ce.logMateriais.push({id:proximoId(ce), materialId:m.id, numero:m.numero, material:m.material, acao:acao, detalhe:detalhe||"", por:por, em:agora}); }
// entrada automática ao receber (pedido ou solicitação). Devolve {erro} ou {mov}
function entradaDeRecebimento(ce, m, qtd, dia, por, agora, ref, custoUnit){
  if(!(qtd>0)) return {erro:"Informe a quantidade que entrou no estoque."}; var r = movimenta(ce, m, "entrada", qtd, {data:dia, agora:agora, por:por, motivo:"Recebimento de compra", ref:ref}); if(r.erro) return r;
  if(custoUnit!=null) m.ultimoCusto = r2(custoUnit); return {mov:r.mov};
}
var NUMS_CONFIG = {limiteAutorizacao:0, autorizacoesNecessarias:1, orcFaixa1Min:0, orcFaixa2Min:0, slaHoras:0, parcelasMax:1, motivoMax:20, paginaPedidos:1, atencaoPct:100, topConsumo:1};
var CAMPOS_PEDIDO = ["titulo", "link", "observacao", "urgencia", "tipoEntrega", "setorId", "categoriaId", "fornecedorId", "fornecedorNome", "valorEstimado", "vencimento", "previsaoEntrega", "prazoPagamentoDias", "condicoesTxt", "numeroFornecedor", "cnpjId", "cnpjOutro"];
var DECIDE_MSG = "Só quem tem a autorização \"Aprovar, reprovar e liberar para compra\" pode fazer isso.";
var EFETUA_MSG = "Só quem tem a autorização \"Efetuar compras liberadas\" pode efetuar a compra.";

function ceReduz(s, a){
  var ce = clone(s.ce), cfg = ce.config, por = a.por||"—", agora = a.agora||agoraSP(), hoje = diaDe(agora);
  var recusa = function(t){ return {patch:{}, msg:t}; }, ok = function(msg){ return {patch:{ce:ce}, msg:msg}; };
  var ped = function(){ return porId(ce.pedidos, a.id); }, mat = function(id){ return porId(ce.materiais, id!=null ? id : a.id); }, sol = function(){ return porId(ce.solicitacoes, a.id); };
  var emUso = function(txt){ return recusa(txt); };
  // data opcional (YYYY-MM-DD): vazio → padrão; inválida → undefined
  var dataOu = function(v, padrao){ if(vazio(v)) return padrao; return ehDia(trim(v)) ? trim(v) : undefined; };
  var fornNome = function(id, txt){ return id!=null && id!=="" ? nomeDe(ce.fornecedores, id, trim(txt)) : trim(txt); };
  var nomeRepetido = function(lista, nome, exceto){ return lista.some(function(x){ return !mesmoId(x.id, exceto) && norm(x.nome)===norm(nome); }); };
  var setaTexto = function(o, k){ if(a[k]!==undefined){ o[k] = trim(a[k]); } };
  // próximo status depois que o financeiro aprova/autoriza: sem CNPJ pagador pede o CNPJ; com CNPJ vai direto para APROVADA (ou pede a conta, se config.pularFormaPagamento for falso)
  var statusDepoisDeAprovar = function(p){ return !p.cnpjId ? "AGUARDANDO_CNPJ" : (cfg.pularFormaPagamento ? "APROVADA" : "AGUARDANDO_FORMA_PAGAMENTO"); };
  var textoDepois = function(st){ return st==="AGUARDANDO_CNPJ" ? "aprovado, falta definir o CNPJ pagador." : st==="APROVADA" ? "aprovado, falta liberar para compra." : "aprovado, falta a conta pagadora."; };
  // aprovação com limite de autorização: usada em "aprovar" e "ajustar_orcamento"
  var aprovaOuTrava = function(p, sujeito){
    if(!p.respondidoEm) p.respondidoEm = agora;
    if(p.valorEstimado>=cfg.limiteAutorizacao && !a.podeAutorizar){ p.status = "AGUARDANDO_AUTORIZACAO"; evento(p, por, sujeito+" enviado para autorização (acima de "+formatarReais(cfg.limiteAutorizacao)+")", agora); return "enviado para autorização (acima de "+formatarReais(cfg.limiteAutorizacao)+")."; }
    p.status = statusDepoisDeAprovar(p); p.aprovadoPor = por; p.aprovadoEm = agora; if(a.podeAutorizar && p.autorizadoPor.indexOf(por)<0) p.autorizadoPor.push(por); evento(p, por, sujeito+" aprovado por "+por, agora); return textoDepois(p.status);
  };
  // libera para compra (a.modo "ok" = só liberação, o comprador decide como comprar; "plano" = o financeiro já definiu COMO comprar: a.plano opcional e o plano precisa estar preenchido e FECHADO). Devolve {erro} ou {}
  var liberaPedido = function(p){
    var modo = vazio(a.modo) ? "ok" : a.modo; if(modo!=="ok" && modo!=="plano") return {erro:"Escolha como liberar: só liberar ou definir como comprar."};
    var nota = trim(a.nota); if(nota.length>cfg.motivoMax) return {erro:"A observação passou de "+cfg.motivoMax+" caracteres."};
    if(modo==="plano"){
      if(a.plano){ var lq = lePlano(a.plano, p.plano); if(lq.erro) return {erro:lq.erro}; p.plano = lq.plano; }
      var sq = planoSituacao(p, cfg); if(sq.vazio) return {erro:"Para definir como comprar, preencha o plano de pagamento (forma, valor e vencimento de cada parte)."}; if(!sq.fecha) return {erro:"O plano de pagamento precisa fechar com o total antes de liberar: "+sq.aviso};
    }
    p.status = "LIBERADA"; p.liberacao = {por:por, porId:a.porId==null ? null : a.porId, em:agora, modo:modo, nota:nota};
    evento(p, por, "Liberada para compra por "+por+(modo==="plano" ? " — plano de pagamento definido pelo financeiro ("+p.plano.length+(p.plano.length===1 ? " parte, " : " partes, ")+formatarReais(planoSituacao(p, cfg).soma)+")" : " — só liberação, o comprador decide como comprar")+(nota ? ". Observação: "+nota : ""), agora);
    return {};
  };
  // lê e confere a lista de itens da solicitação. Devolve {itens} ou {erro}
  var leItens = function(lista, classPadrao){
    var out = []; if(!lista || !lista.length) return {erro:"Coloque pelo menos um item na compra."};
    for(var i = 0; i<lista.length; i++){
      var d = lista[i], ct = d.catalogoId ? porId(ce.catalogo, d.catalogoId) : null, rot = trim(d.titulo) ? "\""+trim(d.titulo)+"\"" : "item "+(i+1);
      if(d.catalogoId && !ct) return {erro:"Item do catálogo não encontrado ("+rot+")."}; if(!trim(d.titulo)) return {erro:"Informe o nome do item "+(i+1)+"."};
      if(!vazio(d.quantidade) && (!ehInt(d.quantidade) || num(d.quantidade)<1)) return {erro:"A quantidade de "+rot+" precisa ser um número inteiro de 1 em diante."};
      if(!vazio(d.valorUnitario) && num(d.valorUnitario)<0) return {erro:"O valor de "+rot+" não pode ser negativo."}; if(!vazio(d.valorTotal) && num(d.valorTotal)<0) return {erro:"O valor de "+rot+" não pode ser negativo."};
      var un = trim(d.unidade).toUpperCase() || (ct ? ct.unidade : "UNID"); if(UNIDADES.indexOf(un)<0) return {erro:"Unidade desconhecida em "+rot+"."};
      var cl = d.classificacao || (ct && ct.classificacao) || classPadrao; if(!cl) return {erro:"Escolha a classificação de "+rot+" (material, consumo, patrimônio ou serviço)."}; if(!classif(cfg, cl)) return {erro:"Classificação desconhecida em "+rot+"."};
      if(d.materialId && !mat(d.materialId)) return {erro:"Material do estoque não encontrado ("+rot+")."}; if(!vazio(d.fatorEntrada) && (!ehInt(d.fatorEntrada) || num(d.fatorEntrada)<1)) return {erro:"O fator de entrada de "+rot+" precisa ser um inteiro de 1 em diante."};
      out.push(novoItem(ce, Object.assign({}, d, {id:undefined, unidade:un, classificacao:cl, quantidade:vazio(d.quantidade) ? 1 : d.quantidade, qtdRecebida:0})));
    }
    return {itens:out};
  };
  // lê e confere as partes do plano de pagamento (mantém "pago" das partes que já existiam, pelo id). Devolve {plano} ou {erro}
  var lePlano = function(lista, antigo){
    var out = []; for(var i = 0; i<(lista||[]).length; i++){
      var x = lista[i], v = num(x.valor); if(FORMAS_PLANO.indexOf(x.forma)<0) return {erro:"Escolha a forma da parte "+(i+1)+" do pagamento."}; if(!(v>0)) return {erro:"Informe o valor da parte "+(i+1)+" do pagamento."}; if(!ehDia(trim(x.vencimento))) return {erro:"Informe o vencimento da parte "+(i+1)+"."};
      var par = vazio(x.parcelas) ? null : Math.round(num(x.parcelas)); if(par!=null && x.forma!=="cartao") return {erro:"Parcelas só valem no cartão (parte "+(i+1)+")."}; if(par!=null && (par<1 || par>cfg.parcelasMax)) return {erro:"Parcelas de 1 a "+cfg.parcelasMax+" (parte "+(i+1)+")."};
      var ant = x.id!=null ? (antigo||[]).find(function(y){ return mesmoId(y.id, x.id); }) : null;
      out.push({id:ant ? ant.id : proximoId(ce), forma:x.forma, valor:r2(v), vencimento:trim(x.vencimento), parcelas:x.forma==="cartao" ? (par||1) : null, obs:trim(x.obs), pago:ant ? ant.pago : false, pagoEm:ant ? ant.pagoEm : null});
    }
    return {plano:out};
  };
  var avisoPlano = function(p){ var si = planoSituacao(p, cfg); return p.plano.length && !si.fecha ? " Atenção: o plano de pagamento não fecha com o total ("+si.aviso+")" : ""; };

  switch(a.op){
    // ---------------- configuração e cadastros ----------------
    case "config_set": {
      var kk = Object.keys(NUMS_CONFIG);
      for(var i = 0; i<kk.length; i++){ var k = kk[i]; if(a[k]===undefined) continue; var v = num(a[k]); if(!isFinite(v) || v<NUMS_CONFIG[k]) return recusa("Valor inválido em "+k+" (mínimo "+NUMS_CONFIG[k]+")."); cfg[k] = k==="limiteAutorizacao" || k.indexOf("orcFaixa")===0 ? r2(v) : Math.round(v); }
      if(a.toleranciaPlano!==undefined){ var tl = num(a.toleranciaPlano); if(tl<0) return recusa("A tolerância não pode ser negativa."); cfg.toleranciaPlano = r2(tl); }
      if(cfg.orcFaixa2Min<cfg.orcFaixa1Min) return recusa("A segunda faixa de orçamento não pode ser menor que a primeira.");
      ["entradaAoReceber", "bloquearContagemRetroativa", "permitirSaldoNegativo", "pularFormaPagamento"].forEach(function(b){ if(a[b]!==undefined) cfg[b] = !!a[b]; });
      if(a.opcaoSemNota!==undefined){ if(!trim(a.opcaoSemNota)) return recusa("Informe o texto da opção sem nota fiscal."); cfg.opcaoSemNota = trim(a.opcaoSemNota); }
      if(a.aprovadores!==undefined) cfg.aprovadores = (a.aprovadores||[]).filter(function(x){ return !vazio(x); }).map(function(x){ return isFinite(Number(x)) ? Number(x) : x; });
      if(a.diasContagem!==undefined){ var dc = (a.diasContagem||[]).map(Number).filter(function(d){ return d>=0 && d<=6 && d===Math.floor(d); }); cfg.diasContagem = dc.filter(function(d, j){ return dc.indexOf(d)===j; }).sort(); }
      if(a.classificacoes!==undefined){
        var cl = (a.classificacoes||[]).map(function(c){ return {id:trim(c.id)||norm(c.nome).replace(/[^a-z0-9]+/g, "_"), nome:trim(c.nome), entraEstoque:!!c.entraEstoque}; });
        if(!cl.length || cl.some(function(c){ return !c.nome || !c.id; })) return recusa("Cada classificação precisa de nome."); if(cl.some(function(c, j){ return cl.findIndex(function(u){ return u.id===c.id; })!==j; })) return recusa("Duas classificações com o mesmo nome.");
        var usada = cfg.classificacoes.filter(function(c){ return !cl.some(function(u){ return u.id===c.id; }) && (ce.catalogo.some(function(x){ return x.classificacao===c.id; }) || ce.pedidos.some(function(p){ return p.itens.some(function(it){ return it.classificacao===c.id; }); })); });
        if(usada.length) return recusa("A classificação \""+usada[0].nome+"\" está em uso: não dá para remover."); cfg.classificacoes = cl;
      }
      if(a.tipos!==undefined){
        var tp = (a.tipos||[]).map(function(t){ return {id:trim(t.id)||norm(t.nome).replace(/[^a-z0-9]+/g, "_"), nome:trim(t.nome), aprovador:trim(t.aprovador)}; });
        if(!tp.length || tp.some(function(t){ return !t.nome || !t.id; })) return recusa("Cada aba precisa de nome."); if(tp.some(function(t, j){ return tp.findIndex(function(u){ return u.id===t.id; })!==j; })) return recusa("Duas abas com o mesmo nome.");
        var emUsoTipo = cfg.tipos.filter(function(t){ return !tp.some(function(u){ return u.id===t.id; }) && ce.matCategorias.some(function(c){ return c.tipoId===t.id; }); }); if(emUsoTipo.length) return recusa("A aba \""+emUsoTipo[0].nome+"\" tem categorias: esvazie antes de remover.");
        cfg.tipos = tp;
      }
      return ok("Configuração salva.");
    }
    case "regras_set": ce.regras = String(a.texto==null ? "" : a.texto); return ok("Regras salvas.");
    case "acesso_set": {   // papel de uma pessoa/perfil. setor "compras": papel (null/"" remove) · setor "estoque": papeis [CONTAGEM,COMPRA,APROVACAO] ([] remove). Quem aprova compras vem de autorizacoes.js / config.aprovadores
      var q = trim(a.quem); if(!q) return recusa("Escolha a pessoa.");
      if(a.setor==="compras"){ if(!a.papel){ delete ce.acessos.compras[q]; return ok("Acesso removido."); } if(PAPEIS_COMPRAS.indexOf(a.papel)<0) return recusa("Papel desconhecido."); ce.acessos.compras[q] = a.papel; return ok("Papel de "+q+": "+ROTULO_PAPEL[a.papel]+"."); }
      if(a.setor==="estoque"){ var ps = (a.papeis||[]).filter(function(c){ return CAPS_ESTOQUE.indexOf(c)>=0; }); if(!ps.length){ delete ce.acessos.estoque[q]; return ok("Acesso removido."); } ce.acessos.estoque[q] = ps; return ok("Acesso de "+q+" salvo."); }
      return recusa("Escolha Compras ou Estoque.");
    }
    case "forn_add": case "forn_set": {
      var novo = a.op==="forn_add", f = novo ? null : porId(ce.fornecedores, a.id); if(!novo && !f) return recusa("Fornecedor não encontrado.");
      var nm = trim(novo || a.nome!==undefined ? a.nome : f.nome); if(!nm) return recusa("Informe o nome do fornecedor."); if(nomeRepetido(ce.fornecedores, nm, novo ? null : f.id)) return recusa("Já existe um fornecedor com esse nome.");
      if(novo){ f = {id:proximoId(ce, a), nome:nm, documento:"", telefone:"", email:"", contato:"", observacao:"", ativo:true}; ce.fornecedores.push(f); } f.nome = nm;
      ["documento", "telefone", "email", "contato", "observacao"].forEach(function(k){ setaTexto(f, k); }); if(a.ativo!==undefined) f.ativo = !!a.ativo;
      return ok(novo ? nm+" cadastrado." : "Fornecedor atualizado.");
    }
    case "forn_del": {
      var fd = porId(ce.fornecedores, a.id); if(!fd) return recusa("Fornecedor não encontrado.");
      if(ce.pedidos.some(function(p){ return mesmoId(p.fornecedorId, fd.id); }) || ce.solicitacoes.some(function(x){ return mesmoId(x.fornecedorId, fd.id); }) || ce.materiais.some(function(m){ return mesmoId(m.fornecedorId, fd.id); })) return emUso("Fornecedor em uso: marque como inativo em vez de excluir.");
      ce.fornecedores = ce.fornecedores.filter(function(x){ return x!==fd; }); return ok("Fornecedor removido.");
    }
    case "setor_add": case "setor_set": case "cat_add": case "cat_set": {   // setor (com cor) e categoria do módulo de compras
      var ehSetor = a.op.indexOf("setor")===0, lista = ehSetor ? ce.setores : ce.categorias, novoS = a.op.slice(-3)==="add", it = novoS ? null : porId(lista, a.id); if(!novoS && !it) return recusa((ehSetor ? "Setor" : "Categoria")+" não encontrado.");
      var ns = trim(novoS || a.nome!==undefined ? a.nome : it.nome); if(!ns) return recusa("Informe o nome."); if(nomeRepetido(lista, ns, novoS ? null : it.id)) return recusa("Já existe com esse nome.");
      if(novoS){ it = {id:proximoId(ce, a), nome:ns, ordem:lista.length}; if(ehSetor) it.cor = null; lista.push(it); } it.nome = ns; if(a.ordem!==undefined) it.ordem = Math.round(num(a.ordem)); if(ehSetor && a.cor!==undefined) it.cor = trim(a.cor)||null;
      return ok(novoS ? ns+" criado." : "Salvo.");
    }
    case "setor_del": case "cat_del": {
      var ehS = a.op==="setor_del", lst = ehS ? ce.setores : ce.categorias, xd = porId(lst, a.id); if(!xd) return recusa("Não encontrado.");
      if(ce.pedidos.some(function(p){ return mesmoId(ehS ? p.setorId : p.categoriaId, xd.id); }) || (!ehS && ce.catalogo.some(function(c){ return mesmoId(c.categoriaId, xd.id); }))) return emUso((ehS ? "Setor" : "Categoria")+" em uso por solicitações.");
      if(ehS) ce.setores = ce.setores.filter(function(x){ return x!==xd; }); else ce.categorias = ce.categorias.filter(function(x){ return x!==xd; }); return ok("Removido.");
    }
    case "catalogo_add": case "catalogo_set": {   // item do catálogo de compras: guarda a CLASSIFICAÇÃO (decide se entra no estoque) e, se for material de estoque, o material ligado
      var novoC = a.op==="catalogo_add", ci = novoC ? null : porId(ce.catalogo, a.id); if(!novoC && !ci) return recusa("Item do catálogo não encontrado.");
      var nc = trim(novoC || a.nome!==undefined ? a.nome : ci.nome); if(!nc) return recusa("Informe o item."); if(nomeRepetido(ce.catalogo, nc, novoC ? null : ci.id)) return recusa("Já existe um item com esse nome.");
      var un = a.unidade!==undefined ? trim(a.unidade).toUpperCase() : (ci ? ci.unidade : "UNID"); if(UNIDADES.indexOf(un)<0) return recusa("Unidade desconhecida.");
      var clz = a.classificacao!==undefined ? a.classificacao : (ci ? ci.classificacao : "material"); if(!classif(cfg, clz)) return recusa("Escolha a classificação (material, consumo, patrimônio ou serviço).");
      if(a.categoriaId && !porId(ce.categorias, a.categoriaId)) return recusa("Categoria não encontrada."); if(a.materialId && !mat(a.materialId)) return recusa("Material do estoque não encontrado."); if(a.precoRef!==undefined && !vazio(a.precoRef) && num(a.precoRef)<0) return recusa("O preço de referência não pode ser negativo.");
      if(novoC){ ci = {id:proximoId(ce, a), nome:nc, categoriaId:null, unidade:un, classificacao:clz, materialId:null, precoRef:null, apelidos:[]}; ce.catalogo.push(ci); } ci.nome = nc; ci.unidade = un; ci.classificacao = clz; if(a.categoriaId!==undefined) ci.categoriaId = a.categoriaId||null; if(a.materialId!==undefined) ci.materialId = a.materialId||null; if(a.precoRef!==undefined) ci.precoRef = vazio(a.precoRef) ? null : r2(num(a.precoRef));
      if(a.apelidos!==undefined) ci.apelidos = (a.apelidos||[]).map(trim).filter(Boolean); return ok(novoC ? nc+" adicionado ao catálogo." : "Catálogo atualizado.");
    }
    case "catalogo_del": { var cd = porId(ce.catalogo, a.id); if(!cd) return recusa("Item não encontrado."); if(ce.pedidos.some(function(p){ return p.itens.some(function(i){ return mesmoId(i.catalogoId, cd.id); }); })) return emUso("Item em uso por solicitações."); ce.catalogo = ce.catalogo.filter(function(x){ return x!==cd; }); return ok("Item removido do catálogo."); }
    case "conta_add": case "conta_set": {   // conta pagadora (por CNPJ)
      var novoK = a.op==="conta_add", ct = novoK ? null : porId(ce.contas, a.id); if(!novoK && !ct) return recusa("Conta não encontrada.");
      var tipo = a.tipo!==undefined ? a.tipo : (ct ? ct.tipo : null); if(FORMAS_PAGAMENTO.indexOf(tipo)<0) return recusa("Escolha o tipo (cartão, Pix, dinheiro ou boleto)."); var tit = trim(a.titular!==undefined ? a.titular : (ct ? ct.titular : "")); if(!tit) return recusa("Informe o titular.");
      if(a.cnpjId && !cnpjIdValido(a.cnpjId)) return recusa("CNPJ desconhecido.");
      if(novoK){ ct = {id:proximoId(ce, a), tipo:tipo, rotulo:"", cnpjId:null, documento:"", banco:"", titular:tit, finalOuChave:"", ativa:true}; ce.contas.push(ct); } ct.tipo = tipo; ct.titular = tit; if(a.cnpjId!==undefined) ct.cnpjId = a.cnpjId||null; ["rotulo", "documento", "banco", "finalOuChave"].forEach(function(k){ setaTexto(ct, k); }); if(a.ativa!==undefined) ct.ativa = !!a.ativa;
      return ok(novoK ? "Conta adicionada." : "Conta atualizada.");
    }
    case "conta_del": { var kd = porId(ce.contas, a.id); if(!kd) return recusa("Conta não encontrada."); ce.pedidos.forEach(function(p){ if(mesmoId(p.contaId, kd.id)) p.contaId = null; }); ce.contas = ce.contas.filter(function(x){ return x!==kd; }); return ok("Conta removida (as solicitações ficaram sem conta)."); }
    case "motivo_add": { var mt = trim(a.nome); if(!mt) return recusa("Informe o motivo."); if(ce.motivosNegativa.some(function(x){ return norm(x)===norm(mt); })) return ok("Esse motivo já existe."); ce.motivosNegativa.push(mt); return ok("Motivo adicionado."); }
    case "motivo_del": { var mi = ce.motivosNegativa.findIndex(function(x){ return norm(x)===norm(a.nome); }); if(mi<0) return recusa("Motivo não encontrado."); ce.motivosNegativa.splice(mi, 1); return ok("Motivo removido."); }

    // ---------------- compras (solicitações de compra) ----------------
    case "pedido_add": {   // quem negocia cria a solicitação. itens:[{titulo, quantidade, unidade, valorUnitario|valorTotal, catalogoId, classificacao, materialId, fatorEntrada, marca}] (ou, para um item só, titulo/quantidade/... soltos)
      var itensIn = Array.isArray(a.itens) && a.itens.length ? a.itens : [{titulo:a.titulo, quantidade:a.quantidade, unidade:a.unidade, valorUnitario:a.valorUnitario, valorTotal:a.valorItem, catalogoId:a.catalogoId, materialId:a.materialId, classificacao:a.classificacao, marca:a.marca, fatorEntrada:a.fatorEntrada}];
      var li = leItens(itensIn, a.classificacao); if(li.erro) return recusa(li.erro);
      if(!vazio(a.valorEstimado) && num(a.valorEstimado)<0) return recusa("O valor não pode ser negativo."); if(a.categoriaId && !porId(ce.categorias, a.categoriaId)) return recusa("Categoria não encontrada."); if(a.setorId && !porId(ce.setores, a.setorId)) return recusa("Setor não encontrado.");
      if(a.fornecedorId && !porId(ce.fornecedores, a.fornecedorId)) return recusa("Fornecedor não encontrado."); if(a.urgencia && URGENCIAS.indexOf(a.urgencia)<0) return recusa("Urgência desconhecida.");
      if(a.cnpjId && !cnpjIdValido(a.cnpjId)) return recusa("CNPJ pagador desconhecido."); if(a.cnpjId==="outro" && !trim(a.cnpjOutro)) return recusa("Digite qual é o outro CNPJ pagador.");
      if(a.previsaoEntrega && !ehDia(a.previsaoEntrega)) return recusa("Prazo de entrega inválido."); if(!vazio(a.prazoPagamentoDias) && (!ehInt(a.prazoPagamentoDias) || num(a.prazoPagamentoDias)<0)) return recusa("O prazo de pagamento precisa ser um número de dias (0 em diante).");
      var lp = lePlano(a.plano, []); if(lp.erro) return recusa(lp.erro);
      var np = novoPedido(ce, Object.assign({}, a, {id:undefined, itens:li.itens.map(function(x){ return Object.assign({}, x); }), status:"NAO_VERIFICADA", solicitadoEm:agora, eventos:undefined, plano:[], fornecedorNome:fornNome(a.fornecedorId, a.fornecedorNome)}), agora, por, false);
      np.itens = li.itens; np.plano = lp.plano; ce.pedidos.push(np); return ok("Pedido #"+np.id+" enviado ao financeiro."+avisoPlano(np));
    }
    case "pedido_set": {   // operador corrige dados (o original não gravava na linha do tempo; aqui grava). Itens: pedido_itens_set. Plano: pedido_plano_set
      var pe = ped(); if(!pe) return recusa("Pedido não encontrado."); if(["NEGADA", "CANCELADA", "ENTREGUE"].indexOf(pe.status)>=0) return recusa("Esse pedido já foi finalizado.");
      var mud = [];
      if(a.titulo!==undefined && !trim(a.titulo)) return recusa("Informe o título."); if(a.valorEstimado!==undefined && !vazio(a.valorEstimado) && num(a.valorEstimado)<0) return recusa("O valor não pode ser negativo.");
      if(a.vencimento && !ehDia(a.vencimento)) return recusa("Vencimento inválido."); if(a.previsaoEntrega && !ehDia(a.previsaoEntrega)) return recusa("Prazo de entrega inválido."); if(a.urgencia && URGENCIAS.indexOf(a.urgencia)<0) return recusa("Urgência desconhecida.");
      if(a.tipoEntrega && TIPOS_ENTREGA.indexOf(a.tipoEntrega)<0) return recusa("Tipo de entrega desconhecido."); if(a.fornecedorId && !porId(ce.fornecedores, a.fornecedorId)) return recusa("Fornecedor não encontrado.");
      if(a.cnpjId && !cnpjIdValido(a.cnpjId)) return recusa("CNPJ pagador desconhecido."); if(a.prazoPagamentoDias!==undefined && !vazio(a.prazoPagamentoDias) && (!ehInt(a.prazoPagamentoDias) || num(a.prazoPagamentoDias)<0)) return recusa("O prazo de pagamento precisa ser um número de dias.");
      CAMPOS_PEDIDO.forEach(function(k){ if(a[k]===undefined) return; var nv = a[k];
        if(k==="valorEstimado") nv = vazio(nv) ? 0 : r2(num(nv)); else if(k==="prazoPagamentoDias") nv = vazio(nv) ? null : Math.round(num(nv)); else if(["setorId", "categoriaId", "fornecedorId", "vencimento", "previsaoEntrega", "cnpjId"].indexOf(k)>=0) nv = nv||null; else nv = trim(nv);
        if(nv!==pe[k]){ mud.push(k); pe[k] = nv; } });
      if(a.fornecedorId) pe.fornecedorNome = nomeDe(ce.fornecedores, a.fornecedorId, pe.fornecedorNome);
      if(a.cnpjId!==undefined || a.cnpjOutro!==undefined){ if(pe.cnpjId==="outro" && !trim(pe.cnpjOutro)) return recusa("Digite qual é o outro CNPJ pagador."); pe.cnpj = rotuloCnpj(pe.cnpjId, pe.cnpjOutro, cfg) || null; }
      if(!mud.length) return ok("Nada mudou."); evento(pe, por, "Dados alterados por "+por+": "+mud.join(", "), agora); return ok("Pedido atualizado."+avisoPlano(pe));
    }
    case "pedido_del": { var pd = ped(); if(!pd) return recusa("Pedido não encontrado."); if(temEntradaVigente(ce, pd)) return emUso("Esse pedido já deu entrada no estoque: estorne o lançamento antes de excluir."); ce.pedidos = ce.pedidos.filter(function(x){ return x!==pd; }); return ok("Pedido excluído (a linha do tempo e a conversa foram junto)."); }
    case "pedido_msg": { var pm = ped(); if(!pm) return recusa("Pedido não encontrado."); var tx = trim(a.texto); if(!tx) return recusa("Escreva a mensagem."); pm.mensagens.push({em:agora, por:por, texto:tx}); return ok("Mensagem enviada."); }
    case "pedido_nf": { var pn = ped(); if(!pn) return recusa("Pedido não encontrado."); pn.notaFiscal = trim(a.notaFiscal); evento(pn, por, pn.notaFiscal ? "Nota fiscal informada: "+pn.notaFiscal : "Nota fiscal removida", agora); return ok(pn.notaFiscal ? "Nota fiscal anotada." : "Nota fiscal removida."); }
    case "pedido_pago": {   // marca como paga a compra SEM plano de pagamento (com plano, use pedido_plano_pago)
      var pg = ped(); if(!pg) return recusa("Pedido não encontrado."); if(pg.valorCompra==null) return recusa("Registre a compra antes de marcar como paga."); if(pg.plano.length) return recusa("Esta compra tem plano de pagamento: marque cada parte paga.");
      var dpg = dataOu(a.pagoEm, hoje); if(!dpg) return recusa("Data do pagamento inválida."); pg.pago = a.pago!==false; pg.pagoEm = pg.pago ? dpg : null; evento(pg, por, pg.pago ? "Pagamento registrado por "+por+" em "+formatarDia(dpg) : "Pagamento desmarcado por "+por, agora); return ok(pg.pago ? "Marcada como paga." : "Marcada como a pagar.");
    }
    case "pedido_plano_pago": {   // marca uma parte do plano como paga/não paga; a compra fica paga quando todas as partes estão pagas
      var pp = ped(); if(!pp) return recusa("Pedido não encontrado."); if(PAGAVEL_STATUS.indexOf(pp.status)<0) return recusa("Só dá para marcar pagamento depois da compra efetuada.");
      var parte = (pp.plano||[]).find(function(x){ return mesmoId(x.id, a.parteId); }); if(!parte) return recusa("Parte do pagamento não encontrada."); var dpp = dataOu(a.pagoEm, hoje); if(!dpp) return recusa("Data do pagamento inválida.");
      parte.pago = a.pago!==false; parte.pagoEm = parte.pago ? dpp : null; pp.pago = pp.plano.every(function(x){ return x.pago; }); pp.pagoEm = pp.pago ? dpp : null;
      evento(pp, por, (parte.pago ? "Pago" : "Pagamento desmarcado")+": "+(ROTULO_FORMA_PLANO[parte.forma]||parte.forma)+" "+formatarReais(parte.valor)+" ("+formatarDia(parte.vencimento)+") por "+por, agora); return ok(parte.pago ? "Parte paga." : "Parte voltou a pagar.");
    }
    case "pedido_aprovar": case "pedido_liberar": case "pedido_ajustar_orcamento": case "pedido_autorizar": case "pedido_cnpj": case "pedido_cnpj_desfazer": case "pedido_pagamento": case "pedido_comprar": case "pedido_negar": case "pedido_cancelar": case "pedido_novo_orcamento": case "pedido_reenviar": case "pedido_esperar":
    case "pedido_itens_set": case "pedido_plano_set": case "pedido_enviar_pagamentos": case "pedido_transito": case "pedido_receber": case "pedido_entregar": case "pedido_etiqueta": {
      var p = ped(); if(!p) return recusa("Pedido não encontrado."); var acao = a.op.slice(7), tr = TRANSICOES[acao];
      if(tr.de.indexOf(p.status)<0) return recusa("Não dá para \""+tr.rotulo.toLowerCase()+"\" com o pedido em \""+ROTULO_STATUS[p.status]+"\".");
      if((tr.decide===true || (tr.decide==="depois_de_solicitada" && p.status!=="NAO_VERIFICADA")) && !podeAprovarCompra(s, a.porId)) return recusa(DECIDE_MSG);
      if(tr.decide==="efetua" && !podeEfetuarCompra(s, a.porId)) return recusa(EFETUA_MSG);
      if(acao==="plano_set" && p.status==="LIBERADA" && !podeEditarPlano(s, p, a.porId, null)) return recusa(p.liberacao && p.liberacao.modo==="plano" ? "O plano de pagamento foi definido pelo financeiro: só quem tem a autorização \"Aprovar, reprovar e liberar para compra\" pode alterá-lo." : "Só quem tem a autorização \"Efetuar compras liberadas\" (ou a de aprovar) pode definir o plano de pagamento.");
      switch(acao){
        case "aprovar": {   // a.liberar:true = atalho "Aprovar e liberar": aprova e, se ficou APROVADA (sem pendência de CNPJ/autorização), já libera. Os dois passos entram na linha do tempo
          var m0 = aprovaOuTrava(p, "Pedido");
          if(a.liberar){ if(p.status!=="APROVADA") return ok("Pedido #"+p.id+": "+m0+" Ainda não foi liberado para compra: resolva a pendência e libere depois."); var l0 = liberaPedido(p); if(l0.erro) return recusa(l0.erro); m0 = "aprovado e liberado para compra."; }
          return ok("Pedido #"+p.id+": "+m0+avisoPlano(p));
        }
        case "liberar": {
          var l1 = liberaPedido(p); if(l1.erro) return recusa(l1.erro); return ok("Pedido #"+p.id+": liberado para compra"+(p.liberacao.modo==="plano" ? " (com o plano de pagamento definido)." : " (o comprador decide como comprar)."));
        }
        case "ajustar_orcamento": {   // "Orçamento Anamaria": troca item/valor pelo que o financeiro achou e aprova na mesma ação; o solicitante continua o mesmo. Itens novos (a.itens) são opcionais
          if(a.itens){ if(p.recebimentos.length) return recusa("Já houve recebimento: não dá para trocar os itens."); var la = leItens(a.itens, a.classificacao); if(la.erro) return recusa(la.erro); p.itens = la.itens; }
          var novoVal = !vazio(a.valorEstimado) ? num(a.valorEstimado) : (a.itens ? somaItens(p.itens) : null); if(novoVal==null || novoVal<0) return recusa("Informe o valor.");
          if(a.titulo!==undefined || a.itens) p.titulo = nomeDoPedido(p.itens, a.titulo); if(a.categoriaId && !porId(ce.categorias, a.categoriaId)) return recusa("Categoria não encontrada."); if(a.categoriaId!==undefined) p.categoriaId = a.categoriaId||null;
          if(a.link!==undefined) p.link = trim(a.link); if(a.observacao!==undefined) p.observacao = trim(a.observacao); p.valorEstimado = r2(novoVal);
          var m1 = aprovaOuTrava(p, "Orçamento ajustado por "+por+" — pedido"); return ok("Pedido #"+p.id+": "+m1);
        }
        case "autorizar": {
          var ap = trim(a.autorizador||por); if(!ap) return recusa("Informe quem autorizou."); if(p.autorizadoPor.indexOf(ap)>=0) return recusa(ap+" já autorizou este pedido."); if(!p.respondidoEm) p.respondidoEm = agora; p.autorizadoPor.push(ap);
          if(p.autorizadoPor.length>=cfg.autorizacoesNecessarias){ p.status = statusDepoisDeAprovar(p); p.aprovadoPor = p.autorizadoPor.join(", "); p.aprovadoEm = agora; evento(p, por, "Autorizada por "+ap, agora); return ok("Autorizada: "+textoDepois(p.status).replace(/^aprovado, /, "")); }
          evento(p, por, "Autorização de "+ap+" ("+p.autorizadoPor.length+" de "+cfg.autorizacoesNecessarias+")", agora); return ok("Autorização registrada: faltam "+(cfg.autorizacoesNecessarias-p.autorizadoPor.length)+".");
        }
        case "cnpj": {   // define o CNPJ pagador (ids de domain/cnpjs.js: 34, 46, 59, 67, ho; ou "outro" com texto; ou "sem_nota")
          if(!a.cnpjId || !cnpjIdValido(a.cnpjId)) return recusa("Selecione o CNPJ pagador."); if(a.cnpjId==="outro" && !trim(a.cnpjOutro)) return recusa("Digite qual é o outro CNPJ pagador.");
          p.cnpjId = a.cnpjId; p.cnpjOutro = trim(a.cnpjOutro); p.cnpj = rotuloCnpj(p.cnpjId, p.cnpjOutro, cfg); p.status = cfg.pularFormaPagamento ? "APROVADA" : "AGUARDANDO_FORMA_PAGAMENTO";
          evento(p, por, "CNPJ pagador definido por "+por+": "+p.cnpj, agora); return ok(cfg.pularFormaPagamento ? "CNPJ definido: pode comprar." : "CNPJ definido: falta a conta pagadora.");
        }
        case "cnpj_desfazer": { var tinha = p.status==="APROVADA" && !!p.contaId; p.status = "AGUARDANDO_CNPJ"; p.cnpjId = null; p.cnpjOutro = ""; p.cnpj = null; p.contaId = null; p.tipoPagamento = null; p.parcelas = null; evento(p, por, "CNPJ desfeito por "+por+(tinha ? " — conta pagadora removida" : ""), agora); return ok(tinha ? "CNPJ desfeito (a conta pagadora foi apagada)." : "CNPJ desfeito."); }
        case "pagamento": {   // só quando config.pularFormaPagamento é falso
          var cta = porId(ce.contas, a.contaId); if(!a.contaId) return recusa("Selecione a conta pagadora."); if(!cta) return recusa("Conta pagadora não encontrada.");
          var par = vazio(a.parcelas) ? null : Math.round(num(a.parcelas)); if(par!=null && cta.tipo!=="CARTAO") return recusa("Parcelas só valem no cartão."); if(par!=null && (par<1 || par>cfg.parcelasMax)) return recusa("Parcelas de 1 a "+cfg.parcelasMax+".");
          p.contaId = cta.id; p.tipoPagamento = cta.tipo; p.parcelas = par; p.status = "APROVADA"; evento(p, por, "Conta pagadora definida por "+por+": "+(ROTULO_FORMA[cta.tipo]||cta.tipo), agora); return ok("Pedido #"+p.id+" aprovado para comprar.");
        }
        case "comprar": {   // "compra efetuada": valor real, comprador, datas. O plano de pagamento é montado em pedido_plano_set
          if(vazio(a.valorCompra) || num(a.valorCompra)<0) return recusa("Informe o valor da compra."); if(!p.itens.length) return recusa("A compra não tem itens.");
          if(a.plano){ if(!podeEditarPlano(s, p, a.porId, null)) return recusa(p.liberacao && p.liberacao.modo==="plano" ? "O plano de pagamento foi definido pelo financeiro: só quem aprova pode alterá-lo." : "Sem autorização para definir o plano de pagamento."); var lc = lePlano(a.plano, p.plano); if(lc.erro) return recusa(lc.erro); p.plano = lc.plano; }
          if(!vazio(a.tipoPagamento) && FORMAS_PAGAMENTO.indexOf(a.tipoPagamento)<0) return recusa("Tipo de pagamento desconhecido.");
          var dcp = dataOu(a.compradoEm, hoje), dpv = dataOu(a.previsaoEntrega, null), dvc = dataOu(a.vencimento, null); if(!dcp) return recusa("Data da compra inválida."); if(dpv===undefined) return recusa("Previsão de entrega inválida."); if(dvc===undefined) return recusa("Vencimento inválido.");
          if(a.contaId && !porId(ce.contas, a.contaId)) return recusa("Conta pagadora não encontrada."); if(a.fornecedorId && !porId(ce.fornecedores, a.fornecedorId)) return recusa("Fornecedor não encontrado.");
          var pagoJa = !!a.pago && !p.plano.length, dpa = dataOu(a.pagoEm, dcp); if(!dpa) return recusa("Data do pagamento inválida.");
          p.valorCompra = r2(num(a.valorCompra)); var sc = planoSituacao(p, cfg);
          if(!sc.fecha){ var dfn = p.liberacao && p.liberacao.modo==="plano"; return recusa(sc.vazio ? "Não é possível efetuar a compra sem o plano de pagamento. Preencha o plano (forma, valor e vencimento de cada parte) antes de efetuar." : "Não é possível efetuar a compra com o plano de pagamento em aberto: "+sc.aviso+(dfn ? " O plano foi definido pelo financeiro: peça a ele o ajuste ou informe o valor que fecha com o plano." : " Ajuste o plano de pagamento ou o valor da compra.")); }
          p.status = "COMPRADA"; p.comprador = trim(a.comprador)||por; if(a.tipoPagamento) p.tipoPagamento = a.tipoPagamento; if(a.contaId) p.contaId = a.contaId; p.compradoEm = dcp; if(dpv) p.previsaoEntrega = dpv; p.palavraChave = trim(a.palavraChave)||null; if(dvc) p.vencimento = dvc;
          if(a.fornecedorId){ p.fornecedorId = a.fornecedorId; p.fornecedorNome = nomeDe(ce.fornecedores, a.fornecedorId, p.fornecedorNome); } else if(a.fornecedorNome!==undefined) p.fornecedorNome = trim(a.fornecedorNome); if(!p.plano.length){ p.pago = pagoJa; p.pagoEm = pagoJa ? dpa : null; }
          evento(p, por, "Compra efetuada por "+p.comprador+" — "+formatarReais(p.valorCompra), agora); return ok("Compra efetuada: "+formatarReais(p.valorCompra)+"."+avisoPlano(p));
        }
        case "negar": {   // reprovar (só antes de efetuada; depois, cancelar)
          var mn = trim(a.motivo); if(!mn) return recusa("Motivo é obrigatório para reprovar."); if(mn.length>cfg.motivoMax) return recusa("O motivo passou de "+cfg.motivoMax+" caracteres."); if(!p.respondidoEm) p.respondidoEm = agora; p.status = "NEGADA"; p.motivoNegativa = mn; if(!ce.motivosNegativa.some(function(x){ return norm(x)===norm(mn); }) && a.salvarMotivo!==false) ce.motivosNegativa.push(mn);
          evento(p, por, "Reprovada por "+por+": "+mn, agora); return ok("Pedido #"+p.id+" reprovado.");
        }
        case "cancelar": {
          var mc2 = trim(a.motivo); if(!mc2) return recusa("Diga o motivo do cancelamento."); if(p.recebimentos.length) return recusa("Já houve recebimento: não dá para cancelar."); var jaEnviada = !!p.enviadaPagamentos;
          p.status = "CANCELADA"; p.canceladoPor = por; p.canceladoEm = agora; p.motivoCancelamento = mc2; evento(p, por, "Cancelada por "+por+": "+mc2, agora); return ok("Pedido #"+p.id+" cancelado."+(jaEnviada ? " Atenção: já tinha sido enviado aos pagamentos, avise o financeiro." : ""));
        }
        case "novo_orcamento": {
          var det = trim(a.detalhe); if(MOTIVOS_ORCAMENTO.indexOf(a.motivo)<0 || !det) return recusa("Selecione o motivo e detalhe o que precisa ajustar no orçamento."); if(!p.respondidoEm) p.respondidoEm = agora;
          p.status = "AGUARDANDO_ORCAMENTO"; p.orcamentoMotivo = a.motivo; p.orcamentoDetalhe = det; evento(p, por, "Devolvida para novo orçamento — "+ROTULO_MOTIVO_ORC[a.motivo]+": "+det, agora); return ok("Devolvida para novo orçamento.");
        }
        case "reenviar": {   // reabre o MESMO pedido (não duplica); volta a contar o prazo do financeiro a partir de agora
          if(vazio(a.valorEstimado) || num(a.valorEstimado)<0) return recusa("Informe o novo valor estimado."); p.valorEstimado = r2(num(a.valorEstimado)); if(a.link!==undefined) p.link = trim(a.link); if(a.observacao!==undefined) p.observacao = trim(a.observacao);
          p.status = "NAO_VERIFICADA"; p.solicitadoEm = agora; evento(p, por, "Reenviada por "+por+" com novo orçamento: "+formatarReais(p.valorEstimado), agora); return ok("Pedido reenviado ao financeiro.");
        }
        case "esperar": { var ate = dataOu(a.ate, null); if(ate===undefined) return recusa("Data inválida."); if(!p.respondidoEm) p.respondidoEm = agora; p.status = "AGUARDANDO"; p.esperaAte = ate||null; evento(p, por, ate ? "Em espera até "+formatarDia(ate) : "Colocada em espera", agora); return ok(ate ? "Em espera até "+formatarDia(ate)+"." : "Colocado em espera."); }
        case "itens_set": {   // troca a lista de itens (antes de aprovar) e, por padrão, refaz o valor estimado pela soma
          var lt = leItens(a.itens, a.classificacao); if(lt.erro) return recusa(lt.erro); var tituloAuto = p.titulo===nomeDoPedido(p.itens, ""); p.itens = lt.itens; if(a.titulo!==undefined || tituloAuto || !trim(p.titulo)) p.titulo = nomeDoPedido(p.itens, a.titulo); var sm = somaItens(p.itens); if(a.recalcular!==false && sm>0) p.valorEstimado = sm;
          evento(p, por, "Itens alterados por "+por+" ("+p.itens.length+" itens, "+formatarReais(p.valorEstimado)+")", agora); return ok("Itens atualizados: "+formatarReais(p.valorEstimado)+".");
        }
        case "plano_set": {   // plano de pagamento: partes {id?, forma, valor, vencimento, parcelas (cartão), obs}. Salva mesmo que não feche (com aviso)
          if(p.enviadaPagamentos && !a.forcar) return recusa("Já foi enviado aos pagamentos: mudar o plano aqui não muda lá. Confirme para mudar mesmo assim.");
          var lpl = lePlano(a.plano, p.plano); if(lpl.erro) return recusa(lpl.erro); p.plano = lpl.plano; var sit = planoSituacao(p, cfg);
          evento(p, por, "Plano de pagamento salvo por "+por+" ("+p.plano.length+" parte"+(p.plano.length===1 ? "" : "s")+", "+formatarReais(sit.soma)+(sit.fecha || !p.plano.length ? "" : " — não fecha com "+formatarReais(sit.total))+")", agora);
          return ok(!p.plano.length ? "Plano de pagamento limpo." : sit.fecha ? "Plano salvo e fechando com o total." : "Plano salvo. Atenção: "+sit.aviso);
        }
        case "enviar_pagamentos": {   // o financeiro manda a compra para Pagamentos a fornecedores / Controle de pagamentos (a tela usa compraParaPedidoPagamentos / compraParaOrientacoes)
          if(p.enviadaPagamentos) return recusa("Já foi enviada em "+formatarDataHora(p.enviadaPagamentos.em)+" por "+p.enviadaPagamentos.por+"."); if(!p.plano.length) return recusa("Monte o plano de pagamento antes de enviar.");
          if(!(p.fornecedorId || trim(p.fornecedorNome))) return recusa("Informe o fornecedor antes de enviar."); var st2 = planoSituacao(p, cfg); if(!st2.fecha && !a.forcar) return recusa("O plano não fecha com o total ("+st2.aviso+"). Corrija ou confirme para enviar mesmo assim.");
          var dest = ["pagamentos", "orientacoes", "ambos"].indexOf(a.destino)>=0 ? a.destino : "ambos"; p.enviadaPagamentos = {em:agora, por:por, destino:dest}; evento(p, por, "Enviada aos pagamentos por "+por+" ("+dest+")", agora); return ok("Compra enviada aos pagamentos.");
        }
        case "transito": p.status = "EM_TRANSITO"; evento(p, por, "Marcada como em trânsito", agora); return ok("Em trânsito.");
        case "receber": {   // recebimento total ou parcial. a.itens:[{itemId, qtd}]; sem a.itens recebe tudo que falta. Dá entrada no estoque dos itens cuja classificação entra no estoque e têm material ligado
          var dre = dataOu(a.recebidoEm, hoje); if(!dre) return recusa("Data de recebimento inválida."); if(dre>hoje) return recusa("O recebimento não pode ter data no futuro.");
          var fila = [];
          if(Array.isArray(a.itens) && a.itens.length){ for(var ri = 0; ri<a.itens.length; ri++){ var x = a.itens[ri], it0 = p.itens.find(function(y){ return mesmoId(y.id, x.itemId); }); if(!it0) return recusa("Item não encontrado."); if(fila.some(function(f){ return f.it===it0; })) return recusa("Item repetido: "+it0.titulo+"."); var q0 = num(x.qtd); if(!ehInt(x.qtd) || q0<1) return recusa("Informe a quantidade recebida de "+it0.titulo+" (inteiro, 1 em diante)."); if(q0>it0.quantidade-it0.qtdRecebida) return recusa("De "+it0.titulo+" só faltam "+(it0.quantidade-it0.qtdRecebida)+"."); fila.push({it:it0, q:Math.round(q0)}); } }
          else p.itens.forEach(function(i){ if(i.quantidade-i.qtdRecebida>0) fila.push({it:i, q:i.quantidade-i.qtdRecebida}); });
          if(!fila.length) return recusa("Não falta nada a receber.");
          var rec = {id:proximoId(ce), dia:dre, em:agora, por:por, itens:[]}, avisos = [], entrou = 0;
          for(var fi = 0; fi<fila.length; fi++){
            var f1 = fila[fi], i1 = f1.it, eid = null; i1.qtdRecebida += f1.q;
            if(entraNoEstoque(cfg, i1.classificacao)){
              var mm = i1.materialId ? mat(i1.materialId) : null;
              if(!mm) avisos.push(i1.titulo+": sem material do estoque ligado, não deu entrada"); else if(cfg.entradaAoReceber){ var qe = f1.q*i1.fatorEntrada, en = entradaDeRecebimento(ce, mm, qe, dre, por, agora, {pedidoId:p.id, itemId:i1.id}, i1.valorUnitario!=null ? i1.valorUnitario/i1.fatorEntrada : null); if(en.erro) return recusa(en.erro); eid = en.mov.id; entrou++; }
            }
            rec.itens.push({itemId:i1.id, qtd:f1.q, entradaId:eid});
          }
          p.recebimentos.push(rec); var completo = p.itens.every(function(i){ return i.qtdRecebida>=i.quantidade; }); p.status = completo ? "RECEBIDA" : "RECEBIDA_PARCIAL"; p.recebidoPor = por; if(completo) p.recebidoEm = dre;
          evento(p, por, (completo ? "Recebida (total)" : "Recebida em parte")+" por "+por+" em "+formatarDia(dre)+": "+fila.map(function(f){ return f.q+" de "+f.it.titulo; }).join(", ")+(entrou ? " · entrada no estoque: "+entrou+" item(ns)" : ""), agora);
          return ok((completo ? "Recebida por completo." : "Recebida em parte: ainda falta "+p.itens.reduce(function(t, i){ return t+Math.max(0, i.quantidade-i.qtdRecebida); }, 0)+".")+(entrou ? " "+entrou+" item(ns) deram entrada no estoque." : "")+(avisos.length ? " Atenção: "+avisos.join("; ")+"." : ""));
        }
        case "entregar": {
          var para = trim(a.entregueParaNome); if(!para) return recusa("Informe quem recebeu e assinou."); var den = dataOu(a.entregueEm, hoje); if(!den) return recusa("Data de entrega inválida.");
          p.status = "ENTREGUE"; p.entregueEm = den; p.entregueParaNome = para; p.assinaturaConfirmada = !!a.assinaturaConfirmada; evento(p, por, "Entrega confirmada por "+por+" — recebido por "+para+" em "+formatarDia(den), agora); return ok("Entrega confirmada.");
        }
        case "etiqueta": {
          var et = vazio(a.etiqueta) ? null : a.etiqueta; if(et!=null && ETIQUETAS.indexOf(et)<0) return recusa("Etiqueta desconhecida."); p.etiqueta = et; evento(p, por, et ? "Marcada como \""+ROTULO_ETIQUETA[et]+"\" por "+por : "Etiqueta de logística removida por "+por, agora); return ok(et ? "Etiqueta: "+ROTULO_ETIQUETA[et]+"." : "Etiqueta removida.");
        }
      }
      return recusa("Ação desconhecida.");
    }

    // ---------------- estoque: categorias e materiais ----------------
    case "mcat_add": case "mcat_set": {
      var novoM = a.op==="mcat_add", mc = novoM ? null : porId(ce.matCategorias, a.id); if(!novoM && !mc) return recusa("Categoria não encontrada.");
      var tipoId = a.tipoId!==undefined ? a.tipoId : (mc ? mc.tipoId : null); if(!cfg.tipos.some(function(t){ return t.id===tipoId; })) return recusa("Escolha a aba."); var nmc = trim(novoM || a.nome!==undefined ? a.nome : mc.nome); if(!nmc) return recusa("Informe o nome da categoria.");
      if(ce.matCategorias.some(function(c){ return (!mc || !mesmoId(c.id, mc.id)) && c.tipoId===tipoId && norm(c.nome)===norm(nmc); })) return recusa("Já existe uma categoria com esse nome nesta aba.");
      if(novoM){ mc = {id:proximoId(ce, a), tipoId:tipoId, nome:nmc, ordem:ce.matCategorias.filter(function(c){ return c.tipoId===tipoId; }).length+1}; ce.matCategorias.push(mc); } else if(tipoId!==mc.tipoId && ce.materiais.some(function(m){ return mesmoId(m.categoriaId, mc.id); })) return recusa("A categoria tem itens: não dá para mudar de aba.");
      mc.nome = nmc; mc.tipoId = tipoId; if(a.ordem!==undefined) mc.ordem = Math.round(num(a.ordem)); return ok(novoM ? nmc+" criada." : "Categoria atualizada.");
    }
    case "mcat_del": { var mcd = porId(ce.matCategorias, a.id); if(!mcd) return recusa("Categoria não encontrada."); if(ce.materiais.some(function(m){ return mesmoId(m.categoriaId, mcd.id); })) return emUso("A categoria tem itens: mova ou exclua os itens antes."); ce.matCategorias = ce.matCategorias.filter(function(x){ return x!==mcd; }); return ok("Categoria removida."); }
    case "mat_add": {
      var cat = porId(ce.matCategorias, a.categoriaId); if(!cat) return recusa("Escolha a categoria."); var nmm = trim(a.material); if(!nmm) return recusa("Informe o material."); var unm = trim(a.unidade); if(!unm) return recusa("Informe a unidade (ex.: unid, caixa, pacote).");
      if(!ehInt(a.estoqueMinimo===undefined ? 0 : a.estoqueMinimo) || num(a.estoqueMinimo===undefined ? 0 : a.estoqueMinimo)<0) return recusa("O estoque mínimo precisa ser um inteiro de 0 em diante."); if(a.fornecedorId && !porId(ce.fornecedores, a.fornecedorId)) return recusa("Fornecedor não encontrado.");
      var numero = ce.materiais.filter(function(m){ return mesmoId(m.categoriaId, cat.id); }).reduce(function(t, m){ return Math.max(t, m.numero); }, 0)+1;
      var nm2 = {id:proximoId(ce, a), categoriaId:cat.id, numero:numero, material:nmm, unidade:unm, fornecedorId:a.fornecedorId||null, fornecedor:fornNome(a.fornecedorId, a.fornecedor), estoqueMinimo:Math.round(num(a.estoqueMinimo)), estoqueAtual:0, atualizadoEm:null, ultimaContagem:null, ultimoCusto:null, parado:false, situacao:"NAO_PRECISA_COMPRAR", observacoes:trim(a.observacoes)};
      ce.materiais.push(nm2); logMat(ce, nm2, "CRIADO", "", por, agora); return ok(nmm+" cadastrado (nº "+numero+"). O estoque começa em 0 até a primeira contagem.");
    }
    case "mat_set": {
      var m2 = mat(); if(!m2) return recusa("Material não encontrado."); var dif = [], rot = {material:"Material", unidade:"Unidade", fornecedor:"Fornecedor", estoqueMinimo:"Estoque mínimo", observacoes:"Observações", categoria:"Categoria"};
      if(a.material!==undefined && !trim(a.material)) return recusa("Informe o material."); if(a.unidade!==undefined && !trim(a.unidade)) return recusa("Informe a unidade."); if(a.estoqueMinimo!==undefined && (!ehInt(a.estoqueMinimo) || num(a.estoqueMinimo)<0)) return recusa("O estoque mínimo precisa ser um inteiro de 0 em diante.");
      if(a.fornecedorId && !porId(ce.fornecedores, a.fornecedorId)) return recusa("Fornecedor não encontrado."); var nova = a.categoriaId!==undefined && !mesmoId(a.categoriaId, m2.categoriaId) ? porId(ce.matCategorias, a.categoriaId) : null; if(a.categoriaId!==undefined && !mesmoId(a.categoriaId, m2.categoriaId) && !nova) return recusa("Categoria não encontrada.");
      var troca = function(k, nv){ if(nv!==m2[k]){ dif.push(rot[k]+": \""+(m2[k]===""||m2[k]==null ? "—" : m2[k])+"\" → \""+(nv===""||nv==null ? "—" : nv)+"\""); m2[k] = nv; } };
      if(a.material!==undefined) troca("material", trim(a.material)); if(a.unidade!==undefined) troca("unidade", trim(a.unidade)); if(a.estoqueMinimo!==undefined) troca("estoqueMinimo", Math.round(num(a.estoqueMinimo))); if(a.observacoes!==undefined) troca("observacoes", trim(a.observacoes));
      if(a.fornecedorId!==undefined || a.fornecedor!==undefined){ m2.fornecedorId = a.fornecedorId||null; troca("fornecedor", fornNome(a.fornecedorId, a.fornecedor!==undefined ? a.fornecedor : m2.fornecedor)); }
      if(nova){ var antigaNome = nomeDe(ce.matCategorias, m2.categoriaId, ""); m2.categoriaId = nova.id; m2.numero = ce.materiais.filter(function(m){ return m!==m2 && mesmoId(m.categoriaId, nova.id); }).reduce(function(t, m){ return Math.max(t, m.numero); }, 0)+1; dif.push("Categoria: \""+antigaNome+"\" → \""+nova.nome+"\" (novo nº "+m2.numero+")"); }   // o original mantinha o nº antigo e podia repetir: aqui renumera
      if(!dif.length) return ok("Nada mudou."); logMat(ce, m2, "EDITADO", dif.join("; "), por, agora); return ok("Material atualizado.");
    }
    case "mat_parado": { var m3 = mat(); if(!m3) return recusa("Material não encontrado."); m3.parado = a.parado!==false; logMat(ce, m3, "EDITADO", m3.parado ? "Marcado como parado" : "Voltou a ser ativo", por, agora); return ok(m3.parado ? "Material parado: sai dos alertas." : "Material voltou a ser ativo."); }
    case "mat_situacao": { var m4 = mat(); if(!m4) return recusa("Material não encontrado."); if(SITUACOES.indexOf(a.situacao)<0) return recusa("Situação desconhecida."); m4.situacao = a.situacao; return ok("Situação: "+ROTULO_SITUACAO[a.situacao]+"."); }
    case "mat_obs": { var m5 = mat(); if(!m5) return recusa("Material não encontrado."); var ob = trim(a.texto); if(!ob) return recusa("Escreva a observação."); logMat(ce, m5, "OBSERVACAO", ob+(a.autor ? " ("+trim(a.autor)+")" : ""), por, agora); return ok("Observação anotada."); }
    case "mat_del": {
      var m6 = mat(); if(!m6) return recusa("Material não encontrado."); if(ce.solicitacoes.some(function(x){ return mesmoId(x.materialId, m6.id); })) return emUso("Esse material tem compra registrada: marque como parado em vez de excluir.");
      if(ce.pedidos.some(function(p){ return mesmoId(p.materialId, m6.id); })) return emUso("Há pedidos de compra ligados a esse material: marque como parado em vez de excluir.");
      logMat(ce, m6, "EXCLUIDO", "", por, agora); ce.movimentos = ce.movimentos.filter(function(x){ return !mesmoId(x.materialId, m6.id); }); ce.materiais = ce.materiais.filter(function(x){ return x!==m6; }); return ok("Material excluído.");
    }

    // ---------------- estoque: contagem e movimentos ----------------
    case "estoque_contagem": {   // sobrescreve o estoque atual com o valor contado (o saldo esperado era outro: a diferença vira consumo ou sobra)
      var mc1 = mat(); if(!mc1) return recusa("Material não encontrado."); if(!ehInt(a.valor) || num(a.valor)<0) return recusa("A contagem precisa ser um número inteiro de 0 em diante."); var quem = trim(a.quem); if(!quem) return recusa("Informe quem contou.");
      var dct = dataOu(a.data, hoje); if(!dct) return recusa("Data da contagem inválida."); if(dct>hoje) return recusa("A contagem não pode ter data no futuro."); if(cfg.bloquearContagemRetroativa && mc1.ultimaContagem && dct<mc1.ultimaContagem) return recusa("Já existe contagem mais nova ("+formatarDia(mc1.ultimaContagem)+"): uma contagem antiga faria o estoque voltar.");
      var rc = movimenta(ce, mc1, "contagem", Math.round(num(a.valor)), {data:dct, agora:agora, por:por, quem:quem, motivo:a.motivo}); if(rc.erro) return recusa(rc.erro); var d1 = rc.mov.delta;
      return ok(mc1.material+": "+rc.mov.saldoApos+(d1<0 ? " (consumiu "+(-d1)+")" : d1>0 ? " (sobrou "+d1+" a mais)" : " (igual ao esperado)")+".");
    }
    case "estoque_mov": {   // entrada, saída ou ajuste avulso. qtd inteira; ajuste com sinal e motivo obrigatório
      var m7 = mat(a.materialId!==undefined ? a.materialId : a.id); if(!m7) return recusa("Material não encontrado."); if(["entrada", "saida", "ajuste"].indexOf(a.tipo)<0) return recusa("Escolha entrada, saída ou ajuste."); var q2 = num(a.qtd);
      if(!ehInt(a.qtd) || (a.tipo==="ajuste" ? q2===0 : q2<1)) return recusa(a.tipo==="ajuste" ? "Informe o ajuste (inteiro, diferente de 0; use sinal de menos para tirar)." : "A quantidade precisa ser um inteiro de 1 em diante."); if(a.tipo==="ajuste" && !trim(a.motivo)) return recusa("Diga o motivo do ajuste.");
      if(trim(a.motivo).length>cfg.motivoMax) return recusa("O motivo passou de "+cfg.motivoMax+" caracteres."); var dmv = dataOu(a.data, hoje); if(!dmv) return recusa("Data inválida."); if(dmv>hoje) return recusa("A data não pode ser no futuro.");
      var rm = movimenta(ce, m7, a.tipo, Math.round(q2), {data:dmv, agora:agora, por:por, quem:a.quem, motivo:a.motivo}); if(rm.erro) return recusa(rm.erro); if(a.tipo==="entrada" && a.custoUnit!==undefined && !vazio(a.custoUnit) && num(a.custoUnit)>=0) m7.ultimoCusto = r2(num(a.custoUnit));
      return ok(ROTULO_MOV[a.tipo]+" lançada: "+m7.material+" agora com "+rm.mov.saldoApos+".");
    }
    case "estoque_mov_estornar": {   // não apaga: cria o lançamento contrário (ajuste) e marca o original
      var mo = ce.movimentos.find(function(x){ return mesmoId(x.id, a.id); }); if(!mo) return recusa("Lançamento não encontrado."); if(mo.tipo==="contagem") return recusa("Contagem não se estorna: faça uma nova contagem."); if(mo.estornado) return recusa("Esse lançamento já foi estornado.");
      var m8 = mat(mo.materialId); if(!m8) return recusa("Material não encontrado."); var re = movimenta(ce, m8, "ajuste", -mo.delta, {data:hoje, agora:agora, por:por, motivo:"Estorno do lançamento nº "+mo.id+(trim(a.motivo) ? ": "+trim(a.motivo) : ""), ref:{estornoDe:mo.id}}); if(re.erro) return recusa(re.erro);
      mo.estornado = true; return ok("Lançamento estornado: "+m8.material+" agora com "+re.mov.saldoApos+".");
    }

    // ---------------- estoque: solicitação de compra por item ----------------
    case "sol_add": {
      var m9 = mat(a.materialId); if(!m9) return recusa("Material não encontrado."); if(!ehInt(a.quantidade) || num(a.quantidade)<1) return recusa("A quantidade precisa ser um inteiro de 1 em diante."); if(a.fornecedorId && !porId(ce.fornecedores, a.fornecedorId)) return recusa("Fornecedor não encontrado.");
      var ns2 = {id:proximoId(ce, a), materialId:m9.id, quantidade:Math.round(num(a.quantidade)), status:"SOLICITADO", solicitadoPor:por, solicitadoEm:agora, decididoPor:null, decididoEm:null, observacao:trim(a.observacao), dataCompra:null, dataPrevisaoChegada:null, dataRecebimento:null,
        valor:null, vencimento:null, formaPagamento:null, fornecedorId:a.fornecedorId||(m9.fornecedorId||null), pago:false, entradaId:null};
      ce.solicitacoes.push(ns2); m9.situacao = "SOLICITADO"; return ok("Compra solicitada: "+ns2.quantidade+" de "+m9.material+".");
    }
    case "sol_decidir": {   // decisão é única: só SOLICITADO pode ser decidida
      var x1 = sol(); if(!x1) return recusa("Solicitação não encontrada."); if(["APROVADO", "RECUSADO", "SEGURAR"].indexOf(a.status)<0) return recusa("Escolha aprovar, recusar ou segurar."); if(x1.status!=="SOLICITADO") return recusa("Essa solicitação já foi decidida: só dá para decidir uma vez.");
      var m10 = mat(x1.materialId); x1.status = a.status; if(a.observacao!==undefined && trim(a.observacao)) x1.observacao = trim(a.observacao); x1.decididoPor = por; x1.decididoEm = agora; if(m10) m10.situacao = SITUACAO_APOS_DECISAO[a.status];
      return ok("Solicitação "+ROTULO_SOL[a.status].toLowerCase()+".");
    }
    case "sol_set": {   // dados da compra: só com a solicitação APROVADO ou RECEBIDO. Preencher recebimento marca RECEBIDO e (config) dá entrada no estoque
      var x2 = sol(); if(!x2) return recusa("Solicitação não encontrada."); if(x2.status!=="APROVADO" && x2.status!=="RECEBIDO") return recusa("Só dá para preencher os dados da compra depois de aprovada.");
      if(a.quantidade!==undefined && (!ehInt(a.quantidade) || num(a.quantidade)<1)) return recusa("A quantidade precisa ser um inteiro de 1 em diante."); if(x2.entradaId && a.quantidade!==undefined && Math.round(num(a.quantidade))!==x2.quantidade) return recusa("A entrada no estoque já foi feita: estorne o lançamento antes de mudar a quantidade.");
      var dts = {}; var bad = ["dataCompra", "dataPrevisaoChegada", "dataRecebimento", "vencimento"].some(function(k){ if(a[k]===undefined) return false; var d = dataOu(a[k], null); if(d===undefined){ dts.erro = k; return true; } dts[k] = d||null; return false; }); if(bad) return recusa("Data inválida ("+dts.erro+").");
      if(a.valor!==undefined && !vazio(a.valor) && num(a.valor)<0) return recusa("O valor não pode ser negativo."); if(a.formaPagamento && FORMAS_PAGAMENTO.indexOf(a.formaPagamento)<0) return recusa("Forma de pagamento desconhecida."); if(a.fornecedorId && !porId(ce.fornecedores, a.fornecedorId)) return recusa("Fornecedor não encontrado.");
      var recebendo = dts.dataRecebimento!==undefined && dts.dataRecebimento!==null, m11 = mat(x2.materialId), aviso2 = "";
      if(dts.dataRecebimento===null && x2.entradaId) return recusa("A entrada no estoque já foi feita: estorne o lançamento antes de limpar o recebimento.");
      if(a.quantidade!==undefined) x2.quantidade = Math.round(num(a.quantidade)); ["dataCompra", "dataPrevisaoChegada", "vencimento"].forEach(function(k){ if(dts[k]!==undefined) x2[k] = dts[k]; });
      if(a.valor!==undefined) x2.valor = vazio(a.valor) ? null : r2(num(a.valor)); if(a.formaPagamento!==undefined) x2.formaPagamento = a.formaPagamento||null; if(a.fornecedorId!==undefined) x2.fornecedorId = a.fornecedorId||null; if(a.pago!==undefined) x2.pago = !!a.pago;
      if(dts.dataRecebimento===null){ x2.dataRecebimento = null; if(x2.status==="RECEBIDO") x2.status = "APROVADO"; }
      if(recebendo){
        x2.dataRecebimento = dts.dataRecebimento; x2.status = "RECEBIDO"; if(m11) m11.situacao = "NAO_PRECISA_COMPRAR";
        if(m11 && cfg.entradaAoReceber && !x2.entradaId){ var en2 = entradaDeRecebimento(ce, m11, x2.quantidade, dts.dataRecebimento, por, agora, {solicitacaoId:x2.id}, x2.valor!=null ? x2.valor/x2.quantidade : null); if(en2.erro) return recusa(en2.erro); x2.entradaId = en2.mov.id; aviso2 = " Entraram "+x2.quantidade+" no estoque de "+m11.material+"."; }
      }
      return ok(recebendo ? "Recebimento registrado."+aviso2 : "Dados da compra salvos.");
    }
    default: return recusa("Ação desconhecida.");
  }
}

export { ceDemo, ceMigrar, ceReduz, hojeSP, agoraSP, somaDias, diasEntre,
  CONFIG_PADRAO, STATUS_PEDIDO, ROTULO_STATUS, TOM_STATUS, FUNIL_STATUS, HISTORICO_STATUS, PAGAVEL_STATUS, ETIQUETA_ELEGIVEL, ETIQUETAS, ROTULO_ETIQUETA, UNIDADES, ROTULO_UNIDADE, URGENCIAS, ROTULO_URGENCIA, TIPOS_ENTREGA, ROTULO_ENTREGA,
  FORMAS_PAGAMENTO, ROTULO_FORMA, FORMAS_PLANO, ROTULO_FORMA_PLANO, MOTIVOS_ORCAMENTO, ROTULO_MOTIVO_ORC, PAPEIS_COMPRAS, ROTULO_PAPEL, CAPS_COMPRAS, TRANSICOES,
  SITUACOES, ROTULO_SITUACAO, STATUS_SOLICITACAO, ROTULO_SOL, STATUS_MATERIAL, ROTULO_STATUS_MAT, TIPOS_MOV, ROTULO_MOV, CAPS_ESTOQUE, ROTULO_CAP_ESTOQUE,
  formatarReais, formatarDia, formatarDataHora, formatarHoras,
  papelCompras, podeCompras, veFunilCompleto, podeAprovarCompra, podeEfetuarCompra, podeEditarPlano, capacidadesEstoque, podeEstoque,
  rotuloConta, rotuloCnpj, opcoesCnpj, contasDoCnpj, orcamentosExigidos, textoOrcamentos, entraNoEstoque, planoSituacao, totalDaCompra, compraParaPedidoPagamentos, compraParaOrientacoes,
  pedidoAtrasado, acoesDoPedido, podeAcaoPedido, pedidoVista, listarPedidos, pedidoDe, indicadoresPedidos, dashboardCompras, pagamentosAPagar,
  saldoMaterial, statusMaterial, materialVisto, alertasDoTipo, agruparPorStatus, resumoAba, dashboardGeral, consumoDoMes, movimentosDe, historicoMaterial, listarSolicitacoes, proximaContagem, listaParaComprar };
