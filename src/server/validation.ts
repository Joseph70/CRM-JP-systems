export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: Record<string, string> };

export function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export function readString(
  source: Record<string, unknown>,
  key: string,
  errors: Record<string, string>,
  options: { required?: boolean; maxLength?: number } = {},
): string | undefined {
  const value = source[key];

  if (value === undefined || value === null || value === "") {
    if (options.required) {
      errors[key] = "Este campo es obligatorio.";
    }
    return undefined;
  }

  if (typeof value !== "string") {
    errors[key] = "Debe ser texto.";
    return undefined;
  }

  const trimmed = value.trim();

  if (options.maxLength && trimmed.length > options.maxLength) {
    errors[key] = `Debe tener ${options.maxLength} caracteres o menos.`;
  }

  return trimmed;
}

export function readNumber(
  source: Record<string, unknown>,
  key: string,
  errors: Record<string, string>,
  options: { required?: boolean; min?: number } = {},
): number | undefined {
  const value = source[key];

  if (value === undefined || value === null || value === "") {
    if (options.required) {
      errors[key] = "Este campo es obligatorio.";
    }
    return undefined;
  }

  const numberValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numberValue)) {
    errors[key] = "Debe ser un numero valido.";
    return undefined;
  }

  if (options.min !== undefined && numberValue < options.min) {
    errors[key] = `Debe ser mayor o igual a ${options.min}.`;
  }

  return numberValue;
}

export function readEnum<T extends string>(
  source: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
  errors: Record<string, string>,
  options: { required?: boolean } = {},
): T | undefined {
  const value = readString(source, key, errors, options);

  if (!value) {
    return undefined;
  }

  if (!allowed.includes(value as T)) {
    errors[key] = `Debe ser uno de: ${allowed.join(", ")}.`;
    return undefined;
  }

  return value as T;
}
