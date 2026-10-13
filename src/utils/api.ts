/**
 * Utilitários para chamadas seguras de API que protegem a aplicação
 * contra erros de parsing JSON quando servidores, proxies ou CDNs
 * retornam páginas de erro em HTML (ex: 404, 502, 504, Cloudflare, etc.)
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('webstore360_api_base_url');
    if (customUrl && customUrl.trim()) {
      return customUrl.trim().replace(/\/+$/, '');
    }
  }
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_BASE_URL : undefined;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return '';
}

export function setApiBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    const trimmed = url.trim();
    if (trimmed) {
      localStorage.setItem('webstore360_api_base_url', trimmed.replace(/\/+$/, ''));
    } else {
      localStorage.removeItem('webstore360_api_base_url');
    }
  }
}

/**
 * Lê e analisa a resposta HTTP de forma segura, garantindo que
 * respostas em HTML ou texto puro não quebrem a aplicação com SyntaxError.
 */
export async function safeParseResponse<T = any>(res: Response): Promise<ApiResponse<T>> {
  const contentType = res.headers.get('content-type') || '';
  let text = '';
  try {
    text = await res.text();
  } catch (err: any) {
    return {
      ok: false,
      status: res.status,
      error: `Erro ao ler resposta do servidor: ${err?.message || 'Falha de I/O'}`,
    };
  }

  let json: any = null;
  const trimmed = text.trim();
  const isHtml =
    trimmed.startsWith('<') ||
    trimmed.toLowerCase().includes('<!doctype') ||
    trimmed.toLowerCase().includes('<html') ||
    trimmed.toLowerCase().includes('<head') ||
    trimmed.toLowerCase().includes('the page cannot') ||
    trimmed.toLowerCase().includes('the page could not');

  const looksLikeJson = (trimmed.startsWith('{') || trimmed.startsWith('[')) && !isHtml;

  if (contentType.includes('application/json') || looksLikeJson) {
    try {
      json = JSON.parse(trimmed);
    } catch {
      // Ignora falha de parse e segue para tratamento de erro amigável
    }
  }

  if (res.ok) {
    if (json !== null) {
      return { ok: true, status: res.status, data: json };
    }
    // Se o status for 200 mas o corpo for HTML (ex: rewrite de SPA servindo index.html para rota de API inexistente)
    if (isHtml) {
      return {
        ok: false,
        status: 404,
        error: `O servidor retornou uma página HTML (HTTP ${res.status}) em vez de dados da API. O serviço backend Node.js não está ativo ou a rota não existe nesta URL.`,
      };
    }
    return { ok: true, status: res.status, data: (text as unknown as T) };
  }

  // Tratamento de mensagens de erro amigáveis para falhas HTTP
  let errorMsg = json?.error || json?.message;
  if (!errorMsg) {
    if (isHtml) {
      errorMsg = `O servidor retornou uma página de erro (HTTP ${res.status}: ${res.statusText || 'Não encontrado ou indisponível'}). Verifique se o serviço está ativo ou se o domínio é hospedado estaticamente.`;
    } else if (trimmed.length > 0 && trimmed.length < 250) {
      errorMsg = trimmed;
    } else {
      errorMsg = `Falha na requisição (HTTP ${res.status}: ${res.statusText || 'Erro no servidor'}).`;
    }
  }

  return { ok: false, status: res.status, error: errorMsg, data: json };
}

/**
 * Realiza fetch seguro que nunca dispara 'SyntaxError: Unexpected token ... is not valid JSON'
 * e suporta URL base configurável para deploys em domínios personalizados (ex: Vercel, GitHub Pages).
 */
export async function safeJsonFetch<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    let target = input;
    if (typeof input === 'string' && input.startsWith('/api/')) {
      const baseUrl = getApiBaseUrl();
      if (baseUrl) {
        target = `${baseUrl}${input}`;
      }
    }

    const res = await fetch(target, init);
    return await safeParseResponse<T>(res);
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      error: err?.message || 'Falha de conexão com o servidor. Verifique sua conexão de rede.',
    };
  }
}
