import type { CloneOptions, DataShape, DeepPartial, JsonValue, StrictCreateInput, Validators } from './types';
import { clone as cloneValue, compareByKeys, deepEqual, hashCode as hashOf, shallowEqual, stableStringify, toJSONStable } from './utils';

type Constructor<T> = new (...args: any[]) => T;

export abstract class DataClass {
  // Instance API delegates to static methods bound to constructor

  static create<T extends typeof DataClass>(this: T, patch?: Partial<DataShape<InstanceType<T>>>): InstanceType<T> {
    const instance = new (this as unknown as Constructor<InstanceType<T>>)();
    if (patch) Object.assign(instance, patch);
    return Object.seal(instance);
  }

  static createStrict<T extends typeof DataClass>(this: T, patch: StrictCreateInput<DataShape<InstanceType<T>>>): InstanceType<T> {
    const instance = new (this as unknown as Constructor<InstanceType<T>>)();
    const descriptor = getRequiredOptionalKeys(instance as Record<string, unknown>);

    for (const key of descriptor.required) {
      if (!(key in patch)) {
        throw new TypeError(`Field "${key}" must be provided`);
      }
    }

    Object.assign(instance, patch);
    return Object.seal(instance);
  }

  static from<T extends typeof DataClass, S extends Partial<DataShape<InstanceType<T>>>>(
    this: T,
    source: S,
    overrides?: Partial<DataShape<InstanceType<T>>>
  ): InstanceType<T> {
    const merged = { ...source, ...(overrides ?? {}) } as Partial<DataShape<InstanceType<T>>>;
    return this.create(merged);
  }

  static fromArray<T extends typeof DataClass, S extends Partial<DataShape<InstanceType<T>>>>(
    this: T,
    sources: ReadonlyArray<S>,
    overrides?:
      | Partial<DataShape<InstanceType<T>>>
      | ((source: S, index: number) => Partial<DataShape<InstanceType<T>>> | undefined)
  ): InstanceType<T>[] {
    return sources.map((source, index) => {
      const override = typeof overrides === 'function' ? overrides(source, index) : overrides;
      return this.from(source, override);
    });
  }

  static copy<T extends typeof DataClass>(this: T, instance: InstanceType<T>, patch?: DeepPartial<InstanceType<T>>, options?: CloneOptions): InstanceType<T> {
    const base = options?.deep ? cloneValue(instance, { deep: true }) : { ...(instance as any) };
    const merged = patch ? mergeDeep(base, patch) : base;
    const copy = new (this as unknown as Constructor<InstanceType<T>>)();
    Object.assign(copy, merged);
    return Object.seal(copy);
  }

  static update<T extends typeof DataClass>(this: T, instance: InstanceType<T>, patch: DeepPartial<InstanceType<T>>, options?: CloneOptions): InstanceType<T> {
    return this.copy(instance, patch, options);
  }

  static clone<T extends typeof DataClass>(this: T, instance: InstanceType<T>, options?: CloneOptions): InstanceType<T> {
    const cloned = cloneValue(instance, options);
    const copy = new (this as unknown as Constructor<InstanceType<T>>)();
    Object.assign(copy, cloned);
    return Object.seal(copy);
  }

  static equals<T extends typeof DataClass>(this: T, a: InstanceType<T> | null | undefined, b: InstanceType<T> | null | undefined, deep: boolean = true): boolean {
    if (deep) return deepEqual(a, b);
    return shallowEqual(a, b);
  }

  static toJSON<T extends typeof DataClass>(this: T, instance: InstanceType<T>): JsonValue {
    return toJSONStable(instance);
  }

  static toString<T extends typeof DataClass>(this: T, instance: InstanceType<T>): string {
    return stableStringify(instance);
  }

  static hashCode<T extends typeof DataClass>(this: T, instance: InstanceType<T>): number {
    return hashOf(instance);
  }

  static compareTo<T extends typeof DataClass>(this: T, a: InstanceType<T>, b: InstanceType<T>, orderBy?: ReadonlyArray<Extract<keyof InstanceType<T>, string>>): number {
    return compareByKeys(a as any, b as any, orderBy as ReadonlyArray<string>);
  }

  static keys<T extends typeof DataClass>(this: T, instance: InstanceType<T>): ReadonlyArray<string> {
    return Object.keys(instance);
  }
  static values<T extends typeof DataClass>(this: T, instance: InstanceType<T>): ReadonlyArray<unknown> {
    return Object.values(instance);
  }
  static entries<T extends typeof DataClass>(this: T, instance: InstanceType<T>): ReadonlyArray<[string, unknown]> {
    return Object.entries(instance) as ReadonlyArray<[string, unknown]>;
  }

