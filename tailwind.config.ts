import type {Config} from "tailwindcss";
const config:Config={content:["./app/**/*.{ts,tsx}","./components/**/*.{ts,tsx}"],theme:{extend:{colors:{trust:{50:"#f4f4f1",100:"#e8e8e3",200:"#d8d8d1",300:"#c6c6bd",400:"#9f9f96",500:"#6f6f68",600:"#52524d",700:"#30302d",800:"#1c1c1a",900:"#111110"},ink:"#171717",cream:"#f5f5f2",lime:"#d9f99d"},fontFamily:{sans:["Arial","Helvetica","sans-serif"]},boxShadow:{soft:"0 10px 35px rgba(0,0,0,.06)",card:"0 1px 2px rgba(0,0,0,.04),0 12px 35px rgba(0,0,0,.05)"}}},plugins:[]};
export default config;
