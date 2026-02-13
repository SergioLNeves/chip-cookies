export interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: string;
  maxAge?: number;
  /** Sempre forçado como true pela camada nativa. O valor passado é ignorado. */
  secure?: boolean;
  /**
   * Flag apenas informativa em contexto de módulo nativo.
   * JS sempre tem acesso aos valores via API do módulo.
   */
  httpOnly?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

export type CookieMap = Record<string, Cookie>;
