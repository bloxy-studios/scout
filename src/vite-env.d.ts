/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ELEVENLABS_AGENT_ID?: string;
  readonly VITE_ELEVENLABS_SERVER_LOCATION?: string;
  readonly VITE_PICOVOICE_ACCESS_KEY?: string;
  readonly VITE_PICOVOICE_KEYWORD_PUBLIC_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
