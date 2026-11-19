import Formulario from "./formulario";

// Canal de Ética e Denúncias (17/11/2026): página PÚBLICA, sem login, só com o link. Não é indexada pelos buscadores.
export const metadata = { title: "Canal de Ética e Denúncias · Sorelly", robots: { index: false, follow: false } };

export default function Page() {
  return <Formulario />;
}
