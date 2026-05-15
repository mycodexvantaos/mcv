# knowledge-graph/relations/relation-types.md

# 10.2 — Graph relation type definitions

| Relation              | Direction                    | Description                                         |
| --------------------- | ---------------------------- | --------------------------------------------------- |
| `DEPENDS_ON`          | Service → Capability/Service | Service A depends on capability or service B        |
| `IMPLEMENTS`          | Service → Capability         | Service implements a canonical capability           |
| `PROVIDES_CAPABILITY` | Provider → Capability        | Provider instance provides a canonical capability   |
| `HAS_VECTOR_INDEX`    | Service → VectorCollection   | Service owns a vector collection                    |
| `GOVERNED_BY`         | Resource → Policy            | Resource is governed by a naming or platform policy |
| `REPLACED_BY`         | Resource → Resource          | Deprecated resource points to its replacement       |
| `AUDITED_BY`          | Resource → AuditLog          | Resource is subject to an audit record              |

> **Rule (10.2):** Relation names use UPPER_SNAKE_CASE and are graph-internal only.
> They MUST NOT be used as canonical identifiers or composite identifiers.
