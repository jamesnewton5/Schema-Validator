type CustomType = "string" | "number" | "boolean" | "undefined" | "null" | "function" | "object" | ObjectType | ArrayType | Schema;
interface ObjectPropertyTypeFunction extends ObjectPropertyType {
    optional: () => ObjectPropertyType
};
interface ObjectPropertyType {
    require?: boolean,
    propertyType: CustomType | Array<CustomType>
};
type TypeOptions = {
    allowPartial: boolean;
    allowExtensions: boolean;
};
type TypeObject = {
    [key: string]: ObjectPropertyType | Schema;
};
type ArrayType = {
    arrayOf: CustomType | Array<CustomType>
};
type ObjectType = {
    options?: Partial<TypeOptions>,
    properties: TypeObject
};

export class Schema {
    private static PROPERTY_DEFAULTS: TypeOptions = {
        allowPartial: false,
        allowExtensions: false
    };
    private source: CustomType;
    private propertyEntrySubArrays?: Array<[string, ObjectPropertyType]>
    private propertyKeySet?: Set<string>;
    public optional: () => ObjectPropertyType;

    check: (unknownVariable: any) => boolean;

    constructor(reference: ObjectType | ArrayType) {
        this.source = reference;
        // Allow schema to be used as a type:
        this.optional = () => {
            return {
                require: false,
                propertyType: [this]
            };
        }

        if ("arrayOf" in reference && !Array.isArray((reference as ArrayType).arrayOf)) {
            (reference as ArrayType).arrayOf = [((reference as ArrayType).arrayOf) as CustomType];
        } else if ("properties" in reference) {
            // Get options
            const options = (reference as ObjectType).options;
            if (options === undefined) (reference as ObjectType).options = Schema.PROPERTY_DEFAULTS;
            else {
                options.allowPartial = options.allowPartial ?? Schema.PROPERTY_DEFAULTS.allowPartial;
                options.allowExtensions = options.allowExtensions ?? Schema.PROPERTY_DEFAULTS.allowExtensions;
            }

            // Create set during initialisation to avoid memory allocation while running
            const properties = (reference as ObjectType).properties;
            this.propertyKeySet = new Set(Object.keys(properties));

            // Create all key-property pair subarrys during initialisation too
            const propertyEntrySubArrays: Array<[string, ObjectPropertyType]> = [];
            const propertyEntries = Object.entries(properties);

            for (const subArray of propertyEntries) {
                propertyEntrySubArrays.push(subArray as [string, ObjectPropertyType]);
                const typeObject = subArray[1];
                if (typeObject instanceof Schema) {
                    subArray[1] = {
                        require: true,
                        propertyType: [typeObject]
                    };
                    continue;
                }
                const propertyType = typeObject.propertyType;
                if (Array.isArray(propertyType)) continue;
                typeObject.propertyType = [propertyType];
            }
            this.propertyEntrySubArrays = propertyEntrySubArrays;
        }
        this.check = (unknownVariable: any) => Schema.validateType(unknownVariable, this);
    }

    private static validateType(unknownVariable: any, referenceType: CustomType): boolean {
        if (referenceType instanceof Schema) {
            var propertyKeySet = referenceType.propertyKeySet;
            var propertyEntrySubArrays = referenceType.propertyEntrySubArrays;
            referenceType = referenceType.source;
        }
        if (typeof referenceType === "string") {
            // Primitive Types
            if (referenceType === "null") return (unknownVariable === null);
            return (typeof unknownVariable === referenceType);
        } else if ("arrayOf" in referenceType) {
            // Arrays
            if (!Array.isArray(unknownVariable)) return false;
            const typeArray = (referenceType as ArrayType).arrayOf as Array<CustomType>;
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
        // referenceType is typeof object:
        if (typeof unknownVariable !== "object" || unknownVariable === null || propertyKeySet === undefined || propertyEntrySubArrays === undefined) return false;


        const { allowPartial, allowExtensions } = (referenceType as ObjectType).options as TypeOptions;

        let allPropertiesRequired = !allowPartial;
        let allPropertiesPresent = true;

        for (const subArray of propertyEntrySubArrays) {
            const [propertyKey, typeObject] = subArray;
            if (!typeObject.require) allPropertiesRequired = false;
            // Object does not contain key: 
            if (!(propertyKey in unknownVariable)) {
                allPropertiesPresent = false;
                if (typeObject.require === false || allowPartial) continue;
                return false;
            }

            const unknownValue = unknownVariable[propertyKey];
            let typeIsValid = false;

            const propertyTypeArray = typeObject.propertyType as Array<CustomType>;
            for (const propertyType of propertyTypeArray) {
                if (!this.validateType(unknownValue, propertyType)) continue;
                typeIsValid = true;
                break;
            }
            if (!typeIsValid) return false;
        }

        // Don't need to verify no extra properties exist:
        if (allowExtensions) return true;

        // All properties already validated, 
        if (allPropertiesRequired || allPropertiesPresent) return (Object.keys(unknownVariable).length === propertyKeySet.size);

        // Check for extra properties
        for (const key of Object.keys(unknownVariable)) {
            if (!propertyKeySet.has(key)) return false;
        }
        return true;
    }

    private static getPropertyType(customType: CustomType): ObjectPropertyTypeFunction {
        const propertyType: ObjectPropertyTypeFunction = {
            require: true,
            propertyType: customType,
            optional: function () { this.require = false; return propertyType; }
        };
        return propertyType;
    }

    public static string() {
        return this.getPropertyType("string");
    }

    public static number() {
        return this.getPropertyType("number");
    }

    public static boolean() {
        return this.getPropertyType("boolean");
    }

    public static undefined() {
        return this.getPropertyType("undefined");
    }

    public static null() {
        return this.getPropertyType("null");
    }

    public static function() {
        return this.getPropertyType("function");
    }

    public static object() {
        return this.getPropertyType("object");
    }
}

