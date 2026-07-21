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

            const TupleSchema = Schema.tuple(
                Schema.string(),
                Vector3Schema.default({ x: 0, y: 0, z: -1 })
            );

            const input1 = ["abc", undefined];
            const input2 = ["abc"];

            const outputArray = [];
            outputArray.push(TupleSchema.check(input1)); // Output: true
            outputArray.push(JSON.stringify(input1)); // Output: ["abc",{"x":0,"y":0,"z":-1}]

            outputArray.push(TupleSchema.check(input2)); // Output: false
            outputArray.push(JSON.stringify(input2)); // Output: ["abc"]

            return outputArray.join(", ");
        },
        expectedResult: `true, ["abc",{"x":0,"y":0,"z":-1}], false, ["abc"]`
    },
    {
        callback: () => {
            const TestSchema = Schema.create({
                properties: {
                    key: Schema.string()
                }
            });

            const TupleSchema = Schema.tuple(
                TestSchema.default({ key: "Hello :)" }),
            );

            const input1 = ["abc"];
            const input2 = ["abc"];

            const outputArray = [];

            TupleSchema.check(input1);
            TupleSchema.check(input2);

            (input1[0] as any).key = "Changed"

            outputArray.push(JSON.stringify(input1)); // Output: ["Changed"]
            outputArray.push(JSON.stringify(input2)); // Output: ["Hello :)"]

            return outputArray.join(", ");
        },
        expectedResult: `[{"key":"Changed"}], [{"key":"Hello :)"}]`
    }
]