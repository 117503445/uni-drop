/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BE_HOST: string;
  readonly VITE_MOCK_API: string;
  readonly VITE_DISABLE_HEARTBEAT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
