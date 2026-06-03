export function getErrorMessage(error: unknown, fallback = 'Unexpected error'): string {
  const withReason = (message: string, reason?: string): string => {
    const cleanMessage = message.trim();
    const cleanReason = (reason || '').trim();
    if (!cleanMessage) return fallback;
    return cleanReason ? `${cleanMessage} (${cleanReason})` : cleanMessage;
  };

  if (typeof error === 'string' && error.trim()) return error;

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const record = error as Record<string, unknown>;

    const nestedError = record.error && typeof record.error === 'object'
      ? (record.error as Record<string, unknown>)
      : null;

    const nestedErrorMessage =
      (nestedError && typeof nestedError.message === 'string' && nestedError.message) ||
      '';
    const nestedErrorReason =
      (nestedError && typeof nestedError.reason === 'string' && nestedError.reason) ||
      '';
    if (nestedErrorMessage.trim()) return withReason(nestedErrorMessage, nestedErrorReason);

    const directMessage =
      (typeof record.message === 'string' && record.message) ||
      (typeof record.error === 'string' && record.error) ||
      (typeof record.detail === 'string' && record.detail) ||
      (typeof record.title === 'string' && record.title) ||
      '';

    const directReason = typeof record.reason === 'string' ? record.reason : '';

    if (directMessage.trim()) return withReason(directMessage, directReason);

    if (record.data && typeof record.data === 'object') {
      const nested = record.data as Record<string, unknown>;
      const dataNestedError = nested.error && typeof nested.error === 'object'
        ? (nested.error as Record<string, unknown>)
        : null;
      const dataNestedMessage =
        (dataNestedError && typeof dataNestedError.message === 'string' && dataNestedError.message) ||
        '';
      const dataNestedReason =
        (dataNestedError && typeof dataNestedError.reason === 'string' && dataNestedError.reason) ||
        '';
      if (dataNestedMessage.trim()) return withReason(dataNestedMessage, dataNestedReason);

      const nestedMessage =
        (typeof nested.message === 'string' && nested.message) ||
        (typeof nested.error === 'string' && nested.error) ||
        '';
      const nestedReason = typeof nested.reason === 'string' ? nested.reason : '';
      if (nestedMessage.trim()) return withReason(nestedMessage, nestedReason);
    }

    if (Array.isArray(record.errors)) {
      const messages = record.errors
        .map((item) => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item !== null) {
            const nested = item as Record<string, unknown>;
            if (typeof nested.message === 'string') return nested.message;
          }
          return '';
        })
        .filter((msg) => msg.trim().length > 0);

      if (messages.length > 0) return messages.join(', ');
    }
  }

  return fallback;
}
