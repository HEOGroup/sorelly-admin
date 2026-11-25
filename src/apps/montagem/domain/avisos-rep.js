// Sorelly Admin · montagem — domain/avisos-rep.js
// AVISOS OBRIGATÓRIOS DO APP DA REPRESENTANTE (Marcus, 24/11/2026: "elas não leem"). Aparecem no meio da tela ANTES de abrir o app, um por um, UMA VEZ SÓ por aviso:
// a representante lê, marca "Li e entendi" e toca em OK. Só libera depois de 5 segundos. Fica gravado quem leu e quando (módulo avrep, rota /api/representante/avisos).
// Para um aviso novo: acrescente no fim da lista com um id NOVO (o id nunca se repete) e o texto em itens. **negrito** vira negrito.
var AVISOS = [
  {id:"marcus-abertura-2026-11-24", titulo:"Um recado do Marcus", itens:[
    "Queridas representantes, como algumas não me respondem, eu fiz um **alerta**.",
    "**Tudo o que for importante vai aparecer aqui, no app de vocês.** Vocês confirmam desta forma, como estão fazendo agora.",
    "O aviso fica **travado por alguns segundos**, para a leitura ser **obrigatória**.",
    "Um abraço do Marcus 🙂"]},
  {id:"atraso-2026-11-24", titulo:"Atraso do acerto", itens:[
    "A revendedora tem **5 dias úteis** para fazer o acerto, contando do **primeiro dia marcado**. (Dia útil = segunda a sexta, sem feriado.)",
    "**Até o 5º dia útil:** sem desconto.",
    "**Do 6º ao 30º dia útil:** perde **1% de comissão** e **1% de brinde** por dia.",
    "**Depois do 30º dia útil:** sem comissão, sem brinde, vai para o **Jurídico** e sem kit novo.",
    "**Mudar a data ou cancelar NÃO zera a contagem.** Ela sempre conta do primeiro dia marcado."]},
  {id:"data-2026-11-24", titulo:"Mudar a data do acerto", itens:[
    "**Com 10 dias ou mais de antecedência:** sem multa.",
    "**Em cima da hora, cancelar, desmarcar ou a revendedora não vir:** tem multa. **1ª vez:** −5% de comissão e −15% de brinde. **2ª vez:** −8% e −50%. **3ª vez em diante:** −15% e sem brinde.",
    "As multas **somam** com o atraso. A comissão nunca fica abaixo de zero.",
    "**O motivo é obrigatório** em toda mudança. Perdoar multa só com motivo sério, prova e autorização do Marcus."]}
];
var ESPERA_SEGUNDOS = 5;   // o botão fica escuro e travado até passar esse tempo
var AVISOS_LIGADOS = false;   // DESLIGADO por enquanto (Marcus, 25/11/2026): o aviso não aparece no app da representante nem na prévia. Para ligar de novo, troque para true.
export { AVISOS, ESPERA_SEGUNDOS, AVISOS_LIGADOS };
