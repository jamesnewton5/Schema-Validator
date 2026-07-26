import { Schema } from "../schema_validator";

type TestObjectType = {
    x: number,
    y: number,
    z: number,
    otherData: boolean | null
};

const TestSchema = Schema.create({
    options: {
        allowPartial: false,
        allowExtensions: false
    },
    properties: {
        x: Schema.number(),
        y: Schema.number(),
        z: Schema.number(),
        unwantedData: Schema.none().default(Schema.KEYWORD.delete).optional(),
        otherData: Schema.union(Schema.string(), Schema.null()).default(null)
    }
});

const testData = {
    x: 0,
    y: 0,
    z: -1,
    unwantedData: "Hello :)"
} as unknown;

outputObject(testData);

function outputObject(object: unknown) {
    const isValid = TestSchema.validate<TestObjectType>(object);
    if (!isValid) return;

    // Output: 0 0 -1 null
    console.log(...Object.values(object));
}