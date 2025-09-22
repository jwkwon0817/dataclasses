import { describe, expect, it } from 'vitest';
import { DataClass } from '../src';

class User extends DataClass {
  name: string = 'Anon';
  age: number = 0;
  email?: string;
}

describe('DataClass basics', () => {
  it('create and default values', () => {
    const u = User.create({ name: 'Alice', age: 30 });
    expect(u.name).toBe('Alice');
    expect(u.age).toBe(30);
    expect(u.email).toBeUndefined();
  });

  it('copy and update', () => {
    const u1 = User.create({ name: 'Alice', age: 30 });
    const u2 = u1.copy({ age: 31 });
    expect(u1.age).toBe(30);
    expect(u2.age).toBe(31);

    u1.update({ age: 32 });
    expect(u1.age).toBe(32);
  });

  it('equals/hashCode', () => {
    const a = User.create({ name: 'A', age: 1 });
    const b = User.create({ name: 'A', age: 1 });
    expect(a.equals(b)).toBe(true);
    expect(a.hashCode()).toBe(b.hashCode());
  });

  it('toJSON stable', () => {
    const u = User.create({ name: 'A', age: 1 });
    expect(u.toJSON()).toEqual({ age: 1, name: 'A' });
    expect(u.toString()).toBe('{"age":1,"name":"A"}');
  });

  it('compareTo', () => {
    const a = User.create({ name: 'A', age: 1 });
    const b = User.create({ name: 'B', age: 1 });
    expect(a.compareTo(b, ['name'])).toBeLessThan(0);
  });

  it('validate', () => {
    const u = User.create({ name: 'A', age: -1 });
    const res = u.validate({ age: (v) => (v >= 0 ? true : 'age must be >= 0') });
    expect(res.ok).toBe(false);
    expect(res.errors?.age?.[0]).toBe('age must be >= 0');
  });
});

