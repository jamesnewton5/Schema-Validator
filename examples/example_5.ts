import { Schema } from "../schema_validator";

const ObjectSchema = Schema.create({
    properties: {
        map: Schema.objectPrototype(Map)
    }
});

const array: Array<[string, number]> = [["abc", 123]];

console.log(ObjectSchema.check({
    map: new Map(array)
})); // Output: true

console.log(ObjectSchema.check({
    map: new Set(array)
})); // Output: false

console.log(ObjectSchema.check({
    map: array
})); // Output: false