export type Primitive = string | number | boolean | null | undefined | symbol | bigint;

export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

export type DeepPartial<T extends object> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export interface CloneOptions {
  deep?: boolean;
}

export interface CompareOrderBy<T> extends ReadonlyArray<Extract<keyof T, string>> {}

export type Validator<T> = (value: T) => true | string;
export type Validators<T extends object> = Partial<{ [K in keyof T & string]: Validator<T[K]> | Validator<T[K]>[] }>;

export interface FieldSchema<T = unknown> {
  name: string;
  required: boolean;
  readonly?: boolean;
  default?: T | (() => T);
}

export interface ClassSchema<T> {
  fields: FieldSchema<any>[];
}


