"use client";
// Sorelly Admin — entrada da aplicação no navegador (antes src/main.js do Vite).
// O Next entrega a casca; daqui para frente é o mesmo React Router de sempre, só no navegador.
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { e, useState, useEffect } from "@/shared/react";
import { rotas } from "@/router/rotas";

export default function Cliente() {
  // O router nasce junto com a tela (e não na hora de carregar o arquivo).
  var [router] = useState(function () {
    var r = createBrowserRouter(rotas);
    // Em desenvolvimento, o router fica acessível no console (window.__router): útil para conferir telas sem recarregar a página.
    if (process.env.NODE_ENV !== "production") window.__router = r;
    return r;
  });
  // Só mostra as rotas depois da primeira carga (rota com loader/lazy). Sem isso, na produção o aviso "pronto" podia chegar entre
  // o desenho e a assinatura do router e a tela ficava em branco numa carga direta de URL (ex.: /kits-novos).
  var [pronto, setPronto] = useState(false);
  useEffect(function () {
    if (router.state.initialized) { setPronto(true); return undefined; }
    return router.subscribe(function (s) { if (s.initialized) setPronto(true); });
  }, [router]);
  if (!pronto) return null;
  return e(RouterProvider, { router: router });
}
