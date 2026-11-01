/**
 * Neon Functions integration module
 */

export interface NeonFunctionResponse<T = unknown> {
  success: boolean;
  data?: T;
  raw?: string;
  error?: string;
  status: number;
}

/**
 * Invoke the deployed Neon 'hello' function
 */
export async function invokeNeonHello(): Promise<NeonFunctionResponse<string>> {
  const baseUrl =
    process.env.NEON_FUNCTION_HELLO_BASE_URL ||
    'https://br-dawn-river-a14n462p-hello.compute.c-1.ap-southeast-1.aws.neon.tech';

  try {
    const res = await fetch(baseUrl, {
      method: 'GET',
      headers: {
        Accept: 'text/plain, application/json',
      },
    });

    const text = await res.text();
    return {
      success: res.ok,
      data: text,
      raw: text,
      status: res.status,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: message,
      status: 500,
    };
  }
}

/**
 * Generic caller for Neon functions
 */
export async function callNeonFunction<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<NeonFunctionResponse<T>> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      return {
        success: res.ok,
        data,
        status: res.status,
      };
    } else {
      const text = await res.text();
      return {
        success: res.ok,
        raw: text,
        data: text as unknown as T,
        status: res.status,
      };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: message,
      status: 500,
    };
  }
}
