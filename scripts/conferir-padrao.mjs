// Sorelly Admin · scripts/conferir-padrao.mjs
// Confere o padrão visual (scripts/padrao-regras.mjs) no que MUDOU, antes de subir para o Git. Roda em:
//   npm run padrao            → compara com a master (merge-base com origin/master; sem ela, com o commit anterior), inclui o que ainda não foi commitado
//   npm run padrao -- --base <ref>  → compara com outro ponto (o CI passa o commit base do PR ou do push)
//   npm run padrao:relatorio  → NÃO reprova: lista todas as telas antigas fora do padrão, da pior para a melhor (para o Marcus escolher o que corrigir)
//   npm run padrao -- --tudo  → confere TODAS as telas (reprova; é o alvo final, hoje ainda falha)
// Sai com 1 quando acha erro (o CI fica vermelho).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { DOC, conferirLinhas, ehTela } from "./padrao-regras.mjs";

var args = process.argv.slice(2), relatorio = args.indexOf("--relatorio") >= 0, tudo = args.indexOf("--tudo") >= 0 || relatorio;
var iBase = args.indexOf("--base"), base = iBase >= 0 ? args[iBase + 1] : "";
var git = function(a){ return execFileSync("git", a, {encoding:"utf8", maxBuffer:64*1024*1024}); };

function descobrirBase(){
  if(base){   // base passada (CI): precisa existir; no primeiro push de um branch o GitHub manda 0000000, então cai no merge-base
    try{ execFileSync("git", ["cat-file", "-e", base + "^{commit}"], {stdio:"ignore"}); return base; }catch(x){ console.log("conferir-padrao: base " + base.slice(0, 10) + " não existe; comparando com a master."); }
  }
  try{ return git(["merge-base", "HEAD", "origin/master"]).trim(); }catch(x){}
  try{ return git(["rev-parse", "HEAD~1"]).trim(); }catch(x){}
  return "";
}

var arquivos = [], porArquivo = {};
if(tudo){
  arquivos = git(["ls-files", "src"]).split("\n").filter(ehTela);
  arquivos.forEach(function(f){ porArquivo[f] = {linhas:readFileSync(f, "utf8").split("\n"), novo:false}; });
}else{
  var b = descobrirBase();
  if(!b){ console.log("conferir-padrao: sem base para comparar; nada conferido."); process.exit(0); }
  var mudados = git(["diff", "--name-only", b, "--", "src"]).split("\n").filter(ehTela);
  var novos = {}; try{ git(["diff", "--name-only", "--diff-filter=A", b, "--", "src"]).split("\n").forEach(function(f){ novos[f] = true; }); }catch(x){}
  try{ git(["ls-files", "--others", "--exclude-standard", "src"]).split("\n").filter(ehTela).forEach(function(f){ if(mudados.indexOf(f) < 0) mudados.push(f); novos[f] = true; }); }catch(x){}
  mudados.forEach(function(f){
    var linhas = [];
    try{
      if(novos[f]) linhas = readFileSync(f, "utf8").split("\n");
      else git(["diff", "-U0", b, "--", f]).split("\n").forEach(function(l){ if(l[0]==="+" && l.slice(0, 3)!=="+++") linhas.push(l.slice(1)); });
    }catch(x){ return; }   // arquivo apagado
    porArquivo[f] = {linhas:linhas, novo:!!novos[f]};
  });
  arquivos = Object.keys(porArquivo);
}

var total = 0, resultado = [];
arquivos.forEach(function(f){
  var info = porArquivo[f];
  var erros = conferirLinhas(f, info.linhas, {arquivoNovo:info.novo, conteudo:info.linhas.join("\n")});
  if(erros.length){ total += erros.length; resultado.push({f:f, erros:erros}); }
});

if(relatorio){
  resultado.sort(function(a, b){ return b.erros.length - a.erros.length; });
  console.log("RELATÓRIO DO PADRÃO VISUAL (" + DOC + "): " + resultado.length + " de " + arquivos.length + " arquivos fora do padrão, " + total + " linhas.\n");
  resultado.forEach(function(r){ console.log(String(r.erros.length).padStart(5) + "  " + r.f); });
  var porRegra = {};
  resultado.forEach(function(r){ r.erros.forEach(function(e){ var k = e.split(":")[0].replace(/\d+(\.\d+)? px/, "N px"); porRegra[k] = (porRegra[k] || 0) + 1; }); });
  console.log("\nPor regra:");
  Object.keys(porRegra).sort(function(a, b){ return porRegra[b] - porRegra[a]; }).forEach(function(k){ console.log(String(porRegra[k]).padStart(5) + "  " + k); });
  process.exit(0);
}

if(!total){ console.log("PADRÃO OK: " + arquivos.length + " arquivo(s) de tela conferido(s), nada fora do padrão."); process.exit(0); }
console.error("FORA DO PADRÃO (" + DOC + "): " + total + " linha(s) em " + resultado.length + " arquivo(s). Corrija antes de subir (exceção só com `padrao-ok` na linha e o Marcus de acordo).\n");
resultado.forEach(function(r){ console.error(r.f); r.erros.slice(0, 15).forEach(function(e){ console.error("  - " + e); }); if(r.erros.length > 15) console.error("  - … e mais " + (r.erros.length - 15)); console.error(""); });
process.exit(1);
