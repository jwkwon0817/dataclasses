export type Primitive = string | number | boolean | null | undefined | symbol | bigint;

export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

export type DeepPartial<T extends object> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never }[keyof T];
export type NonFunctionPropertyNames<T> = Exclude<keyof T, FunctionPropertyNames<T>>;
export type DataShape<T extends object> = Pick<T, NonFunctionPropertyNames<T>>;

export type RequiredKeys<T> = { [K in keyof T]-?: undefined extends T[K] ? never : K }[keyof T];

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

type StrictRequiredKeys<T> = RequiredKeys<T>;

export type StrictCreateInput<T extends object> = [StrictRequiredKeys<T>] extends [never]
  ? Partial<T>
  : Required<Pick<T, StrictRequiredKeys<T>>> & Partial<Omit<T, StrictRequiredKeys<T>>>;


