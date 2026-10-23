// Sorelly Admin — router/use-rota-aba.js
//
// Mantém a URL e o `state.aba` do app em sincronia nos dois sentidos, sem
// precisar mexer no reducer que veio do HTML original:
//
//   URL -> estado : clique no menu, link colado, botão Voltar do navegador.
//   estado -> URL : ações que trocam a aba por conta própria (LOGIN, ABRIR_CALC).
//
// Na montagem quem manda é a URL, sempre. O estado vem do localStorage e pode
// trazer a última aba da sessão anterior; ela não pode sequestrar um link que
// a pessoa acabou de abrir.
//
// A aba efetiva também pode diferir da que está na URL quando o perfil logado
// não tem permissão para ela; aí a URL é corrigida com replace, sem sujar o
// histórico.
import { useEffect, useRef } from "@/shared/react";
import { useNavigate } from "react-router-dom";

function chave(aba, breve) {
  return aba === "breve" ? "breve:" + (breve || "") : aba;
}

export function useRotaAba(opcoes) {
  var aba = opcoes.aba;
  var abaURL = opcoes.abaURL;
  var breve = opcoes.breve || null;
  var estado = opcoes.estado;
  var dispatch = opcoes.dispatch;
  var caminho = opcoes.caminhoDaAba;

  var navigate = useNavigate();
  var anterior = useRef(chave(estado.aba, estado.breveNome));
  var montado = useRef(false);

  // A aba da URL não é permitida para este perfil: corrige a URL.
  useEffect(
    function () {
      if (aba !== abaURL) navigate(caminho(aba, breve), { replace: true });
    },
    [aba, abaURL]
  );

  // URL -> estado.
  useEffect(
    function () {
      if (chave(estado.aba, estado.breveNome) === chave(aba, breve)) return;
      dispatch({ type: "ABA", aba: aba, breve: breve || undefined });
    },
    [aba, breve]
  );

  // estado -> URL: só quando o próprio reducer trocou a aba, nunca na montagem.
  useEffect(
    function () {
      var atual = chave(estado.aba, estado.breveNome);
      var mudou = anterior.current !== atual;
      anterior.current = atual;
      if (!montado.current) {
        montado.current = true;
        return;
      }
      if (mudou && atual !== chave(aba, breve)) {
        navigate(caminho(estado.aba, estado.breveNome));
      }
    },
    [estado.aba, estado.breveNome]
  );
}
