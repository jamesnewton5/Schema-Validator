import { Schema } from "../schema_validator";

type TestCase = {
    callback: () => any,
    expectedResult: any
};
export const testCases: Array<TestCase> = [
    {
        callback: () => {
            type UserDataV1 = {
                username: string;
                unhashedPassword: string;
            };

            type UserDataV2 = {
                username: string;
                hashedPassword: string;
            };

            const UserDataSchema = Schema.create({
                properties: {
                    username: Schema.string(),
                    unhashedPassword: Schema.expression((unknownVariable, object, propertyKey) => {
                        const unhashedPassword = object.unhashedPassword;
                        if (typeof unhashedPassword !== "string") return false;
                        delete object["unhashedPassword"];
                        object.hashedPassword = "(Example)";
                        return true;
                    }),
                    hashedPassword: Schema.string(),
                }
            });



            function updateUserData(userData: UserDataV1 | UserDataV2): userData is UserDataV2 {
                UserDataSchema.validate(userData);
                return true;
            }

            const exampleData = {
                username: "john",
                unhashedPassword: "password123"
            };

            updateUserData(exampleData);

            return JSON.stringify(exampleData);
        },
        expectedResult: `{"username":"john","hashedPassword":"(Example)"}`
    },
    {
        callback: () => {
            type UserDataV1 = {
                id: string;
                displayName: string;
                loginCount: number;
            };

            type UserDataV2 = {
                id: string;
                displayName: string;
                lastLoginTime: number;
            };

            const UserDataSchema = Schema.create({
                properties: {
                    id: Schema.string(),
                    displayName: Schema.string(),
                    loginCount: Schema.remove(),
                    lastLoginTime: Schema.number().default(0)
                }
            });

            function updateUserData(userData: UserDataV1 | UserDataV2): userData is UserDataV2 {
                UserDataSchema.validate(userData);
                return true;
            }

            const exampleData = {
                id: "12345",
                displayName: "John",
                loginCount: 1
            };

            updateUserData(exampleData);

            return JSON.stringify(exampleData);
        },
        expectedResult: `{"id":"12345","displayName":"John","lastLoginTime":0}`
    },
    {
        callback: () => {
            const ArraySchema = Schema.array("number");
            return ArraySchema.validate([1, 2, 3, 4, 5])
        },
        expectedResult: true
    },
    {
        callback: () => {
            const ArraySchema = Schema.array("number");
            return ArraySchema.validate([1, 2, false, 4, 5])
        },
        expectedResult: false
    },
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
                const isVector3 = Vector3Schema.validate<Vector3>(vector3);
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

            const SingleTypeArraySchema = Schema.array(Schema.number());
            const MultiTypeArraySchema = Schema.array(Schema.union(Schema.number(), Schema.string()));

            const outputArray = [];

            outputArray.push(SingleTypeArraySchema.validate<SingleTypeArray>([1, 2, 3, 4, 5])); // Output: true
            outputArray.push(SingleTypeArraySchema.validate<SingleTypeArray>([1, 2, 3, 4, "five"])); // Output: false

            outputArray.push(MultiTypeArraySchema.validate<MultiTypeArray>([1, 2, 3, 4, 5])); // Output: true
            outputArray.push(MultiTypeArraySchema.validate<MultiTypeArray>([1, 2, 3, 4, "five"])); // Output: true

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
            outputArray.push(TupleSchema.validate(["abc", { x: 0, y: 0, z: 0 }])); // Output: true
            outputArray.push(TupleSchema.validate(["def", { x: 0, y: 0, z: "zero" }])); // Output: false
            outputArray.push(TupleSchema.validate([{ x: 0, y: 0, z: 0 }, "abc"])); // Output: false
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
            outputArray.push(TupleSchema.validate(input1)); // Output: true
            outputArray.push(JSON.stringify(input1)); // Output: ["abc",{"x":0,"y":0,"z":-1}]

            outputArray.push(TupleSchema.validate(input2)); // Output: false
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

            TupleSchema.validate(input1);
            TupleSchema.validate(input2);

            (input1[0] as any).key = "Changed"

            outputArray.push(JSON.stringify(input1)); // Output: ["Changed"]
            outputArray.push(JSON.stringify(input2)); // Output: ["Hello :)"]

            return outputArray.join(", ");
        },
        expectedResult: `[{"key":"Changed"}], [{"key":"Hello :)"}]`
    },
    {
        callback: () => {
            const TestSchema = Schema.create({
                properties: {
                    number: Schema.expression((u: unknown) => (u === 5))
                }
            });

            const outputArray = [];
            outputArray.push(TestSchema.validate({
                number: 5
            }));
            outputArray.push(TestSchema.validate({
                number: 6
            }));
            return outputArray.join(", ");
        },
        expectedResult: `true, false`
    },
    {
        callback: () => {
            const TestSchema = Schema.create({
                properties: {
                    number: Schema.expression((u: unknown) => (u === 5)).default(5)
                }
            });

            const testData = {
                number: 6
            };

            return `${TestSchema.validate(testData)}, ${JSON.stringify(testData)}`
        },
        expectedResult: `true, {"number":5}`
    },
    {
        callback: () => {
            const TestSchema = Schema.array(Schema.number().default(1));

            const testData = [0, 0, 0, undefined, 0];

            return `${TestSchema.validate(testData)}, ${JSON.stringify(testData)}`
        },
        expectedResult: `true, [0,0,0,1,0]`
    },
    {
        callback: () => {
            const TestSchema = Schema.array(Schema.union(Schema.number(), Schema.string()).default(1));

            const testData = [0, 0, 0, undefined, 0, "string"];

            return `${TestSchema.validate(testData)}, ${JSON.stringify(testData)}`
        },
        expectedResult: `true, [0,0,0,1,0,"string"]`
    }
]