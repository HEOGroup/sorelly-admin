"use client";
// O sistema inteiro roda no navegador (como no Vite). ssr:false evita rodar as telas no servidor.
import dynamic from "next/dynamic";

const Cliente = dynamic(() => import("@/cliente"), { ssr: false });

export default function Casca() {
  return <Cliente />;
}
