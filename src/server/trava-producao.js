// Trava da PRODUÇÃO no servidor (19/11/2026, pedido do Marcus: "não podem editar, tem que pedir pra mim").
// Por quê: a trava das funcionárias vivia só na tela. Quem deixou uma página ANTIGA aberta (ou com a cópia desatualizada) salvou o dia inteiro por cima e apagou todas as peças de uma produtora externa, duas vezes no mesmo dia.
// Agora o servidor confere cada gravação do módulo "pr" que NÃO vem da Diretoria (eu.perfil !== "ADMIN") e devolve o que ela não podia mexer:
//   1. dia fechado (mais antigo que hoje e o dia útil anterior, sábado e domingo não contam; o dia de amanhã também): fica como estava guardado;
//   2. produção externa (linha de unidade Externa e quem faz só em casa): sempre fica como estava guardada; linha externa nova vinda de funcionária é ignorada;
//   3. funcionária que já tem peças lançadas no dia (dia dela travado): as linhas dela ficam como estavam; linhas de OUTRA funcionária no mesmo dia continuam livres.
// A Diretoria passa direto. Mesma regra de domain/producao.js (diaAbertoFuncionaria, eCasa, travadasDoDia); aqui vale mesmo com a página antiga.
import { diaAbertoFuncionaria, eCasa, hojeSP } from "../apps/montagem/domain/producao.js";

const lista = (v) => (Array.isArray(v) ? v : []);
const nome = (l) => String((l && l.func) || "").trim().toLowerCase();
const comPecas = (l) => Number(l && l.qtd) > 0;

/** Devolve em `novo.lancamentos` tudo que quem não é da Diretoria não podia mudar. Devolve quantos dias foram corrigidos. */
export function protegerProducao(guardado, novo, hoje) {
  if (!novo || typeof novo !== "object") return 0;
  const G = (guardado && guardado.lancamentos && typeof guardado.lancamentos === "object") ? guardado.lancamentos : {};
  if (!novo.lancamentos || typeof novo.lancamentos !== "object" || Array.isArray(novo.lancamentos)) novo.lancamentos = {};
  const N = novo.lancamentos, h = hoje || hojeSP();
  const dias = new Set([...Object.keys(G), ...Object.keys(N)]);
  let corrigidos = 0;
  for (const d of dias) {
    const g = lista(G[d]), n = lista(N[d]);
    let final;
    if (!diaAbertoFuncionaria(d, h)) final = g;
    else {
      const travadas = new Set(g.filter((l) => !eCasa(l) && comPecas(l)).map(nome));
      final = n.filter((l) => !eCasa(l) && !travadas.has(nome(l))).concat(g.filter((l) => eCasa(l) || travadas.has(nome(l))));
    }
    if (JSON.stringify(final) === JSON.stringify(n)) continue;
    // mesma lista em outra ordem não é mudança
    const chave = (l) => [nome(l), l.codigo, l.qtd, l.valor, l.unidade].join("|");
    if (final.length === n.length && final.map(chave).sort().join(";") === n.map(chave).sort().join(";")) continue;
    if (final.length) N[d] = final; else delete N[d];
    corrigidos++;
  }
  return corrigidos;
}
