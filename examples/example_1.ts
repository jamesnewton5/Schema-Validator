import { Schema } from "../schema_validator";

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
outputVector3(testData);

function outputVector3(vector3: unknown) {
    const isVector3 = Vector3Schema.check<Vector3>(vector3);
    if (!isVector3) return;
    console.log(vector3.x, vector3.y, vector3.z); // <--- No error
}