import { describe, expect, it } from 'vitest';
import type { DataShape, StrictCreateInput } from '../src';
import { DataClass } from '../src';

class User extends DataClass {
  name: string = 'Anon';
  age: number = 0;
  email?: string;
}

class Invoice extends DataClass {
  id: string = '';
  customerName: string = '';
  totalPrice: number = 0;
  status?: string;
  createdAt: Date = new Date(0);
}

describe('DataClass basics', () => {
  it('create and default values', () => {
    const u = User.create({ name: 'Alice', age: 30 });
    expect(u.name).toBe('Alice');
    expect(u.age).toBe(30);
    expect(u.email).toBeUndefined();
  });

  it('createStrict enforces required fields', () => {
    const strict = User.createStrict({ name: 'Alice', age: 30 });
    expect(strict.name).toBe('Alice');
    expect(strict.age).toBe(30);

    type StrictUserInput = StrictCreateInput<DataShape<User>>;
    const validInput: StrictUserInput = { name: 'Alice', age: 1 };
    expect(validInput.age).toBe(1);

    // @ts-expect-error missing required field "age"
    const invalidInput: StrictUserInput = { name: 'Alice' };
    void invalidInput;
  });

  it('from copies properties from plain object', () => {
    const invoice = Invoice.from({ id: '1', customerName: 'ACME', totalPrice: 100, createdAt: new Date(2020, 0, 1) });
    expect(invoice).toBeInstanceOf(Invoice);
    expect(invoice.id).toBe('1');
    expect(invoice.totalPrice).toBe(100);
  });

  it('from respects overrides', () => {
    const invoice = Invoice.from(
      { id: '1', customerName: 'ACME', totalPrice: 100, createdAt: new Date(2020, 0, 1) },
      { totalPrice: 120 }
    );
    expect(invoice.totalPrice).toBe(120);
  });

  it('fromArray maps collection', () => {
    const invoices = Invoice.fromArray([
      { id: '1', customerName: 'ACME', totalPrice: 100, createdAt: new Date(2020, 0, 1) },
      { id: '2', customerName: 'Globex', totalPrice: 200, createdAt: new Date(2020, 0, 2) },
    ]);
    expect(invoices).toHaveLength(2);
    expect(invoices[1]?.id).toBe('2');
  });

  it('fromArray supports override factory', () => {
    const invoices = Invoice.fromArray(
      [
        { id: '1', customerName: 'ACME', totalPrice: 100, createdAt: new Date(2020, 0, 1) },
        { id: '2', customerName: 'Globex', totalPrice: 200, createdAt: new Date(2020, 0, 2) },
      ],
      (_, index) => ({ status: index === 0 ? 'open' : 'closed' })
    );
    expect(invoices[0]?.status).toBe('open');
    expect(invoices[1]?.status).toBe('closed');
  });

  it('pick returns selected fields', () => {
    const invoice = Invoice.from({ id: '1', customerName: 'ACME', totalPrice: 100, createdAt: new Date(2020, 0, 1) });
    const summary = invoice.pick(['id', 'totalPrice']);
    expect(summary).toEqual({ id: '1', totalPrice: 100 });
  });

  it('omit drops specified fields', () => {
    const invoice = Invoice.from({ id: '1', customerName: 'ACME', totalPrice: 100, createdAt: new Date(2020, 0, 1) });
    const rest = invoice.omit(['status']);
    expect(rest).toMatchObject({ id: '1', customerName: 'ACME', totalPrice: 100, createdAt: new Date(2020, 0, 1) });
    expect(rest).not.toHaveProperty('status');
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

