### Design Notes

- No runtime decorators or reflect metadata required for core path.
- Stable stringify used for `toString`, `hashCode` and consistent `toJSON` key order.
- Minimal surface for tree-shaking; single entry `src/index.ts`.
- Instances are `Object.seal`ed to discourage accidental shape changes after creation.


