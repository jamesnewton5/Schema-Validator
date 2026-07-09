import { Schema } from "../schema_validator";

const Vector3Schema = new Schema({
    properties: {
        x: Schema.number(),
        y: Schema.number(),
        z: Schema.number()
    }
});

const TupleSchema = new Schema(Schema.tuple(
    Schema.string(),
    Vector3Schema
));

console.log(TupleSchema.check([
    ["abc", { x: 0, y: 0, z: 0 }],
    ["def", { x: 0, y: 0, z: 0 }]
])); // Output: true

console.log(TupleSchema.check([
    ["abc", { x: 0, y: 0, z: 0 }],
    ["def", { x: 0, y: 0, z: "zero" }]
])); // Output: false

console.log(TupleSchema.check([
    [{ x: 0, y: 0, z: 0 }, "abc"],
    ["def", { x: 0, y: 0, z: 0 }]
])); // Output: false