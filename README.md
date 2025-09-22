## ts-data-class

TypeScript data class library inspired by Kotlin `data class` and Python `@dataclass`.

### Quick Start

```ts
import { DataClass } from 'ts-data-class';

class User extends DataClass {
  name!: string = 'Anon';
  age!: number = 0;
  email?: string;
}

const u1 = User.create({ name: 'Alice', age: 30 });
const u2 = u1.copy({ age: 31 });
u1.equals(u2); // false
u2.toJSON(); // { name: 'Alice', age: 31 }
u2.hashCode(); // stable number
```

See `docs/` for full API and design notes.


