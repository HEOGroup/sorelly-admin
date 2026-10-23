// Sorelly Admin · montagem e bipagem — state/context.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { useContext } from "@/shared/react";
import React from "react";

var Ctx = React.createContext(null);
// eslint-disable-next-line react-hooks/rules-of-hooks -- "use" é o hook do app (chamado em todas as telas); renomear mexeria em centenas de arquivos
function use(){ return useContext(Ctx); }

export { Ctx, use };
