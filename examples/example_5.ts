import { Schema } from "../schema_validator";

const ObjectSchema = Schema.create({
    properties: {
        map: Schema.objectPrototype(Map)
    }
});

const array: Array<[string, number]> = [["abc", 123]];

console.log(ObjectSchema.validate({
    map: new Map(array)
})); // Output: true

console.log(ObjectSchema.validate({
    map: new Set(array)
})); // Output: false

console.log(ObjectSchema.validate({
    map: array
})); // Output: false