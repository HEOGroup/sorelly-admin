// Sorelly Admin · scripts/conferir-padrao.mjs
// Confere o padrão visual (scripts/padrao-regras.mjs) no que MUDOU, antes de subir para o Git. Roda em:
//   npm run padrao            → compara com a master (merge-base com origin/master; sem ela, com o commit anterior), inclui o que ainda não foi commitado
//   npm run padrao -- --base <ref>  → compara com outro ponto (o CI passa o commit base do PR ou do push)
//   npm run padrao:relatorio  → NÃO reprova: lista todas as telas antigas fora do padrão, da pior para a melhor (para o Marcus escolher o que corrigir)
//   npm run padrao -- --tudo  → confere TODAS as telas (reprova; é o alvo final, hoje ainda falha)
// Sai com 1 quando acha erro (o CI fica vermelho).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { DOC, PECAS_TABELA, TELAS_TRAVADAS, conferirLinhas, conferirPecaTabela, conferirTelaTravada, contarExcecoes, ehTela } from "./padrao-regras.mjs";

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
  // 25/11/2026: arquivo que o Git ainda lista mas já foi apagado da pasta derrubava o relatório inteiro (ENOENT). Agora ele só fica de fora.
  arquivos = git(["ls-files", "src"]).split("\n").filter(ehTela).filter(function(f){ try{ porArquivo[f] = {linhas:readFileSync(f, "utf8").split("\n"), novo:false}; return true; }catch(x){ return false; } });
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
    var antes = ""; if(!novos[f]){ try{ antes = execFileSync("git", ["show", b + ":" + f], {encoding:"utf8", maxBuffer:64*1024*1024, stdio:["ignore", "pipe", "ignore"]}); }catch(x){ antes = ""; } }   // o arquivo na base: import antigo de peça antiga não reprova de novo
    var inteiro = ""; try{ inteiro = readFileSync(f, "utf8"); }catch(x){ inteiro = ""; }   // o arquivo de agora, inteiro: a regra da caixa alta compara com o de antes
    porArquivo[f] = {linhas:linhas, novo:!!novos[f], antes:antes, inteiro:inteiro};
  });
  arquivos = Object.keys(porArquivo);
}

var total = 0, resultado = [];
// 2g: as peças que guardam o padrão (tabela, planilha compacta, bloco) são conferidas SEMPRE, mesmo que ninguém tenha mexido nelas
PECAS_TABELA.forEach(function(x){
  var erros = []; try{ erros = conferirPecaTabela(x[0], readFileSync(x[0], "utf8")); }catch(e){ erros = ["peça de tabela " + x[0] + " não encontrada"]; }
  if(erros.length){ total += erros.length; resultado.push({f:x[0], erros:erros}); }
});
// 2m: telas travadas (Visão geral das compras): conferidas SEMPRE, no arquivo inteiro
TELAS_TRAVADAS.forEach(function(f){
  var erros = []; try{ erros = conferirTelaTravada(f, readFileSync(f, "utf8")); }catch(e){ erros = ["tela travada " + f + " não encontrada"]; }
  if(erros.length){ total += erros.length; resultado.push({f:f, erros:erros}); }
});
arquivos.forEach(function(f){
  var info = porArquivo[f];
  var erros = conferirLinhas(f, info.linhas, {arquivoNovo:info.novo, conteudo:info.linhas.join("\n"), antes:info.antes, inteiro:info.inteiro});
  if(erros.length){ total += erros.length; resultado.push({f:f, erros:erros}); }
});
// EXCEÇÕES (padrao-ok), 25/11/2026: a linha com padrao-ok escapa de TODAS as regras. O conferidor não reprova, mas passa a mostrar quantas existem no que foi conferido, para a exceção não crescer escondida.
var exc = {total:0, semMotivo:0, arquivos:[]};
arquivos.forEach(function(f){ var c = contarExcecoes(porArquivo[f].linhas); if(c.total){ exc.total += c.total; exc.semMotivo += c.semMotivo; exc.arquivos.push([c.total, f]); } });
var avisoExc = function(){
  if(!exc.total) return;
  console.log("\nExceções (padrao-ok) " + (tudo ? "no sistema" : "nas linhas novas ou mexidas") + ": " + exc.total + " linha(s) em " + exc.arquivos.length + " arquivo(s)" + (exc.semMotivo ? "; " + exc.semMotivo + " sem motivo escrito (o certo é `padrao-ok: motivo e data`)" : "") + ". Cada uma precisa do Marcus de acordo.");
  exc.arquivos.sort(function(a, b){ return b[0] - a[0]; }).slice(0, tudo ? 15 : 40).forEach(function(x){ console.log(String(x[0]).padStart(5) + "  " + x[1]); });
};

if(relatorio){
  resultado.sort(function(a, b){ return b.erros.length - a.erros.length; });
  console.log("RELATÓRIO DO PADRÃO VISUAL (" + DOC + "): " + resultado.length + " de " + arquivos.length + " arquivos fora do padrão, " + total + " linhas.\n");
  resultado.forEach(function(r){ console.log(String(r.erros.length).padStart(5) + "  " + r.f); });
  var porRegra = {};
  resultado.forEach(function(r){ r.erros.forEach(function(e){ var k = e.split(":")[0].replace(/\d+(\.\d+)? px/, "N px"); porRegra[k] = (porRegra[k] || 0) + 1; }); });
  console.log("\nPor regra:");
  Object.keys(porRegra).sort(function(a, b){ return porRegra[b] - porRegra[a]; }).forEach(function(k){ console.log(String(porRegra[k]).padStart(5) + "  " + k); });
  avisoExc();
  process.exit(0);
}

if(!total){ console.log("PADRÃO OK: " + arquivos.length + " arquivo(s) de tela conferido(s), nada fora do padrão."); avisoExc(); process.exit(0); }
console.error("FORA DO PADRÃO (" + DOC + "): " + total + " linha(s) em " + resultado.length + " arquivo(s). Corrija antes de subir (exceção só com `padrao-ok` na linha e o Marcus de acordo).\n");
resultado.forEach(function(r){ console.error(r.f); r.erros.slice(0, 15).forEach(function(e){ console.error("  - " + e); }); if(r.erros.length > 15) console.error("  - … e mais " + (r.erros.length - 15)); console.error(""); });
avisoExc();
process.exit(1);
