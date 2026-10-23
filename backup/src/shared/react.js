// Atalhos que no HTML original ficavam no topo do <script>:
//   var e = React.createElement;
//   var useState = React.useState, useReducer = React.useReducer, ...
// Aqui viram um módulo só, para todo o resto importar sem repetir.
import React from "react";

export const e = React.createElement;
export const useState = React.useState;
export const useReducer = React.useReducer;
export const useEffect = React.useEffect;
export const useContext = React.useContext;
export const useMemo = React.useMemo;
export const useRef = React.useRef;
export const useCallback = React.useCallback;
export const Fragment = React.Fragment;
export { React };
