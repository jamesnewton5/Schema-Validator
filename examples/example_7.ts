import { Schema } from "../schema_validator";

type NumberStringSet = Set<number | string>;

// Comma separated parameters for creating array and set schemas:
const SetSchema = new Schema(Schema.set(Schema.number(), Schema.string()));
const testSet = new Set([1, 2, 3, 4, "five"]);
console.log(SetSchema.check<NumberStringSet>(testSet)); // Output: true



// Single type allowed for map key,
// array of types for map values:
const MapSchema = new Schema(Schema.map(
    Schema.string(),
    [Schema.number(), Schema.string()]
));

const testArray: Array<[string, number | string]> = [
    ["key1", 1],
    ["key2", "string"]
];
const testMap = new Map(testArray);
console.log(MapSchema.check(testMap)); // Output: true



// Single type allowed for map key,
// any type allowed for map values:
const MapSchema2 = new Schema(Schema.map(
    Schema.string(),
    Schema.any()
));

const testArray2: Array<[string | number, any]> = [
    ["key1", new Date()],
    ["key2", undefined]
];
const testMap2 = new Map(testArray2);
console.log(MapSchema2.check(testMap2)); // Output: true


