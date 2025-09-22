import type { CloneOptions, JsonValue, Primitive } from './types';

const hasOwn = Object.prototype.hasOwnProperty;

export function isPrimitive(value: unknown): value is Primitive {
  const t = typeof value;
  return (
    value == null ||
    t === 'string' ||
    t === 'number' ||
    t === 'boolean' ||
    t === 'symbol' ||
    t === 'bigint'
  );
}

export function stableStringify(value: unknown): string {
  const seen = new WeakSet<object>();

  function stringifyInternal(v: unknown): string {
    if (isPrimitive(v)) {
      // Ensure valid JSON output: represent undefined as null (like JSON.stringify for arrays)
      if (v === undefined) return 'null';
      return JSON.stringify(v);
    }
    if (Array.isArray(v)) {
      return '[' + v.map(stringifyInternal).join(',') + ']';
    }
    if (v && typeof v === 'object') {
      if (seen.has(v as object)) {
        throw new TypeError('Circular reference detected in stableStringify');
      }
      seen.add(v as object);
      const keys = Object.keys(v as Record<string, unknown>).sort();
      const entries: string[] = [];
      for (const k of keys) {
        const child = (v as any)[k];
        if (child === undefined) continue; // omit undefined properties
        entries.push(JSON.stringify(k) + ':' + stringifyInternal(child));
      }
      seen.delete(v as object);
      return '{' + entries.join(',') + '}';
    }
    return 'null';
  }

  return stringifyInternal(value);
}

export function shallowEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (isPrimitive(a) || isPrimitive(b)) return a === b;
  if (!a || !b) return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const k of aKeys) {
      if (!hasOwn.call(b, k) || (a as any)[k] !== (b as any)[k]) return false;
    }
    return true;
  }
  return false;
}

export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (isPrimitive(a) || isPrimitive(b)) return a === b;
  if (!a || !b) return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();
    if (aKeys.length !== bKeys.length) return false;
    for (let i = 0; i < aKeys.length; i++) {
      if (aKeys[i] !== bKeys[i]) return false;
      const k = aKeys[i]!;
      if (!deepEqual((a as any)[k], (b as any)[k])) return false;
    }
    return true;
  }
  return false;
}

export function hashCode(value: unknown): number {
  // Based on stable stringify to ensure deterministic order
  const str = stableStringify(value);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash >>> 0; // non-negative 32-bit
}

export function clone<T>(value: T, options?: CloneOptions): T {
  const deep = options?.deep === true;
  if (!deep) {
    if (Array.isArray(value)) return value.slice() as any;
    if (value && typeof value === 'object') return { ...(value as any) };
    return value;
  }
  return deepClone(value);
}

function deepClone<T>(value: T): T {
  if (isPrimitive(value)) return value;
  if (Array.isArray(value)) return (value.map((v) => deepClone(v)) as unknown) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as any)) {
      out[k] = deepClone((value as any)[k]);
    }
    return out as T;
  }
  return value;
}

export function toJSONStable(value: unknown): JsonValue {
  if (isPrimitive(value)) return (value as any) as JsonValue;
  if (Array.isArray(value)) return value.map(toJSONStable) as JsonValue;
  if (value && typeof value === 'object') {
    const keys = Object.keys(value as any).sort();
    const out: Record<string, JsonValue> = {};
    for (const k of keys) {
      const v = (value as any)[k];
      if (v === undefined) continue; // omit undefined properties
      out[k] = toJSONStable(v);
    }
    return out as JsonValue;
  }
  return null;
}

export function compareByKeys<T extends Record<string, any>>(a: T, b: T, orderBy?: ReadonlyArray<Extract<keyof T, string>>): number {
  const keys = orderBy && orderBy.length > 0 ? orderBy : (Object.keys(a) as Extract<keyof T, string>[]);
  for (const key of keys) {
    const av = a[key];
    const bv = b[key];
    if (av === bv) continue;
    if (av == null) return -1;
    if (bv == null) return 1;
    if (av < bv) return -1;
    if (av > bv) return 1;
  }
  return 0;
}


