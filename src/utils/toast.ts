export interface ToastPayload {
  title?: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
}

/**
 * Dispatch a global application toast notification
 */
export const showToast = (payload: string | ToastPayload) => {
  const detail: ToastPayload =
    typeof payload === 'string'
      ? { message: payload, type: 'success' }
      : { type: 'success', ...payload };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-toast', { detail }));
  }
};
