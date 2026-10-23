// Sorelly Admin · montagem e bipagem — pages/Regras.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { TabelaEquipe } from "@/apps/montagem/components/equipe-blocos";
import { TabelaPecasVer } from "@/apps/montagem/components/tabela-pecas-ver";
import { tabelaAtual } from "@/apps/montagem/domain/config";
import { BK, N1 } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO, brl } from "@/apps/montagem/ui/input";
import { PageHead, Secao } from "@/apps/montagem/ui/page";
import { TD, TR } from "@/apps/montagem/ui/table";
import { e } from "@/shared/react";
import React from "react";

function AbaRegras(){
  var c = use().state.cfg;
  var tab = tabelaAtual(c).slice().sort(function(a,b){return a.min-b.min;});
  var faixas = c.faixas.slice().sort(function(a,b){return b.min-a.min;});
  var v = function(x){ return e("b",{className:"text-primary"}, x); };
  var cartao = function(titulo, ic, sub, itens){ return e("div",{className:"flex flex-col rounded-xl bg-linear-to-br from-[#E8B84B]/10 via-card to-card p-5 ring-1 ring-[#E8B84B]/20"},
    e("div",{className:"mb-1 flex items-center gap-2"}, e("span",{className:"grid size-8 place-items-center rounded-lg bg-primary/15 text-primary"}, e(Icon,{n:ic, s:16})),
      e("h2",{className:"font-heading text-lg font-semibold"}, titulo)),
    e("p",{className:"mb-3 text-[13px] text-muted-foreground"}, sub),
    e("ol",{className:"flex flex-col gap-2"}, itens.filter(Boolean).map(function(it,i){ return e("li",{key:i, className:"flex gap-2.5 text-sm leading-snug"},
      e("span",{className:MONO+" mt-px grid size-5 shrink-0 place-items-center rounded-md bg-muted text-[11px] font-bold text-primary"}, i+1), e("span",null, it)); }))); };
  return e(React.Fragment,null,
    e(PageHead,{t:"Regras", sub:"As regras de cada pessoa, sempre com os valores atuais do Configurador. Mudou lá, muda aqui na hora."}),
    e("div",{className:"grid grid-cols-1 items-start gap-4 lg:grid-cols-2"},
      cartao("Representantes","user","Pedido, valor do kit, retirada e avaliação.",[
        e(React.Fragment,null,"Os kits precisam ser pedidos com ", v(c.prazoPedidoHoras+" horas")," de antecedência. Pedido fora do prazo entra como ", v("atrasado")," e fica registrado no Consolidado."),
        e(React.Fragment,null,"O valor do kit sai da ", v("média de 3 meses")," de venda da revendedora."),
        e(React.Fragment,null,"A última venda é ", v("puxada sozinha do nosso app")," quando é ", v(BK(c.minVendaApp))," ou mais — nesse caso a Deysiane só completa as outras 2, direto da DevMaster."),
        e(React.Fragment,null,"Sem venda no app, ou venda menor que ", v(BK(c.minVendaApp)),", a Deysiane preenche as ", v("3 manualmente"),", direto da DevMaster."),
        e(React.Fragment,null,"Revendedora sem vendas recebe o kit inicial de ", v(BK(c.kitInicial)),". Tabela em uso: ", v("estoque "+(c.tabelaAtiva==="baixo"?"baixo":"alto")),"."),
        e(React.Fragment,null,"Na retirada, a representante escolhe os kits, informa o ", v("código do app")," e ", v("assina na tela"),". Recebe o comprovante no app."),
        e(React.Fragment,null,"Depois de conferir com a revendedora, avalia cada kit (", v("nota de 1 a 5"),") e aponta as ", v("peças faltando"),"."),
        e(React.Fragment,null,"Quando a retirada é feita pelo ", v("celular da bipagem"),", ela confirma o ", v("recebimento no app"),"; só então os kits saem como retirados."),
        e(React.Fragment,null,"Cada item da listagem tem um tipo: ", v("kit novo"),", ", v("acerto + kit"),", com ", v("expositor")," ou ", v("só condicional"),". Acertos trazem os números das condicionais."),
        e(React.Fragment,null,"Revendedoras novas direcionadas pelo setor Kit novo aparecem no app; ela coloca na própria listagem (fora do prazo entra como ", v("atrasado"),").")]),
      cartao("Montadoras","box","Fila, alto valor e comissão de montagem.",[
        e(React.Fragment,null,"Fila única por horário de retirada; ", v("prioritários primeiro"),", em rodízio entre as representantes do mesmo horário. Cada uma monta ", v("um kit por vez"),"."),
        e(React.Fragment,null,"Kits acima de ", v(BK(c.limiteMelhores))," só para as ", v(c.topN+" montadoras com melhor nota")," (depois de ", v(c.minKitsRestricao+" kits")," da equipe no mês; mínimo de ", v(c.minAvalRanking+" avaliações"),")."),
        e(React.Fragment,null,"Kits acima de ", v(BK(c.limiteAtencao))," passam por ", v("conferência da supervisão")," antes da bipagem."),
        e(React.Fragment,null,"Recebe ", v(brl(c.valorNormal))," por kit e ", v(brl(c.valorEspecial))," por kit acima de ", v(BK(c.limiteEspecial)),"."),
        e(React.Fragment,null,"A nota do mês define quanto recebe: ", faixas.map(function(f,i){ return e("span",{key:i}, (i?" · ":"")+"a partir de "+N1(f.min)+" → ", v(f.pct+"%")); }),"."),
        e(React.Fragment,null,"Divergência acima de ", v(N1(c.divPct)+"%")," na bipagem conta contra a montadora: a cada ", v(c.divBloco+" divergências")," perde ", v(c.divPerda+"%"),"."),
        e(React.Fragment,null,"Nota abaixo de ", v(N1(c.alertaAmarelo))," = atenção; abaixo de ", v(N1(c.alertaVermelho))," = risco de saída."),
        e(React.Fragment,null,"Ao final da montagem, ", v("pega as condicionais")," do acerto e confirma no celular antes de concluir."),
        e(React.Fragment,null,"O kit vai para ", v("quem ficar livre primeiro"),": ninguém reserva kit antes de apertar Iniciar, e a ordem nunca se perde.")]),
      cartao("Bipadoras","scan","Bipagem pelo login próprio e comissão de bipagem.",[
        e(React.Fragment,null,"Bipa no computador, com ", v("login próprio"),": Iniciar bipagem, cronômetro e Finalizar. Um kit por vez."),
        e(React.Fragment,null,"Confere o valor ", v("sem as encomendas"),". Diferença acima de ", v(N1(c.divPct)+"%")," registra divergência para a montadora."),
        e(React.Fragment,null,"Recebe ", v(brl(c.valorBipNormal))," por kit e ", v(brl(c.valorBipEspecial))," por kit acima de ", v(BK(c.limiteBipEspecial)),"."),
        e(React.Fragment,null,"Cada ", v("peça faltando")," apontada pela representante desconta ", v(brl(c.perdaFalta)),"."),
        e(React.Fragment,null,"Ao finalizar a bipagem, digita o ", v("número da nova condicional")," (obrigatório)."),
        e(React.Fragment,null,"Uma bipadora com ", v("celular")," faz a retirada em paralelo: marca os kits da representante e envia para o app dela confirmar.")]),
      cartao("Kit novo e indicação","gem","Michele · supervisor: Nickolas.",[
        e(React.Fragment,null,"Contato com as novas revendedoras e ", v("acompanhamento do cadastro até a entrega do kit"),", com atualização do status até a confirmação."),
        e(React.Fragment,null,"Define a ", v("rota e a representante")," pela localização e km; solicita os kits na DevMaster e envia as listagens para montagem."),
        e(React.Fragment,null,"Acompanha a ", v("bipagem e a condicional dentro do prazo")," e fala com a representante quando há pendência."),
        e(React.Fragment,null,v("Indicação:")," acompanha o Kommo, confere dados e localização, envia para análise, pede documentos, encaminha ao Cadastro e, após a entrega do kit, libera os coins da indicadora."),
        e(React.Fragment,null,v("Brindes:")," agenda a retirada com a indicadora, confirma data e horário e dá baixa no sistema após a retirada.")]),
      cartao("Kit novo: regras da listagem","gem","Como a revendedora nova entra na listagem.",[
        e(React.Fragment,null,"As revendedoras cadastradas chegam ", v("sem vendas anteriores")," e com o ", v("valor do kit já definido")," pelo setor."),
        e(React.Fragment,null,"A Michele ", v("direciona para a representante"),", que coloca na listagem dela, ou ", v("coloca direto numa listagem"),"."),
        e(React.Fragment,null,"Dentro do prazo de ", v(c.prazoPedidoHoras+" horas"),", entra normal. Fora do prazo, só com ", v("autorização do Marcus ou do Nickolas"),", e fica marcado como atrasado."),
        e(React.Fragment,null,"Pode ir com ", v("expositor"),"; na listagem aparece como “kit novo + expositor”."),
        e(React.Fragment,null,"Revendedora sem vendas que não veio do Kit novo recebe o kit padrão de ", v(BK(c.kitInicial)),", ", v("a confirmar"),".")]),
      cartao("Supervisão","settings","Coordenação dos kits (Deysiane).",[
        e(React.Fragment,null,"Confirma o valor de cada kit (sugestão pela média ou valor manual) antes de entrar na fila."),
        e(React.Fragment,null,"Pode designar um kit para uma montadora específica."),
        e(React.Fragment,null,"Confere os kits acima de ", v(BK(c.limiteAtencao)),": libera ou devolve para ajuste com motivo."),
        e(React.Fragment,null,"Registra a retirada com código e assinatura da representante."),
        e(React.Fragment,null,"Fecha o mês; o pagamento sai no dia ", v(c.diaPagamento)," do mês seguinte.")])),
    e(Secao,{t:"Qual kit a revendedora recebe", sub:"tabela de estoque "+(c.tabelaAtiva==="baixo"?"baixo":"alto")+" · pela média de vendas dos últimos 3 meses"},
      (function(){ var ord = tab.slice().sort(function(a,b){return a.min-b.min;});
        var faixa = function(f,i){ var prox = ord[i+1]; return prox ? BK(f.min)+" a "+BK(prox.min-1) : "acima de "+BK(f.min); };
        return e(TabelaEquipe,{min:"min-w-[50rem]", larg:[170].concat(ord.map(function(){return null;})), cols:["Vendeu por mês"].concat(ord.map(faixa))},
          e("tr",{className:TR}, e(TD,{className:"py-2.5! text-center! font-semibold"},"Recebe o kit de"),
            ord.map(function(f,i){ return e(TD,{key:i, className:"py-2.5! text-center! "+MONO+" text-[15px] font-bold text-primary"}, BK(f.kit)); }))); })(),
      e("p",{className:"text-[13px]"},"Sem vendas: kit de "+BK(c.kitInicial)+" (a confirmar). Kit novo: valor definido pelo setor Kit novo.")),
    e(Secao,{t:"O que vai em cada kit", sub:"peças de cada tipo por valor do kit · trio e conjunto contam como 1 peça"},
      e(TabelaPecasVer,null)));
}

export { AbaRegras };
