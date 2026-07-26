import { Schema } from "../schema_validator";

type Tuple = [string, number, number?];
const TupleSchema = Schema.create(Schema.tuple(
    Schema.string(),
    Schema.number(),
    Schema.number().optional()
));

console.log(TupleSchema.validate<Tuple>(["abc", 123, 123])); // Output: true
console.log(TupleSchema.validate<Tuple>(["abc", 123])); // Output: true
console.log(TupleSchema.validate<Tuple>(["abc", 123, "abc"])); // Output: false
console.log(TupleSchema.validate<Tuple>(["abc"])); // Output: false

