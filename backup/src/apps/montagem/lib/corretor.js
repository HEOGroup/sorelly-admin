// Sorelly Admin — lib/corretor.js
// Corretor automático das mensagens do chat: troca abreviações de internet ("vc", "hj", "tbm") e palavras sem acento ("nao", "voce", "ja") pela forma certa.
// Corrige a palavra quando a pessoa digita o espaço ou a pontuação, e o texto inteiro na hora de enviar. Ignora @menções, links, números e códigos.
var MAPA = {
  vc:"você", vcs:"vocês", voce:"você", voces:"vocês", hj:"hoje", tb:"também", tbm:"também", tambem:"também", pq:"porque", q:"que", ta:"tá", to:"tô", n:"não", nao:"não", nn:"não",
  obg:"obrigado", obgd:"obrigado", blz:"beleza", vlw:"valeu", msg:"mensagem", msgs:"mensagens", mt:"muito", mto:"muito", mta:"muita", mtos:"muitos", vdd:"verdade", td:"tudo", tds:"todos",
  ja:"já", ate:"até", la:"lá", ai:"aí", entao:"então", porem:"porém", so:"só", ola:"olá", cade:"cadê", kd:"cadê", dps:"depois", hrs:"horas", agr:"agora", ctz:"certeza", cmg:"comigo",
  qdo:"quando", qd:"quando", qto:"quanto", qtos:"quantos", pfv:"por favor", pf:"por favor", eh:"é", ne:"né", amanha:"amanhã", preco:"preço", codigo:"código", numero:"número",
  sera:"será", alem:"além", apos:"após", tres:"três", facil:"fácil", dificil:"difícil", util:"útil", possivel:"possível", horario:"horário", inicio:"início", servico:"serviço",
  negocio:"negócio", mae:"mãe", irmao:"irmão", avaliacao:"avaliação", informacao:"informação", comissao:"comissão", reposicao:"reposição", atencao:"atenção", opcao:"opção",
  devolucao:"devolução", producao:"produção", peca:"peça", pecas:"peças", sabado:"sábado", terca:"terça", ultimo:"último", proximo:"próximo", pagina:"página", ate:"até",
  voces:"vocês", tambem:"também", ninguem:"ninguém", alguem:"alguém", ontem:"ontem", orcamento:"orçamento", credito:"crédito", debito:"débito", endereco:"endereço", duvida:"dúvida"
};
var PONTUACAO = /[ .,;:!?\n]/;

function ajustaCaixa(orig, novo){
  if(orig.length>1 && orig===orig.toUpperCase()) return novo.toUpperCase();
  if(orig[0]!==orig[0].toLowerCase()) return novo[0].toUpperCase()+novo.slice(1);
  return novo;
}
function corrigirPalavra(w){
  if(!w || /[@\/:#\d_.]/.test(w) || /^https?/i.test(w)) return w;
  var novo = MAPA[w.toLowerCase()];
  return novo ? ajustaCaixa(w, novo) : w;
}
// o texto inteiro (na hora de enviar): corrige cada palavra e põe a primeira letra maiúscula
function corrigirTexto(t){
  var c = String(t||"").replace(/[^\s]+/g, function(tok){
    var m = /^([^A-Za-zÀ-ÿ@#]*)([A-Za-zÀ-ÿ]+)([^A-Za-zÀ-ÿ]*)$/.exec(tok); if(!m) return tok;
    return m[1]+corrigirPalavra(m[2])+m[3]; });
  return c.replace(/^(\s*)([a-zà-ÿ])/, function(_, a, b){ return a+b.toUpperCase(); });
}
// durante a digitação: acabou de digitar um espaço ou pontuação no fim do texto? corrige a palavra que ficou para trás
function corrigirUltima(v){
  if(!v || !PONTUACAO.test(v[v.length-1])) return v;
  var i = v.length-1; while(i>0 && PONTUACAO.test(v[i-1])) i--;   // sequência de pontuação/espaços do fim
  var fim = i, ini = fim; while(ini>0 && !/\s/.test(v[ini-1])) ini--;
  var tok = v.slice(ini, fim), m = /^([^A-Za-zÀ-ÿ@#]*)([A-Za-zÀ-ÿ]+)$/.exec(tok); if(!m) return v;
  var certa = corrigirPalavra(m[2]); if(certa===m[2]) return v;
  var antesDaPalavra = v.slice(0, ini)+m[1];
  // primeira palavra da frase ganha maiúscula ("tá" no começo vira "Tá")
  if(!/[A-Za-zÀ-ÿ0-9]/.test(antesDaPalavra) || /[.!?]\s*$/.test(antesDaPalavra)) certa = certa[0].toUpperCase()+certa.slice(1);
  return antesDaPalavra+certa+v.slice(fim);
}
export { corrigirTexto, corrigirUltima };
