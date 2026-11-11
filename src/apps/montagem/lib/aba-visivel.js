// Sorelly Admin · montagem — lib/aba-visivel.js (11/11/2026)
// Aba escondida (outra aba do navegador, janela minimizada, tela do celular apagada) não precisa buscar nada no servidor.
// Cada busca é uma chamada cobrada pela Vercel; abas esquecidas abertas o dia todo eram a maior parte do custo.
// Uso: dentro do relógio (setInterval), `if(!abaVisivel()) return;`. Ao voltar para a aba, quem precisa busca na hora (evento visibilitychange).
function abaVisivel(){
  try { return typeof document==="undefined" || document.visibilityState!=="hidden"; } catch(x){ return true; }
}
export { abaVisivel };
