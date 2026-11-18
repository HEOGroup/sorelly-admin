"use client";
// Tabela de valores de reposição conforme a média de vendas dos últimos 3 meses (Marcus, 18/11/2026).
// Vem do link da revendedora (limite.tabela e limite.qtdRegra, gravados quando o setor gerou o link). A linha dela fica em destaque.
import { useEffect, useState } from "react";

const reais = (n) => "R$ " + Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const OURO = "bg-gradient-to-br from-[#F5E7BE] via-[#E8B84B] to-[#B8892A]";
const BLOCO = "rounded-xl border border-[#E8B84B]/55 bg-black bg-[linear-gradient(to_top,rgba(232,184,75,.32),rgba(0,0,0,0)_78%)]";

export default function Tabela({ codigo }) {
  const [info, setInfo] = useState(null), [falha, setFalha] = useState(false);
  useEffect(() => {
    let vivo = true;
    fetch("/api/pedido-link/" + encodeURIComponent(codigo)).then((r) => (r.ok ? r.json() : Promise.reject())).then((j) => { if (vivo) setInfo(j); }, () => { if (vivo) setFalha(true); });
    return () => { vivo = false; };
  }, [codigo]);
  const lim = info && info.limite, faixas = lim && Array.isArray(lim.tabela) ? lim.tabela.slice().sort((a, b) => a.de - b.de) : [], q = lim && lim.qtdRegra;
  return (
    <main className="min-h-screen overflow-x-hidden bg-black px-3 pb-8 pt-[max(2.25rem,env(safe-area-inset-top))] text-white">
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-2.5">
        <header className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-sorelly.png" alt="Sorelly Joias" className="mx-auto mb-1 h-16 w-auto" />
          <h1 className="bg-gradient-to-r from-[#F5E7BE] via-[#E8B84B] to-[#F5E7BE] bg-clip-text text-[22px] font-extrabold leading-tight tracking-wide text-transparent">Valores de reposição</h1>
          <div className="mx-auto mt-1 h-px w-24 bg-gradient-to-r from-transparent via-[#E8B84B] to-transparent" aria-hidden />
          <p className="mt-1.5 text-[14px] font-semibold">Conforme a média das suas vendas</p>
        </header>
        {falha && <section className={BLOCO + " p-3 text-[13px]"}>Não consegui abrir. Confira o link ou peça um novo ao setor.</section>}
        {!info && !falha && <section className={BLOCO + " p-3 text-[13px]"}>Um instante.</section>}
        {info && !faixas.length && <section className={BLOCO + " p-3 text-[13px]"}>A tabela ainda não está neste link. Peça um link novo ao setor de Reposições e Encomendas.</section>}
        {faixas.length > 0 && (
          <section className={BLOCO + " overflow-hidden"}>
            <div className="grid grid-cols-2 border-b border-[#E8B84B]/40 bg-black/40 px-3 py-2 text-center text-[12px] font-bold uppercase tracking-wide text-[#F5E7BE]">
              <span>Média de vendas (3 meses)</span><span>Valor máximo por reposição</span>
            </div>
            {faixas.map((f, i) => {
              const prox = faixas[i + 1], seu = lim && Number(lim.max) === Number(f.max);
              return (
                <div key={f.de} className={"grid grid-cols-2 items-center border-b border-white/10 px-3 py-2.5 text-center text-[14px] last:border-b-0 " + (seu ? OURO + " font-bold text-[#14233f]" : "")}>
                  <span>{prox ? reais(f.de) + " a " + reais(prox.de - 0.01) : "A partir de " + reais(f.de)}</span>
                  <span className="font-bold">{reais(f.max)}{seu ? "  ← o seu" : ""}</span>
                </div>
              );
            })}
          </section>
        )}
        {q && (
          <section className={BLOCO + " p-3 text-[13px] leading-snug"}>
            <p className="mb-1 text-[14px] font-bold">Quantas reposições por mês</p>
            <p>Média abaixo de {reais(q.limiteMedia)}: <b>{q.abaixo} {q.abaixo === 1 ? "reposição" : "reposições"}</b>.</p>
            <p>Média de {reais(q.limiteMedia)} ou mais: <b>{q.acima} reposições</b>.</p>
            <p>Top 50: <b>{q.top50} reposições</b>.</p>
          </section>
        )}
        {lim && lim.max > 0 && <p className="text-center text-[13px]">O seu valor máximo: <b className="text-[#F5E7BE]">{reais(lim.max)}</b> por reposição{lim.qtd > 0 ? " · " + lim.qtd + " por mês" : ""}.</p>}
        <a href={"/pedido/" + encodeURIComponent(codigo)} className={"mt-1 flex h-11 items-center justify-center rounded-xl text-[15px] font-bold text-[#14233f] " + OURO}>Voltar ao pedido</a>
      </div>
    </main>
  );
}
