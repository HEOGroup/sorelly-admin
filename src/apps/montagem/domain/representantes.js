// Sorelly Admin · montagem e bipagem — domain/representantes.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.

var REPS_AVAL = ["Dayanne","Lysie","Jessica","Thalita"];
function avalRepDemo(){
  var revs = ["Ana Paula","Bianca","Cristiane","Daiane","Edna","Fabiana","Gislaine","Helena","Ingrid","Joana","Kelly","Luciane","Marta","Neide"];
  var base = {Dayanne:[5,4,5], Lysie:[4,5,4], Jessica:[3,4,3], Thalita:[4,5,4]}, out = [];
  REPS_AVAL.forEach(function(r, i){ var n = 8 + (i*3)%7, b = base[r];
    for(var j=0;j<n;j++){ var v = function(x, q){ return Math.max(1, Math.min(5, x + ((i+j+q)%5===0 ? -1 : (i+j+q)%7===0 ? 1 : 0))); };
      out.push({rep:r, rev:revs[(i*5+j)%revs.length], data:String(1+(j*3+i)%23).padStart(2,"0")+"/09", pont:v(b[0],0), expl:v(b[1],1), whats:v(b[2],2),
        obs: j===0 && b[0]<4 ? "Atrasou e não avisou" : j===1 && b[2]<4 ? "Demora para responder no WhatsApp" : ""}); } });
  return out;
}
var RECUSAS0 = [{rep:"Jessica", rev:"Gabriela Lemos", data:"05/09", motivo:"Recusou pelo app"},{rep:"Jessica", rev:"Sônia Prates", data:"16/09", motivo:"Disse que não tem horário"},
  {rep:"Thalita", rev:"Marli Teixeira", data:"11/09", motivo:"Recusou pelo app"}];
var VIRADA0 = {Dayanne:{ultimo:30, volta:4}, Lysie:{ultimo:30, volta:2}, Jessica:{ultimo:30, volta:1}, Thalita:{ultimo:29, volta:3}};
function diasParados(v){ return v ? (31 - v.ultimo) + (v.volta - 1) : 0; }
function resumoRep(rep, s){
  var c = s.cfg, av = (s.avalRep||[]).filter(function(a){return a.rep===rep;});
  var m = function(f){ return av.length ? av.reduce(function(t,a){return t+a[f];},0)/av.length : null; };
  var pont = m("pont"), expl = m("expl"), whats = m("whats"), media = av.length ? (pont+expl+whats)/3 : null;
  var rec = (s.recusas||[]).filter(function(x){return x.rep===rep;}).length, vir = (s.virada||{})[rep], parados = diasParados(vir);
  var desc = rec*c.perdaRecusa + Math.max(0, parados - c.diasParadosTolerancia)*c.perdaDiaParado;
  var pontos = media===null ? null : Math.max(0, media - desc);
  return {rep:rep, n:av.length, pont:pont, expl:expl, whats:whats, media:media, rec:rec, vir:vir, parados:parados, desc:desc, pontos:pontos,
    bonus: pontos!==null && pontos>=c.bonusNotaMin, bloqueada: !!(s.bloqueioNovas||{})[rep]};
}
var NOVAS0 = [
  {id:"N1", nome:"Camila Ferreira", cidade:"Curitiba", bairro:"Água Verde", endereco:"Rua José Loureiro, 812 - Água Verde, Curitiba - PR",
    fone:"(41) 99123-4567", valor:8000, expositor:false, profissao:"Manicure", trab:"Studio Camila Beauty", trabEnd:"Rua XV de Novembro, 500 - Centro, Curitiba - PR",
    disp:"Manhãs, de segunda a sexta", rep:"Dayanne", status:"direcionada", cadastro:"29/09"},
  {id:"N2", nome:"Patrícia Nunes", cidade:"Curitiba", bairro:"Batel", endereco:"Rua Brigadeiro Franco, 2200 - Batel, Curitiba - PR",
    fone:"(41) 99876-5432", valor:9000, expositor:true, profissao:"Cabeleireira", trab:"Salão Nunes Hair", trabEnd:"Avenida Sete de Setembro, 3400 - Batel, Curitiba - PR",
    disp:"Tardes, a partir das 14h", rep:"Dayanne", status:"direcionada", cadastro:"29/09"}];

export { REPS_AVAL, avalRepDemo, RECUSAS0, VIRADA0, diasParados, resumoRep, NOVAS0 };
