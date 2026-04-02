/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POKEAPI_BASE_URL?: string;
  readonly VITE_POKEAPI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean;
  }
  export function registerSW(options?: RegisterSWOptions): void;
}
