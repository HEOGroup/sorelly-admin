// Sorelly Admin · montagem e bipagem — state/context.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { useContext } from "@/shared/react";
import React from "react";

var Ctx = React.createContext(null);
function use(){ return useContext(Ctx); }

export { Ctx, use };
