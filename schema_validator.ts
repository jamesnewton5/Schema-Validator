type CustomType = PrimitiveType | Schema | ObjectSchema | ArraySchema | TupleSchema | MapSchema | SetSchema | PrototypeSchema | SchemaPropertyExtended;
type PrimitiveType = "string" | "number" | "boolean" | "undefined" | "null" | "function" | "object" | "any";

interface SchemaProperty {
    require?: boolean;
    propertyType: CustomType | Array<CustomType>;
};
interface SchemaPropertyExtended extends SchemaProperty {
    optional: () => SchemaPropertyExtended;
};
type Class<T> = new (...args: any[]) => T
type PrototypeSchema = {
    objectPrototype: Class<Object>
};
type ArraySchema = {
    arrayOf: CustomType | Array<CustomType>;
};
type TupleSchema = {
    tupleOf: Array<CustomType | Array<CustomType>>;
};
type MapSchema = {
    mapOf: TupleSchema;
};
type SetSchema = {
    setOf: CustomType | Array<CustomType>;
};
type SchemaOptions = {
    allowPartial: boolean;
    allowExtensions: boolean;
};
type ObjectSchema = {
    options?: Partial<SchemaOptions>,
    properties: {
        [key: string]: SchemaProperty | Schema;
    }
};

type ValidatorFunction = (unknownVariable: unknown) => boolean;

const PROPERTY_DEFAULTS: SchemaOptions = {
    allowPartial: false,
    allowExtensions: false
};

export class Schema {
    public optional: () => SchemaProperty;
    check: <T>(unknownVariable: unknown) => unknownVariable is T;

    constructor(schemaSource: ObjectSchema | ArraySchema | TupleSchema | SchemaPropertyExtended) {
        // Allow schema to be used as a type:
        this.optional = () => {
            return {
                require: false,
                propertyType: this
            };
        }

        const validator = Util.getValidator(schemaSource);
        this.check = <T>(unknownVariable: unknown): unknownVariable is T => validator(unknownVariable);
    }

    private static extendSchemaProperty(customType: CustomType): SchemaPropertyExtended {
        const propertyType: SchemaPropertyExtended = {
            require: true,
            propertyType: customType,
            optional: function () { this.require = false; return propertyType; }
        };
        return propertyType;
    }

    public static string() {
        return this.extendSchemaProperty("string");
    }

    public static number() {
        return this.extendSchemaProperty("number");
    }

    public static boolean() {
        return this.extendSchemaProperty("boolean");
    }

    public static undefined() {
        return this.extendSchemaProperty("undefined");
    }

    public static null() {
        return this.extendSchemaProperty("null");
    }

    public static function() {
        return this.extendSchemaProperty("function");
    }

    public static any() {
        return this.extendSchemaProperty("any");
    }

    public static objectPrototype(object: PrototypeSchema["objectPrototype"]) {
        return this.extendSchemaProperty({ objectPrototype: object });
    }

    public static arrayFromMap(keyType: CustomType, propertyType: CustomType | Array<CustomType>) {
        return this.extendSchemaProperty({
            arrayOf: {
                tupleOf: [keyType, propertyType]
            }
        });
    }

    public static array(...args: Array<CustomType>) {
        if (args.length === 1) {
            return this.extendSchemaProperty({ arrayOf: args[0] });
        } else {
            return this.extendSchemaProperty({ arrayOf: args });
        }
    }

    public static tuple(...args: Array<CustomType | Array<CustomType>>) {
        return this.extendSchemaProperty({ tupleOf: args });
    }

    public static map(keyType: CustomType | Array<CustomType>, propertyType: CustomType | Array<CustomType>) {
        return this.extendSchemaProperty({
            mapOf: {
                tupleOf: [keyType, propertyType]
            }
        });
    }

    public static set(...args: Array<CustomType>) {
        if (args.length === 1) {
            return this.extendSchemaProperty({ setOf: args[0] });
        } else {
            return this.extendSchemaProperty({ setOf: args });
        }
    }
}

