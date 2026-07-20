import { Schema } from "../schema_validator";

type TestCase = {
    callback: () => any,
    expectedResult: any
};
export const testCases: Array<TestCase> = [
    {
        callback: () => {
            type Vector3 = { x: number, y: number, z: number };
            const Vector3Schema = Schema.create({
                properties: {
                    x: Schema.number(),
                    y: Schema.number(),
                    z: Schema.number()
                }
            });

            const jsonString = '{"x": 0, "y": 0, "z": 0}';
            const testData = JSON.parse(jsonString) as unknown;
            const vectorValues = getVectorValues(testData);
            return vectorValues;

            function getVectorValues(vector3: unknown): string | null {
                const isVector3 = Vector3Schema.check<Vector3>(vector3);
                if (!isVector3) return null;
                return Object.values(vector3).join(", ");
            }
        },
        expectedResult: "0, 0, 0"
    },
    {
        callback: () => {
            type SingleTypeArray = Array<number>;
            type MultiTypeArray = Array<number | string>;

            const SingleTypeArraySchema = Schema.create(Schema.array(Schema.number()));
            const MultiTypeArraySchema = Schema.create(Schema.array(Schema.number(), Schema.string()));

            const outputArray = [];

            outputArray.push(SingleTypeArraySchema.check<SingleTypeArray>([1, 2, 3, 4, 5])); // Output: true
            outputArray.push(SingleTypeArraySchema.check<SingleTypeArray>([1, 2, 3, 4, "five"])); // Output: false

            outputArray.push(MultiTypeArraySchema.check<MultiTypeArray>([1, 2, 3, 4, 5])); // Output: true
            outputArray.push(MultiTypeArraySchema.check<MultiTypeArray>([1, 2, 3, 4, "five"])); // Output: true

            return outputArray.join(", ");
        },
        expectedResult: "true, false, true, true"
    },
    {
        callback: () => {
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

            const outputArray = [];
            outputArray.push(TupleSchema.check(["abc", { x: 0, y: 0, z: 0 }])); // Output: true
            outputArray.push(TupleSchema.check(["def", { x: 0, y: 0, z: "zero" }])); // Output: false
            outputArray.push(TupleSchema.check([{ x: 0, y: 0, z: 0 }, "abc"])); // Output: false
            return outputArray.join(", ");
        },
        expectedResult: "true, false, false"
    }
]