// Sorelly Admin · montagem — domain/folders-cadastro.js
// Cadastro de revendedoras → Folders (03/11/2026, Marcus): os folders em PDF para enviar às revendedoras e às candidatas.
// O arquivo fica em public/regras/ (abre em /regras/...). Fonte de cada folder em materiais-do-app/ (HTML + PDF). Folder novo: acrescentar aqui.
// resumo = 2 páginas para quem quer se cadastrar (8 páginas já assusta); completo = regulamento para quem já é revendedora.
var FOLDERS = [
  {id:"resumo", nome:"Folder resumido", publico:"Candidatas a revendedora", paginas:2, arquivo:"/regras/FOLDER-RESUMO-REVENDEDORA.pdf", atualizado:"2026-11-03",
    quando:"Enviar para quem quer se cadastrar",
    msg:"Olá! Aqui está o resumo de como funciona ser revendedora Sorelly: como ganhar, as comissões e o que combinamos. É rapidinho de ler."},
  {id:"completo", nome:"Regulamento completo", publico:"Revendedoras cadastradas", paginas:8, arquivo:"/regras/GUIA-DA-REVENDEDORA.pdf", atualizado:"2026-11-03",
    quando:"Enviar depois do cadastro aprovado",
    msg:"Olá! Aqui está o regulamento completo da revendedora Sorelly, com as regras e comissões atualizadas."}
];

var dataBr = function(iso){ return iso ? String(iso).slice(0,10).split("-").reverse().join("/") : ""; };
var linkDe = function(f, origem){ return (origem || "") + f.arquivo; };
var mensagemDe = function(f, origem){ return f.msg + "\n" + linkDe(f, origem); };

export { FOLDERS, dataBr, linkDe, mensagemDe };