const Util = {
    isPrimitive: (customType: CustomType): customType is PrimitiveType => {
        return (typeof customType === "string");
    },
    isArraySchema: (customType: CustomType): customType is ArraySchema => {
        if (typeof customType === "string") return false;
        return "arrayOf" in customType;
    },
    isTupleSchema: (customType: CustomType): customType is TupleSchema => {
        if (typeof customType === "string") return false;
        return "tupleOf" in customType;
    },
    isMapSchema: (customType: CustomType): customType is MapSchema => {
        if (typeof customType === "string") return false;
        return "mapOf" in customType;
    },
    isSetSchema: (customType: CustomType): customType is SetSchema => {
        if (typeof customType === "string") return false;
        return "setOf" in customType;
    },
    isObjectSchema: (customType: CustomType): customType is ObjectSchema => {
        if (typeof customType === "string") return false;
        return "properties" in customType;
    },
    isPrototypeSchema: (customType: CustomType): customType is PrototypeSchema => {
        if (typeof customType === "string") return false;
        return "objectPrototype" in customType;
    },
    isSchemaProperty: (customType: CustomType): customType is SchemaPropertyExtended => {
        if (typeof customType === "string") return false;
        return "propertyType" in customType;
    },
    primitiveValidator: (unknownVariable: unknown, primitiveType: PrimitiveType): boolean => {
        if (primitiveType === "null") return (unknownVariable === null);
        return (typeof unknownVariable === primitiveType);
    },
    getOptions: (objectSchema: ObjectSchema): SchemaOptions => {
        const options = objectSchema.options;
        if (options === undefined) {
            return PROPERTY_DEFAULTS;
        } else {
            options.allowPartial = options.allowPartial ?? PROPERTY_DEFAULTS.allowPartial;
            options.allowExtensions = options.allowExtensions ?? PROPERTY_DEFAULTS.allowExtensions;
        }
        return options as SchemaOptions;
    },
    getMultiTypeValidator: (customTypeArray: Array<CustomType>): ValidatorFunction => {
        const validators: Array<ValidatorFunction> = [];
        for (const singleCustomType of customTypeArray) {
            validators.push(Util.getValidator(singleCustomType));
        }
        return (unknownVariable) => {
            let isValid = false;
            for (const validator of validators) {
                if (!validator(unknownVariable)) continue;
                isValid = true;
                break;
            }
            return isValid;
        }
    },
    getValidator: (customType: CustomType | Array<CustomType>): ValidatorFunction => {
        if (Array.isArray(customType)) {
            return Util.getMultiTypeValidator(customType);
        }

        if (Util.isPrimitive(customType)) {
            if (customType !== "any") {
                const validator = Util.primitiveValidator;
                return (unknownVariable) => validator(unknownVariable, customType);
            } else {
                return () => true;
            }
        }

        let validator: ValidatorFunction;
        if (customType instanceof Schema) {
            validator = customType.check;
        } else if (Util.isSchemaProperty(customType)) {
            const validator = Util.getValidator(customType.propertyType);
            return (unknownVariable) => validator(unknownVariable);
        } else if (Util.isArraySchema(customType)) {
            validator = Util.getArrayValidator(customType);
        } else if (Util.isTupleSchema(customType)) {
            validator = Util.getTupleValidator(customType);
        } else if (Util.isMapSchema(customType)) {
            validator = Util.getMapValidator(customType);
        } else if (Util.isSetSchema(customType)) {
            validator = Util.getSetValidator(customType);
        } else if (Util.isObjectSchema(customType)) {
            validator = Util.getObjectValidator(customType);
        } else if (Util.isPrototypeSchema(customType)) {
            validator = Util.getPrototypeValidator(customType);
        } else {
            throw new Error("Could not get validator function");
        }
        return validator;
    },
    getArrayValidator: (arraySchema: ArraySchema): ValidatorFunction => {
        const arrayOf = arraySchema.arrayOf;
        const validator = Util.getValidator(arrayOf);
        return (unknownVariable) => {
            if (!Array.isArray(unknownVariable)) return false;
            for (const unknownValue of unknownVariable) {
                if (!validator(unknownValue)) return false;
            }
            return true;
        }
    },
    getTupleValidator: (tupleSchema: TupleSchema): ValidatorFunction => {
        const tupleOf = tupleSchema.tupleOf;
        const length = tupleOf.length;
        const validators: Array<ValidatorFunction> = [];

        let allPropertiesRequired = true;
        let lastOptionalVariableIndex = tupleOf.length;

        for (let i = tupleOf.length - 1; i >= 0; i--) {
            const customType = tupleOf[i];
            validators.unshift(Util.getValidator(customType));
            if (typeof customType === "string") continue;
            if (!("require" in customType)) continue;
            if (customType.require !== false) continue;
            allPropertiesRequired = false;
            if (lastOptionalVariableIndex - i > 1) throw new Error("Failed to create tuple - optional variables must be placed after required variables");
            lastOptionalVariableIndex = i;
        }

        return (unknownVariable) => {
            if (!Array.isArray(unknownVariable)) return false;
            const unknownVariableLength = unknownVariable.length;
            if (allPropertiesRequired && unknownVariableLength !== length) return false;
            else if (unknownVariableLength < lastOptionalVariableIndex) return false;

            // Use the length property here so the JS engine can optimise and avoid the array bounds check each loop:
            for (let i = 0; i < unknownVariable.length; i++) {
                const validator = validators[i];
                if (i >= lastOptionalVariableIndex && i >= unknownVariableLength) {
                    // All variables from now on are optional, and none are present
                    return true;
                }
                if (!validator(unknownVariable[i])) return false;
            }
            return true;
        }
    },
    getMapValidator: (mapSchema: MapSchema): ValidatorFunction => {
        const tupleOf = mapSchema.mapOf.tupleOf;
        const keyValidator = Util.getValidator(tupleOf[0]);
        const valueValidator = Util.getValidator(tupleOf[1]);
        return (unknownVariable) => {
            if (!(unknownVariable instanceof Map)) return false;
            for (const [unknownKey, unknownValue] of unknownVariable) {
                if (!keyValidator(unknownKey)) return false;
                if (!valueValidator(unknownValue)) return false;
            }
            return true;
        }
    },
    getSetValidator: (setSchema: SetSchema): ValidatorFunction => {
        const setOf = setSchema.setOf;
        const validator = Util.getValidator(setOf);
        return (unknownVariable) => {
            if (!(unknownVariable instanceof Set)) return false;
            for (const unknownValue of unknownVariable) {
                if (!validator(unknownValue)) return false;
            }
            return true;
        }
    },
    getObjectValidator: (objectSchema: ObjectSchema): ValidatorFunction => {
        const properties = objectSchema.properties;
        const propertyKeySet: Set<string> = new Set(Object.keys(properties))
        const propertyValidatorSubArrays: Array<[keyof typeof properties, ValidatorFunction, boolean]> = [];

        const { allowPartial, allowExtensions } = Util.getOptions(objectSchema);
        let allPropertiesRequired = !allowPartial;

        for (const subArray of Object.entries(properties)) {
            const schemaProperty = subArray[1];
            let require: boolean;
            let validator: ValidatorFunction;
            if (schemaProperty instanceof Schema) {
                validator = schemaProperty.check;
                require = true;
            } else {
                validator = Util.getValidator(schemaProperty.propertyType);
                require = schemaProperty.require ?? true;
                if (!require) allPropertiesRequired = false;
            }
            propertyValidatorSubArrays.push([subArray[0], validator, require]);
        }

        return (unknownVariable) => {
            if (typeof unknownVariable !== "object" || unknownVariable === null) return false;

            let allPropertiesPresent = true;
            for (const subArray of propertyValidatorSubArrays) {
                const [propertyKey, validator, require] = subArray;
                // Object does not contain key: 
                if (!(propertyKey in unknownVariable)) {
                    if (require === true && !allowPartial) return false;
                    allPropertiesPresent = false;
                    continue;
                }
                // Object contains key, validate property
                const unknownValue = unknownVariable[(propertyKey as keyof typeof unknownVariable)];
                if (!(validator(unknownValue))) return false;
            }

            // Don't need to verify no extra properties exist:
            if (allowExtensions) return true;

            // All properties already validated
            if (allPropertiesRequired || allPropertiesPresent) return (Object.keys(unknownVariable).length === propertyKeySet.size);

            // Check for extra properties
            for (const key of Object.keys(unknownVariable)) {
                if (!propertyKeySet.has(key)) return false;
            }
            return true;
        }
    },
    getPrototypeValidator: (prototypeSchema: PrototypeSchema): ValidatorFunction => {
        const objectPrototype = prototypeSchema.objectPrototype;
        return (unknownVariable) => {
            if (typeof unknownVariable !== "object" || unknownVariable === null) return false;
            return (unknownVariable instanceof objectPrototype);
        }
    }
}
