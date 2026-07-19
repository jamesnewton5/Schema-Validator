type CustomType = PrimitiveType | Schema | ObjectSchema | ArraySchema | TupleSchema | MapSchema | SetSchema | PrototypeSchema | SchemaProperty;
type PrimitiveType = "string" | "number" | "boolean" | "undefined" | "null" | "object" | "any";

interface SchemaProperty {
    require: boolean;
    propertyType: CustomType | Array<CustomType>;
    defaultValue: undefined;
    optional: () => SchemaProperty;
    default: (defaultValue: any) => SchemaProperty;
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
type ObjectSchemaOptions = {
    allowPartial: boolean;
    allowExtensions: boolean;
};
type ObjectSchema = {
    options?: Partial<ObjectSchemaOptions>,
    properties: {
        [key: string]: SchemaProperty | Schema;
    }
};

type ValidatorFunction = <T>(unknownVariable: unknown, object?: Record<string | number, any>, propertyKey?: string | number) => boolean;

const PROPERTY_DEFAULTS: ObjectSchemaOptions = {
    allowPartial: false,
    allowExtensions: false
};
const DEFAULT_VALUE_PLACEHOLDER = Symbol();
export class Schema {
    public optional() { return {} as SchemaProperty };
    public default(defaultValue: any) { return {} as SchemaProperty };;

    check: <T>(unknownVariable: unknown) => unknownVariable is T;

    constructor(schemaSource: CustomType) {
        let schemaProperty: Partial<SchemaProperty> = {};

        const validator = Util.getValidator(schemaSource);
        this.check = <T>(unknownVariable: unknown): unknownVariable is T => {
            const isValid = validator(unknownVariable);
            return isValid;
        }

        Object.assign(schemaProperty, {
            require: true,
            propertyType: undefined,
            defaultValue: DEFAULT_VALUE_PLACEHOLDER,
            optional: function () {
                // Optional and default variables are for schemas as object properties, remove the check method
                this.check = undefined as unknown as ValidatorFunction;
                const schemaPropertyClone = { ...this };
                schemaPropertyClone.require = false;
                return schemaPropertyClone as unknown as SchemaProperty;
            },
            default: function (defaultValue: any) {
                // Optional and default variables are for schemas as object properties, remove the check method
                this.check = undefined as unknown as ValidatorFunction;
                const schemaPropertyClone = { ...this };
                schemaPropertyClone.defaultValue = defaultValue;
                return schemaPropertyClone as unknown as SchemaProperty;
            },
            check: validator
        });
        schemaProperty.propertyType = this;


        return schemaProperty as Schema
    }

    public static string() {
        return new Schema("string");
    }

    public static number() {
        return new Schema("number");
    }

    public static boolean() {
        return new Schema("boolean");
    }

    public static undefined() {
        return new Schema("undefined");
    }

    public static null() {
        return new Schema("null");
    }

    public static any() {
        return new Schema("any");
    }

    public static objectPrototype(object: PrototypeSchema["objectPrototype"]) {
        return new Schema({ objectPrototype: object });
    }

    public static arrayFromMap(keyType: CustomType, propertyType: CustomType | Array<CustomType>) {
        return new Schema({
            arrayOf: {
                tupleOf: [keyType, propertyType]
            }
        });
    }

    public static array(...args: Array<CustomType>) {
        if (args.length === 1) {
            return new Schema({ arrayOf: args[0] });
        } else {
            return new Schema({ arrayOf: args });
        }
    }

    public static tuple(...args: Array<CustomType | Array<CustomType>>) {
        return new Schema({ tupleOf: args });
    }

    public static map(keyType: CustomType | Array<CustomType>, propertyType: CustomType | Array<CustomType>) {
        return new Schema({
            mapOf: {
                tupleOf: [keyType, propertyType]
            }
        });
    }

    public static set(...args: Array<CustomType>) {
        if (args.length === 1) {
            return new Schema({ setOf: args[0] });
        } else {
            return new Schema({ setOf: args });
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
    isSchemaProperty: (customType: CustomType): customType is SchemaProperty => {
        if (typeof customType === "string") return false;
        return "propertyType" in customType;
    },
    getOptions: (objectSchema: ObjectSchema): ObjectSchemaOptions => {
        const options = objectSchema.options;
        if (options === undefined) {
            return PROPERTY_DEFAULTS;
        } else {
            options.allowPartial = options.allowPartial ?? PROPERTY_DEFAULTS.allowPartial;
            options.allowExtensions = options.allowExtensions ?? PROPERTY_DEFAULTS.allowExtensions;
        }
        return options as ObjectSchemaOptions;
    },
    getMultiTypeValidator: (customTypeArray: Array<CustomType>): ValidatorFunction => {
        const validators: Array<ValidatorFunction> = [];
        for (const singleCustomType of customTypeArray) {
            validators.push(Util.getValidator(singleCustomType));
        }
        if (validators.length === 0) return () => false;
        return (unknownVariable) => {
            for (const validator of validators) {
                if (!validator(unknownVariable)) continue;
                return true;
            }
            return false;
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
    primitiveValidator: (unknownVariable: unknown, primitiveType: PrimitiveType): boolean => {
        if (primitiveType === "null") return (unknownVariable === null);
        return (typeof unknownVariable === primitiveType);
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
                const isValidFn = Util.getValidator(schemaProperty);
                const defaultValue = schemaProperty.defaultValue;
                if (defaultValue === DEFAULT_VALUE_PLACEHOLDER) {
                    validator = isValidFn;
                } else {
                    validator = ((unknownVariable: unknown, object: Record<string | number, any>, propertyKey: string | number) => {
                        const isValid = isValidFn(unknownVariable);
                        if (isValid) return true;
                        object[propertyKey] = defaultValue;
                        return true;
                    }) as ValidatorFunction;
                }
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
                    if (require === true && !allowPartial) {
                        if (!(validator(Symbol(), unknownVariable, propertyKey))) return false;

                    }
                    allPropertiesPresent = false;
                    continue;
                }
                // Object contains key, validate property
                const unknownValue = unknownVariable[(propertyKey as keyof typeof unknownVariable)];
                if (!(validator(unknownValue, unknownVariable, propertyKey))) return false;
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