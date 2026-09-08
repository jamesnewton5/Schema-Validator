type SchemaSource = PrimitiveType | Schema | ObjectSchema | ArraySchema | TupleSchema | MapSchema | SetSchema | PrototypeSchema | SchemaExtended | ExpressionFunction;
type PrimitiveType = "string" | "number" | "boolean" | "undefined" | "null" | "object" | "any" | "none" | "expression";

export interface SchemaExtended<Type = any> {
    require: boolean;
    source: SchemaSource | Array<SchemaSource>;
    [DEFAULT_VALUE_KEY]: Type;
    optional: () => SchemaExtended<Type>;
    default: (defaultValue: Type | typeof Schema.KEYWORD[keyof typeof Schema.KEYWORD]) => SchemaExtended<Type>;
    validate: ValidateFunction;
};

type SchemaSourceValue<Source extends SchemaSource> =
    Source extends "string" ? string :
    Source extends "number" ? number :
    Source extends "boolean" ? boolean :
    Source extends "undefined" ? undefined :
    Source extends "null" ? null :
    Source extends "object" ? object :
    Source extends "any" ? any :
    Source extends "none" ? never :
    Source extends "expression" ? Function :
    any;
type SchemaValue<Schema extends SchemaExtended> =
    Schema[typeof DEFAULT_VALUE_KEY];



type Class<T> = new (...args: any[]) => T
type PrototypeSchema = {
    objectPrototype: Class<Object>
};
type ArraySchema = {
    arrayOf: SchemaSource | Array<SchemaSource>;
};
type TupleSchema = {
    tupleOf: Array<SchemaSource | Array<SchemaSource>>;
};
type MapSchema = {
    mapOf: TupleSchema;
};
type SetSchema = {
    setOf: SchemaSource | Array<SchemaSource>;
};
type ObjectSchemaOptions = {
    allowPartial: boolean;
    allowExtensions: boolean;
};
type ObjectSchema = {
    options?: Partial<ObjectSchemaOptions>,
    properties: {
        [key: string]: SchemaExtended | Array<SchemaExtended> | Schema | Array<Schema>;
    }
};

type ValidateFunction = <T>(unknownVariable: unknown) => unknownVariable is T;
type ExpressionFunction = (unknownVariable: unknown, object: Record<string | number, any>, propertyKey: string | number) => boolean;
type ValidatorFunction = (unknownVariable: unknown, object?: Record<string | number, any>, propertyKey?: string | number) => boolean;


const PROPERTY_DEFAULTS: ObjectSchemaOptions = {
    allowPartial: false,
    allowExtensions: false
};

export const DEFAULT_VALUE_KEY = Symbol();
const DEFAULT_VALUE_PLACEHOLDER = Symbol();
const DELETE_SYMBOL = Symbol();

export class Schema<Type = any> {
    public static debug = false;

    optional?: () => SchemaExtended<Type>;
    default?: (defaultValue: any) => SchemaExtended<Type>;
    validate?: ValidateFunction;


    public static KEYWORD = {
        delete: DELETE_SYMBOL
    };

    private static getExtendedSchema(thisSchema: Schema, validator: ValidateFunction): SchemaExtended {
        // All methods present on the schema returned via .optional or .default
        const schemaExtended: SchemaExtended = {
            require: true,
            source: thisSchema,
            [DEFAULT_VALUE_KEY]: DEFAULT_VALUE_PLACEHOLDER,
            optional: function () {
                // Optional and default variables are for schemas used within other schemas, remove the validate method
                // this.validate = undefined as unknown as ValidateFunction;
                const schemaPropertyClone = { ...this };
                schemaPropertyClone.require = false;
                return schemaPropertyClone as unknown as SchemaExtended;
            },
            default: function (defaultValue: any) {
                // Optional and default variables are for schemas used within other schemas, remove the validate method
                // this.validate = undefined as unknown as ValidateFunction;
                const schemaPropertyClone = { ...this };
                schemaPropertyClone[DEFAULT_VALUE_KEY] = defaultValue;
                return schemaPropertyClone as unknown as SchemaExtended;
            },
            validate: validator
        };
        return schemaExtended;
    }

