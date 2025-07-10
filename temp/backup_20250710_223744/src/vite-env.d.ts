/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly BASE_URL: string;
  readonly MODE: string;
  readonly SSR: boolean;
  // Add other environment variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}