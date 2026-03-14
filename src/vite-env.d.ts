/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SOFTPHONE_ENABLED?: string;
  readonly VITE_SOFTPHONE_AUTO_CONNECT?: string;
  readonly VITE_SOFTPHONE_REQUIRE_INTERNET_ACTIVE?: string;
  readonly VITE_SOFTPHONE_PBX_HOST?: string;
  readonly VITE_SOFTPHONE_PBX_DOMAIN?: string;
  readonly VITE_SOFTPHONE_PBX_WSS_URL?: string;
  readonly VITE_SOFTPHONE_DEFAULT_DISPLAY_NAME?: string;
  readonly VITE_SOFTPHONE_TRANSPORT?: string;
  readonly VITE_SOFTPHONE_PORTARIA_EXTENSION?: string;
  readonly VITE_SOFTPHONE_ADMIN_EXTENSION?: string;
  readonly VITE_SOFTPHONE_LAUNDRY_EXTENSION?: string;
  readonly VITE_SOFTPHONE_DELIVERY_EXTENSION?: string;
  readonly VITE_SOFTPHONE_DOOR_MODE?: string;
  readonly VITE_SOFTPHONE_DOOR_LABEL?: string;
  readonly VITE_SOFTPHONE_DOOR_DTMF?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