  static validate<T extends typeof DataClass>(this: T, instance: InstanceType<T>, validators: Validators<InstanceType<T>>): { ok: boolean; errors: Record<string, string[]> } {
    const errors: Record<string, string[]> = {};
    for (const k of Object.keys(validators) as Array<keyof typeof validators>) {
      const validator = validators[k];
      if (!validator) continue;
      const value = (instance as any)[k as string];
      const validatorsArray = Array.isArray(validator) ? validator : [validator];
      for (const v of validatorsArray) {
        const res = (v as any)(value);
        if (res !== true) {
          const key = k as string;
          const list = errors[key] ?? (errors[key] = []);
          list.push(res || 'Invalid');
        }
      }
    }
    return { ok: Object.keys(errors).length === 0, errors };
  }

  // Instance methods proxy to static for ergonomic DX
  create<T extends this>(patch?: Partial<DataShape<T>>): T {
    return (this.constructor as any).create(patch);
  }
  createStrict<T extends this>(patch: StrictCreateInput<DataShape<T>>): T {
    return (this.constructor as any).createStrict(patch);
  }
  copy<T extends this>(patch?: DeepPartial<T>, options?: CloneOptions): T {
    return (this.constructor as any).copy(this, patch, options);
  }
  update<T extends this>(patch: DeepPartial<T>, options?: CloneOptions): T {
    mergeDeep(this as any, patch as any);
    return this as T;
  }
  clone<T extends this>(options?: CloneOptions): T {
    return (this.constructor as any).clone(this, options);
  }
  pick<K extends Extract<keyof DataShape<this>, string>>(keys: ReadonlyArray<K>): Pick<DataShape<this>, K> {
    return pickKeys(this as any, keys);
  }
  omit<K extends Extract<keyof DataShape<this>, string>>(keys: ReadonlyArray<K>): Omit<DataShape<this>, K> {
    return omitKeys(this as any, keys);
  }
  equals<T extends this>(other: T, deep: boolean = true): boolean {
    return (this.constructor as any).equals(this, other, deep);
  }
  toJSON(): JsonValue {
    return (this.constructor as any).toJSON(this);
  }
  toString(): string {
    return (this.constructor as any).toString(this);
  }
  hashCode(): number {
    return (this.constructor as any).hashCode(this);
  }
  compareTo<T extends this>(other: T, orderBy?: ReadonlyArray<Extract<keyof T, string>>): number {
    return (this.constructor as any).compareTo(this, other, orderBy as any);
  }
  keys(): ReadonlyArray<string> { return (this.constructor as any).keys(this); }
  values(): ReadonlyArray<unknown> { return (this.constructor as any).values(this); }
  entries(): ReadonlyArray<[string, unknown]> { return (this.constructor as any).entries(this); }
  validate(validators: Validators<this>): { ok: boolean; errors: Record<string, string[]> } {
    return (this.constructor as any).validate(this, validators as any);
  }
}

function mergeDeep<T extends Record<string, any>>(base: T, patch: any): T {
  if (!patch || typeof patch !== 'object') return base;
  for (const k of Object.keys(patch)) {
    const pv = patch[k];
    if (pv === undefined) continue;
    const bv = (base as any)[k];
    if (Array.isArray(pv)) {
      (base as any)[k] = pv.slice();
    } else if (pv && typeof pv === 'object' && bv && typeof bv === 'object' && !Array.isArray(bv)) {
      (base as any)[k] = mergeDeep({ ...(bv as any) }, pv);
    } else {
      (base as any)[k] = pv;
    }
  }
  return base;
}

function pickKeys<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: ReadonlyArray<K>): Pick<T, K> {
  const result: Partial<T> = {};
  for (const key of keys) {
    if (key in obj) {
      (result as any)[key] = obj[key];
    }
  }
  return result as Pick<T, K>;
}

function omitKeys<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: ReadonlyArray<K>): Omit<T, K> {
  const result: Partial<T> = {};
  const exclude = new Set(keys as ReadonlyArray<keyof T>);
  for (const key of Object.keys(obj) as Array<keyof T>) {
    if (!exclude.has(key)) {
      (result as any)[key] = obj[key];
    }
  }
  return result as Omit<T, K>;
}

function getRequiredOptionalKeys(instance: Record<string, unknown>): { required: ReadonlyArray<string>; optional: ReadonlyArray<string> } {
  const keys = Object.keys(instance);
  const required: string[] = [];
  const optional: string[] = [];
  for (const key of keys) {
    if (instance[key] === undefined) {
      optional.push(key);
    } else {
      required.push(key);
    }
  }
  return { required, optional };
}


