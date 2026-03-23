/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CCBILL_CLIENT_ACC_NO: string
  readonly VITE_CCBILL_CLIENT_SUB_ACC_NO: string
  readonly VITE_CCBILL_FORM_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
