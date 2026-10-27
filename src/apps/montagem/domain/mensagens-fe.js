// Sorelly Admin · montagem — domain/mensagens-fe.js
// Mensagens de fé da página inicial (pedido do Marcus, 27/10/2026): 50 versículos sobre força, fé e progresso, muitos ditos pelo próprio Jesus.
// A mensagem muda a cada 2 HORAS e é a mesma para todo mundo no mesmo horário. Textos na linha da tradução Almeida: conferir as palavras antes de divulgar.
// Cada item: [texto, referência, tema]. tema = "força" | "fé" | "progresso" | "Jesus".
var MENSAGENS = [
  ["Posso todas as coisas em Cristo que me fortalece.", "Filipenses 4:13", "força"],
  ["Não to mandei eu? Esforça-te, e tem bom ânimo; não pasmes, nem te espantes, porque o Senhor teu Deus é contigo, por onde quer que andares.", "Josué 1:9", "força"],
  ["Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento.", "Isaías 41:10", "força"],
  ["O Senhor é o meu pastor, nada me faltará.", "Salmos 23:1", "fé"],
  ["Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.", "Provérbios 3:5-6", "fé"],
  ["Porque eu bem sei os pensamentos que penso de vós, diz o Senhor; pensamentos de paz, e não de mal, para vos dar o fim que esperais.", "Jeremias 29:11", "progresso"],
  ["Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", "Mateus 11:28", "Jesus"],
  ["Deixo-vos a paz, a minha paz vos dou; não vo-la dou como o mundo a dá. Não se turbe o vosso coração, nem se atemorize.", "João 14:27", "Jesus"],
  ["No mundo tereis aflições, mas tende bom ânimo, eu venci o mundo.", "João 16:33", "Jesus"],
  ["Buscai primeiro o reino de Deus, e a sua justiça, e todas essas coisas vos serão acrescentadas.", "Mateus 6:33", "Jesus"],
  ["Pedi, e dar-se-vos-á; buscai, e encontrareis; batei, e abrir-se-vos-á.", "Mateus 7:7", "Jesus"],
  ["Se tu podes crer, tudo é possível ao que crê.", "Marcos 9:23", "Jesus"],
  ["Se tiverdes fé como um grão de mostarda, nada vos será impossível.", "Mateus 17:20", "Jesus"],
  ["Tudo o que pedirdes, orando, crede que o recebereis, e tê-lo-eis.", "Marcos 11:24", "Jesus"],
  ["O Senhor é a minha luz e a minha salvação; a quem temerei? O Senhor é a força da minha vida; de quem me recearei?", "Salmos 27:1", "força"],
  ["Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.", "Salmos 46:1", "força"],
  ["Entrega o teu caminho ao Senhor; confia nele, e ele o fará.", "Salmos 37:5", "fé"],
  ["Elevo os meus olhos para os montes, de onde vem o meu socorro. O meu socorro vem do Senhor, que fez os céus e a terra.", "Salmos 121:1-2", "fé"],
  ["Os que esperam no Senhor renovarão as forças, subirão com asas como águias; correrão, e não se cansarão; caminharão, e não se fatigarão.", "Isaías 40:31", "força"],
  ["Quando passares pelas águas, estarei contigo.", "Isaías 43:2", "força"],
  ["Esforçai-vos e tende bom ânimo; não temais, porque o Senhor teu Deus é quem vai contigo; não te deixará, nem te desamparará.", "Deuteronômio 31:6", "força"],
  ["Sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus.", "Romanos 8:28", "fé"],
  ["Se Deus é por nós, quem será contra nós?", "Romanos 8:31", "força"],
  ["Alegres na esperança, fortes na tribulação, perseverantes na oração.", "Romanos 12:12", "força"],
  ["Deus não nos deu o espírito de temor, mas de fortaleza, e de amor, e de moderação.", "2 Timóteo 1:7", "força"],
  ["Não nos cansemos de fazer o bem, porque a seu tempo ceifaremos, se não desfalecermos.", "Gálatas 6:9", "progresso"],
  ["Tudo quanto fizerdes, fazei-o de todo o coração, como ao Senhor, e não aos homens.", "Colossenses 3:23", "progresso"],
  ["Confia ao Senhor as tuas obras, e os teus pensamentos serão estabelecidos.", "Provérbios 16:3", "progresso"],
  ["A mão dos diligentes enriquece.", "Provérbios 10:4", "progresso"],
  ["Os pensamentos do diligente tendem só para a abundância.", "Provérbios 21:5", "progresso"],
  ["Sobre tudo o que se deve guardar, guarda o teu coração, porque dele procedem as saídas da vida.", "Provérbios 4:23", "fé"],
  ["Tudo tem o seu tempo determinado, e há tempo para todo o propósito debaixo do céu.", "Eclesiastes 3:1", "progresso"],
  ["Confirma sobre nós a obra das nossas mãos; sim, confirma a obra das nossas mãos.", "Salmos 90:17", "progresso"],
  ["Este é o dia que fez o Senhor; regozijemo-nos e alegremo-nos nele.", "Salmos 118:24", "fé"],
  ["As misericórdias do Senhor não têm fim; novas são cada manhã; grande é a tua fidelidade.", "Lamentações 3:22-23", "fé"],
  ["Vós sois a luz do mundo.", "Mateus 5:14", "Jesus"],
  ["Eis que eu estou convosco todos os dias, até à consumação dos séculos.", "Mateus 28:20", "Jesus"],
  ["Eu sou a videira, vós as varas; quem está em mim, e eu nele, esse dá muito fruto.", "João 15:5", "Jesus"],
  ["Eu sou a luz do mundo; quem me segue não andará em trevas, mas terá a luz da vida.", "João 8:12", "Jesus"],
  ["Eu vim para que tenham vida, e a tenham em abundância.", "João 10:10", "Jesus"],
  ["Para Deus nada é impossível.", "Lucas 1:37", "fé"],
  ["O que é impossível aos homens é possível a Deus.", "Lucas 18:27", "Jesus"],
  ["Aos homens é isto impossível, mas a Deus tudo é possível.", "Mateus 19:26", "Jesus"],
  ["Não vos inquieteis pelo dia de amanhã, porque o dia de amanhã cuidará de si mesmo.", "Mateus 6:34", "Jesus"],
  ["Bem está, servo bom e fiel; sobre o pouco foste fiel, sobre muito te colocarei.", "Mateus 25:21", "Jesus"],
  ["Dai, e ser-vos-á dado; boa medida, recalcada, sacudida e transbordando.", "Lucas 6:38", "Jesus"],
  ["A fé é o firme fundamento das coisas que se esperam, e a prova das coisas que se não veem.", "Hebreus 11:1", "fé"],
  ["Estai firmes e constantes, sempre abundantes na obra do Senhor, sabendo que o vosso trabalho não é vão no Senhor.", "1 Coríntios 15:58", "progresso"],
  ["A minha graça te basta, porque o meu poder se aperfeiçoa na fraqueza.", "2 Coríntios 12:9", "força"],
  ["Fortalecei-vos no Senhor e na força do seu poder.", "Efésios 6:10", "força"],
];

var DUAS_HORAS = 2 * 60 * 60 * 1000;
// índice da vez: conta blocos de 2 horas no horário local (vira nas horas pares: 00h, 02h, 04h...) e dá a volta nas 50 mensagens
function indiceDaVez(agora){
  var t = (agora || Date.now()) - new Date(agora || Date.now()).getTimezoneOffset() * 60000;
  return Math.floor(t / DUAS_HORAS) % MENSAGENS.length;
}
function mensagemDaVez(agora){ var i = indiceDaVez(agora); return {i:i, texto:MENSAGENS[i][0], ref:MENSAGENS[i][1], tema:MENSAGENS[i][2]}; }
// quanto falta para trocar (em ms), para a tela se atualizar sozinha na hora certa
function msAteTrocar(agora){
  var n = agora || Date.now(), t = n - new Date(n).getTimezoneOffset() * 60000;
  return DUAS_HORAS - (t % DUAS_HORAS);
}

export { MENSAGENS, indiceDaVez, mensagemDaVez, msAteTrocar };
