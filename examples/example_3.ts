import { Schema } from "../schema_validator";

const Vector3Schema = Schema.create({
    properties: {
        x: Schema.number(),
        y: Schema.number(),
        z: Schema.number()
    }
});

const TupleSchema = Schema.create(Schema.tuple(
    Schema.string(),
    Vector3Schema
));

console.log(TupleSchema.validate(["abc", { x: 0, y: 0, z: 0 }])); // Output: true

console.log(TupleSchema.validate(["def", { x: 0, y: 0, z: "zero" }])); // Output: false

console.log(TupleSchema.validate([{ x: 0, y: 0, z: 0 }, "abc"])); // Output: false