    public static create<Source extends SchemaSource>(
        source: Source
    ): SchemaExtended<SchemaSourceValue<Source>>;

    public static create<
        Schemas extends SchemaExtended<any>[]
    >(...schemas: Schemas): SchemaExtended<
        SchemaValue<Schemas[number]>
    >;

    public static create<
        Schemas extends SchemaExtended[]
    >(...args: Schemas): SchemaExtended<
        SchemaValue<Schemas[number]>
    > {
        const schema = {} as Schema;
        const validator = (args.length === 1 ?
            Util.getValidator(args[0]) :
            Util.getValidator(args.map((source) => Schema.create(source)))
        ) as ValidateFunction;
        const schemaExtended = Schema.getExtendedSchema(schema, validator);

        for (const schemaSource of args) {
            if (schemaSource as unknown === "none") {
                schemaExtended.require = false;
                break;
            }
        }

        return schemaExtended;
    }
    public static union = this.create;

    public static any() { return Schema.create("any") };
    public static none() { return Schema.create("none") };
    public static remove() { return Schema.create("none").default(Schema.KEYWORD.delete) };
    public static expression(expressionFunction: ExpressionFunction) { return Schema.create(expressionFunction) }

    // Primitive
    public static string(): SchemaExtended<string> { return Schema.create("string") };
    public static number(): SchemaExtended<number> { return Schema.create("number") };
    public static boolean(): SchemaExtended<boolean> { return Schema.create("boolean") };
    public static undefined(): SchemaExtended<undefined> { return Schema.create("undefined") };
    public static null(): SchemaExtended<null> { return Schema.create("null") };

    // Non-primitive
    public static objectPrototype(object: PrototypeSchema["objectPrototype"]) {
        return Schema.create({ objectPrototype: object });
    }

    public static array(schema: SchemaSource) {
        return Schema.create({ arrayOf: schema });
    }

    public static arrayFromMap(keyType: SchemaSource, propertyType: SchemaSource | Array<SchemaSource>) {
        return Schema.create({
            arrayOf: {
                tupleOf: [keyType, propertyType]
            }
        });
    }

    public static tuple(...args: Array<SchemaSource | Array<SchemaSource>>) {
        return Schema.create({ tupleOf: args });
    }

    public static map(keyType: SchemaSource | Array<SchemaSource>, propertyType: SchemaSource | Array<SchemaSource>) {
        return Schema.create({
            mapOf: {
                tupleOf: [keyType, propertyType]
            }
        });
    }

    public static set(...args: Array<SchemaSource>) {
        if (args.length === 1) {
            return Schema.create({ setOf: args[0] });
        } else {
            return Schema.create({ setOf: args });
        }
    }
}

