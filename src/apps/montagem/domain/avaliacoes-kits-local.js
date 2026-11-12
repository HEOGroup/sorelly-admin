// Sorelly Admin · montagem — domain/avaliacoes-kits-local.js
// Leitura das avaliações dos kits que existe só neste computador (domain/avaliacoes-kits.local.js, fora do Git). Sem o arquivo = null.
// Fica separado de avaliacoes-kits.js para aquele arquivo continuar sem import (o teste roda no Node).
import { globLocal } from "@/lib/glob-local";

var LOCAL_AVK = (function(){ try { var m = globLocal("apps/montagem/domain/avaliacoes-kits.local.js"); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(x){ return null; } })();

export { LOCAL_AVK };
