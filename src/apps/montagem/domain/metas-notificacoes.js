// Sorelly Admin · montagem — domain/metas-notificacoes.js
// Textos das notificações do app da revendedora sobre a Meta (Marcus, 03/11/2026; protótipo aprovado em docs/ideias/metas-notificacoes-app.html).
// Regras de tamanho: título até 30 letras e texto até 90 (cabe inteiro na tela bloqueada do iPhone e no banner). Mínimo 3 por dia; silêncio das 21h às 08h; nunca 2 sobre a meta seguidas.
// Só leitura: o envio do push é do backend do app (Leonardo). Espaços: {nome} {alvo} {falta} {falta2} {vend} {pct} {bb} {no} {dias}.
var LIMITE_TITULO = 30, LIMITE_TEXTO = 90, LIMITE_CORTE = 140;

// [situação, técnica de copy, título, texto]
var TEXTOS = [
  ["Apresentar a meta", "Ganho concreto + convite", "Sua Minha Meta chegou 🎯", "{nome}, venda {alvo} neste acerto e ganhe brinde extra. Toque e veja."],
  ["Apresentar a meta", "Pergunta de sim", "{nome}, quer um brinde extra?", "Venda {alvo} até o acerto e ele é seu. Veja quanto falta."],
  ["Apresentar a meta", "Pressuposição positiva", "Seu brinde extra te espera", "Quando você chegar em {alvo}, BB e Normal extras são seus. Veja o caminho."],
  ["Explicar a meta", "Passo único e curto", "Entenda sua meta rapidinho", "Toque em Minha Meta: veja quanto falta e o brinde que você ganha."],
  ["Primeiro impulso", "Reforço do que já fez", "Bom começo, {nome}! 💛", "Você já vendeu {vend}. Faltam {falta} para o brinde extra."],
  ["Metade do caminho", "Prova de progresso", "Metade do caminho! 🚀", "{pct}% da meta feita. Faltam {falta} para o brinde extra."],
  ["Falta pouco", "Número específico", "Falta pouco, {nome}! 🔥", "Só {falta} para o brinde extra. Uma boa venda e você chega lá."],
  ["Falta pouco", "Imagem mental", "Seu brinde está a uma venda", "Faltam {falta}. Mostre o catálogo hoje e feche!"],
  ["Falta pouco", "Ganho detalhado", "{nome}, quase lá!", "Faltam {falta} para liberar BB {bb} + Normal {no} de brinde extra."],
  ["Falta pouco", "Escolha entre duas", "Hoje é um bom dia para fechar", "{nome}, faltam {falta}. Link de pagamento ou catálogo? Você escolhe."],
  ["Reta final", "Prazo real", "Seu acerto é em {dias} dias ⏳", "Faltam {falta} para o brinde extra. Ainda dá tempo, {nome}!"],
  ["Reta final", "Urgência honesta", "Último dia para vender hoje", "{nome}, faltam {falta}. Feche hoje e leve o brinde extra."],
  ["Bateu a Meta 1", "Celebração + próximo degrau", "Meta 1 batida! 🎉", "Brinde extra garantido, {nome}! A Meta 2 está a só {falta2}."],
  ["Bateu a Meta 1", "Reconhecimento", "Parabéns, {nome}! 💎", "Você garantiu o brinde extra. Quer mais? Veja a Meta 2 no app."],
  ["Bateu a Meta 2", "Celebração máxima", "Meta 2 conquistada! 🏆", "Você ganhou o maior brinde extra. Parabéns, {nome}!"],
  ["Depois do acerto", "Recomeço sem culpa", "Na próxima você chega lá 💛", "Você vendeu {vend}. Sua nova meta já está em Minha Meta."],
  ["Dica de venda", "Ação única", "Seu catálogo é sua vitrine ✨", "Compartilhe o link hoje e mostre suas peças favoritas."],
  ["Dica de venda", "Facilidade", "Fechar venda ficou fácil 💳", "Envie o link de pagamento pelo app e receba na hora."]
];

var PROGRAMA = [
  {h:"09:30", t:"Sobre a meta (personalizada)"},
  {h:"14:00", t:"Dica de venda (catálogo, link de pagamento, garantia)"},
  {h:"18:30", t:"Sobre a meta (quem está perto) ou novidade"}
];

var reais = function(v){ return "R$ " + Number(v).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); };

// r = item de metas (src/server/metas.js). Venda = o que já foi lançado no acerto (DevMaster); o tempo real do app entra quando o backend tiver a rota.
function dadosDe(r, hoje){
  var vend = r.vendeu || 0, bateu2 = vend >= r.m2, bateu1 = vend >= r.m1, alvo = bateu1 ? r.m2 : r.m1;
  var dias = r.prev && r.prev.length >= 10 ? Math.max(0, Math.round((Date.parse(r.prev.slice(0, 10)) - Date.parse(hoje)) / 86400000)) : null;
  return {vend:vend, alvo:alvo, bateu1:bateu1, bateu2:bateu2, pct:Math.min(100, Math.round(vend / alvo * 100)), falta:Math.max(0, alvo - vend), falta2:Math.max(0, r.m2 - vend),
    dias:dias, bb:bateu1 ? r.br2Bb : r.br1Bb, no:bateu1 ? r.br2No : r.br1No};
}
// situação e texto sugerido (índice de TEXTOS)
function situacaoNotif(r, d){
  if(r.acertoEm) return {sit:"Depois do acerto", sug:15};
  if(d.bateu2) return {sit:"Bateu Meta 2", sug:13};
  if(d.bateu1) return {sit:"Bateu Meta 1", sug:12};
  if(d.dias !== null && d.dias <= 3 && d.vend > 0) return {sit:"Reta final", sug:d.dias <= 1 ? 11 : 10};
  if(d.pct >= 80) return {sit:"Falta pouco", sug:6};
  if(d.pct >= 50) return {sit:"Metade do caminho", sug:5};
  if(d.vend > 0) return {sit:"Primeiro impulso", sug:4};
  return {sit:"Apresentar a meta", sug:0};
}
function preenche(t, r, d){
  var nome = String(r.nome || "").trim().split(/\s+/)[0] || "";
  return t.replace(/\{nome\}/g, nome).replace(/\{alvo\}/g, reais(d.alvo)).replace(/\{falta2\}/g, reais(d.falta2)).replace(/\{falta\}/g, reais(d.falta)).replace(/\{vend\}/g, reais(d.vend))
    .replace(/\{pct\}/g, d.pct).replace(/\{bb\}/g, reais(d.bb)).replace(/\{no\}/g, reais(d.no)).replace(/\{dias\}/g, d.dias === null ? "poucos" : d.dias);
}
function medidor(t, b){
  var av = b.length > LIMITE_CORTE ? "Passa de 4 linhas: corta na tela bloqueada." : b.length > LIMITE_TEXTO ? "Cabe na tela bloqueada, mas o banner corta o final." : t.length > LIMITE_TITULO ? "Título longo: pode ser cortado." : "Cabe inteiro na tela bloqueada e no banner.";
  return {aviso:av, cor:(b.length > LIMITE_CORTE || t.length > LIMITE_TITULO) ? "ruim" : b.length > LIMITE_TEXTO ? "alerta" : "ok"};
}
export { TEXTOS, PROGRAMA, LIMITE_TITULO, LIMITE_TEXTO, LIMITE_CORTE, reais, dadosDe, situacaoNotif, preenche, medidor };
