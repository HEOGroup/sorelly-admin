// Sorelly Admin · kits novos Curitiba — data/dados.js
//
// No HTML original os ~2.000 registros da planilha eram uma linha de 1 MB
// dentro da própria página: o navegador baixava e interpretava tudo antes de
// desenhar qualquer coisa. Aqui viraram um .json servido à parte, buscado só
// quando alguém abre este app (ver o loader em router/rotas.js) e cacheado
// pelo navegador como arquivo estático.
//
// `DADOS` é um live binding do ES module: quem importa enxerga o array já
// preenchido depois que carregarDados() resolve.
import { apiAtiva, chamar, token } from "@/apps/montagem/lib/api";

export let DADOS = [];
export let FONTE = "";   // "planilha-AAAA-MM-DD" quando os dados vêm do servidor

const ARQUIVO = "/" + "dados/kits-novos-curitiba.json";

let promessa = null;

// Os kits novos reais (planilha da Michele, importada em 03/11/2026) ficam no servidor (módulo kndados), nunca no Git. Sem servidor ou sem acesso: lista vazia (não há mais nomes de exemplo).
export function carregarDados() {
  if (!promessa) {
    promessa = (async function () {
      try {
        if (apiAtiva() && token()) {
          var r = await chamar("GET", "/estado/kndados");
          var c = r && r.conteudo ? r.conteudo : {}, lista = Object.keys(c).filter(function (k) { return k.indexOf("r_") === 0; }).map(function (k) { return c[k]; });
          if (lista.length) { DADOS = lista; FONTE = "planilha-" + String((c.meta && c.meta.versao) || ""); return lista; }
        }
      } catch (x) { /* sem acesso: segue com a lista vazia */ }
      DADOS = []; FONTE = ""; return DADOS;
    })();
  }
  return promessa;
}
