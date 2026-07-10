import { Schema } from "../schema_validator";

type SingleTypeArray = Array<number>;
type MultiTypeArray = Array<number | string>;

const SingleTypeArraySchema = new Schema(Schema.array(Schema.number()));
const MultiTypeArraySchema = new Schema(Schema.array(Schema.number(), Schema.string()));

console.log(SingleTypeArraySchema.check<SingleTypeArray>([1, 2, 3, 4, 5])); // Output: true
console.log(SingleTypeArraySchema.check<SingleTypeArray>([1, 2, 3, 4, "five"])); // Output: false

console.log(MultiTypeArraySchema.check<MultiTypeArray>([1, 2, 3, 4, 5])); // Output: true
console.log(MultiTypeArraySchema.check<MultiTypeArray>([1, 2, 3, 4, "five"])); // Output: true