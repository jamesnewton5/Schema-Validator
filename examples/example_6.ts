import { Schema } from "../schema_validator";

type Tuple = [string, number, number?];
const TupleSchema = new Schema(Schema.tuple(
    Schema.string(),
    Schema.number(),
    Schema.number().optional()
));

console.log(TupleSchema.check<Tuple>(["abc", 123, 123])); // Output: true
console.log(TupleSchema.check<Tuple>(["abc", 123])); // Output: true
console.log(TupleSchema.check<Tuple>(["abc", 123, "abc"])); // Output: false
console.log(TupleSchema.check<Tuple>(["abc"])); // Output: false

