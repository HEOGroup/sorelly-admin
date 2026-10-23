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
export let DADOS = [];

const ARQUIVO = import.meta.env.BASE_URL + "dados/kits-novos-curitiba.json";

let promessa = null;

export function carregarDados() {
  if (!promessa) {
    promessa = fetch(ARQUIVO)
      .then(function (r) {
        if (!r.ok) throw new Error("Falha ao carregar " + ARQUIVO + " (" + r.status + ")");
        return r.json();
      })
      .then(function (lista) {
        DADOS = lista;
        return lista;
      });
  }
  return promessa;
}
