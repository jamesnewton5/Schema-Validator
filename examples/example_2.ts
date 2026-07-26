import { Schema } from "../schema_validator";

type SingleTypeArray = Array<number>;
type MultiTypeArray = Array<number | string>;

const SingleTypeArraySchema = Schema.create(Schema.array(Schema.number()));
const MultiTypeArraySchema = Schema.create(Schema.array(Schema.number(), Schema.string()));

console.log(SingleTypeArraySchema.validate<SingleTypeArray>([1, 2, 3, 4, 5])); // Output: true
console.log(SingleTypeArraySchema.validate<SingleTypeArray>([1, 2, 3, 4, "five"])); // Output: false

console.log(MultiTypeArraySchema.validate<MultiTypeArray>([1, 2, 3, 4, 5])); // Output: true
console.log(MultiTypeArraySchema.validate<MultiTypeArray>([1, 2, 3, 4, "five"])); // Output: true