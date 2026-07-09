import type { CustomType } from "./schema_validator";

export class Util {
    public static validateMultiTypeArray(unknownVariable: unknown, typeArray: Array<CustomType>): boolean {
        if (!Array.isArray(unknownVariable)) return false;
        for (const unknownValue of unknownVariable) {
            let typeIsValid = false;
            for (const customType of typeArray) {
                if (!Schema.validateType(unknownValue, customType)) continue;
                typeIsValid = true;
                break;
            }
            if (!typeIsValid) return false;
        }
        return true;
    }

    private static validateSingleTypeArray(unknownVariable: unknown, customType: CustomType): boolean {
        if (!Array.isArray(unknownVariable)) return false;
        for (const unknownValue of unknownVariable) {
            if (Schema.validateType(unknownValue, customType)) continue;
            return false;
        }
        return true;
    }

    private static isArraySchema(customType: CustomType): customType is ArraySchema {
        if (typeof customType === "string") return false;
        return "arrayOf" in customType;
    }
}