const Util = {
    printDebug: (message: string, failed?: boolean) => {
        if (!Schema.debug) return;
        console.log(`${failed ? "Invalid: " : ""} ${message}`);
    },
    deepClone: (unknownVariable: any): typeof unknownVariable => {
        const visited = new WeakMap();
        return _deepClone(unknownVariable);
        function _deepClone(unknownVariable: any): typeof unknownVariable {
            if (typeof unknownVariable !== "object" || unknownVariable === null) return unknownVariable;
            if (typeof unknownVariable === "function") return unknownVariable;

            if (visited.has(unknownVariable)) return visited.get(unknownVariable);

            const clone = new unknownVariable.constructor();
            visited.set(unknownVariable, clone);
            let propertyArray: Array<any> | Set<any> | undefined;

            let setNewValue: Function;
            if (unknownVariable instanceof Set) {
                setNewValue = (propertyKey: keyof typeof clone, value: any) => {
                    clone.add(_deepClone(value));
                }
            } else if (unknownVariable instanceof Map) {
                setNewValue = (propertyKey: keyof typeof clone, value: any) => {
                    clone.set(propertyKey, _deepClone(value));
                }
            } else {
                setNewValue = (propertyKey: keyof typeof clone, value: any) => {
                    clone[propertyKey] = _deepClone(value);
                }
            }

            if (Array.isArray(unknownVariable) || unknownVariable instanceof Set) {
                propertyArray = unknownVariable;
                let index = 0;
                for (const entry of propertyArray) {
                    const value = entry;
                    setNewValue(index, value);
                    index++;
                }
            } else {
                if (!(Symbol.iterator in unknownVariable)) {
                    propertyArray = Object.entries(unknownVariable);
                } else {
                    const iterator = unknownVariable[Symbol.iterator];
                    if (typeof iterator !== "function") {
                        // Property array will be undefined:
                        clone[Symbol.iterator] = _deepClone(iterator);
                    } else if (!("toArray" in iterator)) {
                        propertyArray = unknownVariable as any;
                    } else {
                        propertyArray = iterator().toArray();
                    }
                }
                if (propertyArray !== undefined) {
                    for (const [...entry] of propertyArray) {
                        const propertyKey = entry[0];
                        const value = entry[1];
                        setNewValue(propertyKey, value);
                    }
                }
            }
            return clone;
        }
    },
    isPrimitive: (schemaSource: SchemaSource): schemaSource is PrimitiveType => {
        return (typeof schemaSource === "string");
    },
    isArraySchema: (schemaSource: SchemaSource): schemaSource is ArraySchema => {
        if (typeof schemaSource === "string") return false;
        return "arrayOf" in schemaSource;
    },
    isTupleSchema: (schemaSource: SchemaSource): schemaSource is TupleSchema => {
        if (typeof schemaSource === "string") return false;
        return "tupleOf" in schemaSource;
    },
    isMapSchema: (schemaSource: SchemaSource): schemaSource is MapSchema => {
        if (typeof schemaSource === "string") return false;
        return "mapOf" in schemaSource;
    },
    isSetSchema: (schemaSource: SchemaSource): schemaSource is SetSchema => {
        if (typeof schemaSource === "string") return false;
        return "setOf" in schemaSource;
    },
    isObjectSchema: (schemaSource: SchemaSource): schemaSource is ObjectSchema => {
        if (typeof schemaSource === "string") return false;
        return "properties" in schemaSource;
    },
    isPrototypeSchema: (schemaSource: SchemaSource): schemaSource is PrototypeSchema => {
        if (typeof schemaSource === "string") return false;
        return "objectPrototype" in schemaSource;
    },
    isSchemaExtended: (schemaSource: SchemaSource): schemaSource is SchemaExtended => {
        if (typeof schemaSource === "string") return false;
        return "source" in schemaSource;
    },
    getOptions: (objectSchema: ObjectSchema): ObjectSchemaOptions => {
        const options = objectSchema.options;
        if (options === undefined) {
            return PROPERTY_DEFAULTS;
        } else {
            return Object.assign({}, PROPERTY_DEFAULTS, options);
        }
    },
    getMultiTypeValidator: (schemaSourceArray: Array<SchemaSource>): ValidatorFunction => {
        const validators: Array<ValidatorFunction> = [];
        for (const singleSchemaSource of schemaSourceArray) {
            validators.push(Util.getValidator(singleSchemaSource));
        }
        if (validators.length === 0) return () => false;
        if (validators.length === 1) return validators[0];
        return (unknownVariable) => {
            for (const validator of validators) {
                if (!validator(unknownVariable)) continue;
                return true;
            }
            return false;
        }
    },
    getValidator: (schemaSource: SchemaSource | Array<SchemaSource>): ValidatorFunction => {
        if (Array.isArray(schemaSource)) {
            return Util.getMultiTypeValidator(schemaSource);
        }

        if (Util.isPrimitive(schemaSource)) {
            switch (schemaSource) {
                case "any":
                    return () => true;
                case "none":
                    return () => false;
                default:
                    const validator = Util.primitiveValidator;
                    return (unknownVariable) => validator(unknownVariable, schemaSource);
            }
        }

        let validator: ValidatorFunction;
        if (typeof schemaSource === "function") {
            validator = schemaSource as ValidatorFunction;
        } else if (Util.isSchemaExtended(schemaSource)) {
            validator = schemaSource.validate;
            // return (unknownVariable) => validator(unknownVariable);
        } else if (Util.isArraySchema(schemaSource)) {
            validator = Util.getArrayValidator(schemaSource);
        } else if (Util.isTupleSchema(schemaSource)) {
            validator = Util.getTupleValidator(schemaSource);
        } else if (Util.isMapSchema(schemaSource)) {
            validator = Util.getMapValidator(schemaSource);
        } else if (Util.isSetSchema(schemaSource)) {
            validator = Util.getSetValidator(schemaSource);
        } else if (Util.isObjectSchema(schemaSource)) {
            validator = Util.getObjectValidator(schemaSource);
        } else if (Util.isPrototypeSchema(schemaSource)) {
            validator = Util.getPrototypeValidator(schemaSource);
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
        let validator;
        if (
            typeof arrayOf !== "string" &&
            DEFAULT_VALUE_KEY in arrayOf &&
            arrayOf[DEFAULT_VALUE_KEY] !== DEFAULT_VALUE_PLACEHOLDER
        ) {
            const defaultValue = arrayOf[DEFAULT_VALUE_KEY];
            const getDefaultValue = (typeof defaultValue !== "object" || defaultValue === null) ?
                () => defaultValue :
                () => Util.deepClone(defaultValue);
            const assignDefaultValue = (defaultValue === DELETE_SYMBOL) ?
                (object: Array<any>, index: number) => { object.splice(index, 1); } :
                (object: Array<any>, index: number) => { object[index] = getDefaultValue(); }

            const entryValidator = Util.getValidator(arrayOf);

            validator = ((unknownVariable: unknown, object: Array<any>, index: number) => {
                const isValid = entryValidator(unknownVariable);
                if (isValid) return true;
                assignDefaultValue(object, index);
                return true;
            }) as ValidatorFunction;
        } else {
            validator = Util.getValidator(arrayOf);
        }

        return (unknownVariable) => {
            if (!Array.isArray(unknownVariable)) return false;
            for (let i = unknownVariable.length - 1; i >= 0; i--) {
                if (!validator(unknownVariable[i], unknownVariable, i)) return false;
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
            const schemaSource = tupleOf[i];
            const validator = Util.getValidator(schemaSource);
            if (typeof schemaSource === "string") {
                validators.unshift(validator);
                continue;
            }
            if (!(DEFAULT_VALUE_KEY in schemaSource) || schemaSource[DEFAULT_VALUE_KEY] === DEFAULT_VALUE_PLACEHOLDER) {
                validators.unshift(validator);
            } else {
                const defaultValue = schemaSource[DEFAULT_VALUE_KEY];
                const getDefaultValue = (typeof defaultValue !== "object" || defaultValue === null) ?
                    () => defaultValue :
                    () => Util.deepClone(defaultValue);
                const assignDefaultValue = (defaultValue === DELETE_SYMBOL) ?
                    (object: any, propertyKey: keyof typeof object) => { delete object[propertyKey]; } :
                    (object: any, propertyKey: keyof typeof object) => { object[propertyKey] = getDefaultValue(); }

                const newValidator = ((unknownVariable: unknown, object: Array<any>, propertyKey: string | number) => {
                    const isValid = validator(unknownVariable);
                    if (isValid) return true;
                    assignDefaultValue(object, propertyKey);
                    return true;
                }) as ValidatorFunction;

                validators.unshift(newValidator);
            }

            if (!("require" in schemaSource)) continue;
            if (schemaSource.require !== false) continue;
            allPropertiesRequired = false;
            if (lastOptionalVariableIndex - i > 1) throw new Error("Failed to create tuple - optional variables must be placed after required variables");
            lastOptionalVariableIndex = i;
        }

        return (unknownVariable) => {
            if (!Array.isArray(unknownVariable)) return false;
            const unknownVariableLength = unknownVariable.length;
            if (allPropertiesRequired && unknownVariableLength !== length) return false;
            else if (unknownVariableLength < lastOptionalVariableIndex) return false;

            for (let i = 0; i < unknownVariable.length; i++) {
                const validator = validators[i];
                if (i >= lastOptionalVariableIndex && i >= unknownVariableLength) {
                    // All variables from now on are optional, and none are present
                    return true;
                }
                if (!validator(unknownVariable[i], unknownVariable, i)) return false;
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
            const propertySchema = subArray[1];
            const validator = Util.getValidator(propertySchema);
            const require = (("require" in propertySchema && !propertySchema.require) ? false : true);
            if (!require) allPropertiesRequired = false;
            if (!(DEFAULT_VALUE_KEY in propertySchema) || propertySchema[DEFAULT_VALUE_KEY] === DEFAULT_VALUE_PLACEHOLDER) {
                propertyValidatorSubArrays.push([subArray[0], validator, require]);
                continue;
            } else {
                const defaultValue = propertySchema[DEFAULT_VALUE_KEY];
                const getDefaultValue = (typeof defaultValue !== "object" || defaultValue === null) ?
                    () => defaultValue :
                    () => Util.deepClone(defaultValue);
                const assignDefaultValue = (defaultValue === DELETE_SYMBOL) ?
                    (object: any, propertyKey: keyof typeof object) => { delete object[propertyKey]; } :
                    (object: any, propertyKey: keyof typeof object) => { object[propertyKey] = getDefaultValue(); }

                const newValidator = ((unknownVariable: unknown, object: Record<string | number, any>, propertyKey: string | number) => {
                    const isValid = validator(unknownVariable);
                    if (isValid) return true;
                    assignDefaultValue(object, propertyKey);
                    return true;
                }) as ValidatorFunction;
                propertyValidatorSubArrays.push([subArray[0], newValidator, require]);
            }
        }

        return (unknownVariable) => {
            if (typeof unknownVariable !== "object" || unknownVariable === null) {
                Util.printDebug("Variable is not an object", true);
                return false;
            }

            let allPropertiesPresent = true;
            for (const subArray of propertyValidatorSubArrays) {
                const [propertyKey, validator, require] = subArray;
                // Object does not contain key: 
                if (!(propertyKey in unknownVariable)) {
                    if (require === true && !allowPartial) {
                        if (!(validator(Symbol(), unknownVariable, propertyKey))) {
                            Util.printDebug("Required property is not present, could not assign default value", true);
                            return false;
                        }
                    }
                    allPropertiesPresent = false;
                    continue;
                }
                // Object contains key, validate property
                const unknownValue = unknownVariable[(propertyKey as keyof typeof unknownVariable)];
                if (!(validator(unknownValue, unknownVariable, propertyKey))) {
                    Util.printDebug(`Property "${propertyKey}" is invalid: (${unknownValue})`, true);
                    return false;
                }
            }

            // Don't need to verify no extra properties exist:
            if (allowExtensions) return true;

            // All properties already validated
            if (allPropertiesRequired && allPropertiesPresent) {
                const lengthMatches = (Object.keys(unknownVariable).length === propertyKeySet.size);
                if (!lengthMatches) Util.printDebug(`All properties required are required and all properties are present - object key count is different`, true);
                return lengthMatches;
            }

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