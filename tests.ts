import { Schema } from "./schema_validator";

const TestSchema = new Schema({
    options: {
        allowPartial: false,
        allowExtensions: false
    },
    properties: {
        x: Schema.number(),
        y: Schema.number(),
        z: Schema.number().optional()
    }
});