import { Schema } from "../schema_validator";

const SingleTypeArraySchema = new Schema(Schema.array(Schema.number()));
console.log(SingleTypeArraySchema.check([1, 2, 3, 4, 5])); // Output: true
console.log(SingleTypeArraySchema.check([1, 2, 3, 4, "five"])); // Output: false

const MultiTypeArraySchema = new Schema(Schema.array(Schema.number(), Schema.string()));
console.log(MultiTypeArraySchema.check([1, 2, 3, 4, 5])); // Output: true
console.log(MultiTypeArraySchema.check([1, 2, 3, 4, "five"])); // Output: true