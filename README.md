# JSON / JavaScript Schema Validator
#### - Zero dependencies<br> - Small file size (24 KB)<br> - Easy to setup<br> - Very fast

**README.md**<br>
┠ [Installation](#installation)<br>
┠ [Example](#example)<br>
┠ [Use Case](#use-case)<br>
┠ [Basic Setup](#basic-setup)<br>
┠ [Usage](#usage)<br>
┖ [Methods and Examples](#methods-and-examples)

## Installation
```
npm install github:jamesnewton5/Schema-Validator
```

```
git clone https://github.com/jamesnewton5/Schema-Validator
```
## Example
```typescript
type Vector3 = {x: number, y: number, z: number};

const Vector3Schema = Schema.create({
    properties: {
        x: Schema.number(),
        y: Schema.number(),
        z: Schema.number()
    }
});

function outputVector3(vector3: unknown) {         
    const isVector3 = Vector3Schema.validate<Vector3>(vector3);
    if (!isVector3) return;
    console.log(vector3.x, vector3.y, vector3.z);
}
```

## Use Case
### Type Validation
```typescript
type Vector3 = {x: number, y: number, z: number};

// This sucks:
function isVector3(vector3: unknown): vector3 is Vector3 {
    if (typeof vector3 !== "object" || vector3 === null) return false;
    if (Object.keys(vector3).length !== 3) return false;
    if (!("x" in vector3) || !("y" in vector3) || !("z" in vector3)) return false;
    if (typeof vector3.x !== "number" || typeof vector3.y !== "number" || typeof vector3.z !== "number") {
        return false;
    }
    return true;
}
// This doesn't:
const Vector3Schema = Schema.create({
    properties: {
        x: Schema.number(),
        y: Schema.number(),
        z: Schema.number()
    }
});
const isVector3 = Vector3Schema.validate<Vector3>;
```
### Schema Migration
```typescript
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
```

## Basic Setup
### Default Options:
```typescript
const options: SchemaOptions = {
    allowPartial: false, // When set to false all properties are required
    allowExtensions: false // When set to false no extra properties are permitted
};
```
### Schema with Default Options:
```typescript
const PersonSchema = Schema.create({
    // (No options property)
    properties: {
        firstName: Schema.string(),
        lastName: Schema.string()
    }
});
```
### Options Specified:
```typescript
const PersonSchema = Schema.create({
    options: {
        allowPartial: false,
        allowExtensions: true
    },
    properties: {
        firstName: Schema.string(),
        lastName: Schema.string()
    }
});
```
### One Option Specified:
```typescript
const PersonSchema = Schema.create({
    options: {
        allowExtensions: true // Changed to true, allowPartial will resort to the default value (false)
    },
    properties: {
        firstName: Schema.string(),
        lastName: Schema.string()
    }
});

const testData = {
    firstName: "John",
    lastName: "Glorp",
    favouriteColour: "Green"
};

console.log(PersonSchema.validate(testData)); // Output: true
```

## Usage
### No type parameter (bad)
```diff
function outputVector3(vector3: unknown) {
     const isVector3 = Vector3Schema.validate(vector3);
     if (!isVector3) return;
-    console.log(vector3.x, vector3.y, vector3.z); <--- TypeScript error: 'vector3' is of type 'unknown'.
}
```
### With type parameter (good)
```diff
type Vector3 = {x: number, y: number, z: number};

function outputVector3(vector3: unknown) {
+                                          ↓ ↓ ↓            
+   const isVector3 = Vector3Schema.validate<Vector3>(vector3);
    if (!isVector3) return;
    console.log(vector3.x, vector3.y, vector3.z); // <--- No error
}
```

## Methods and Examples
Strings can be used in place of schemas to define types:
```typescript
Schema.array("number");
```
### Optional Method
```diff
const PersonSchema = Schema.create({
    properties: {
        firstName: Schema.string(),
+       lastName: Schema.string().optional()
    }
});
```
```typescript
console.log(PersonSchema.validate<Person>({
    firstName: "John",
    lastName: "Glorp"
})); // Output: true

console.log(PersonSchema.validate<Person>({
    firstName: "John"
})); // Output: true

console.log(PersonSchema.validate<Person>({
    firstName: "John",
    lastName: 4
})); // Output: false
```
### Array
```typescript
type SingleTypeArray = Array<number>;
type MultiTypeArray = Array<number | string>;

const SingleTypeArraySchema = Schema.array(Schema.number());

// Multi-type variables must be joined using Schema.union or Schema.create
const MultiTypeArraySchema = Schema.array(Schema.union(Schema.number(), Schema.string()));

console.log(SingleTypeArraySchema.validate<SingleTypeArray>([1, 2, 3, 4, 5])); // Output: true
console.log(SingleTypeArraySchema.validate<SingleTypeArray>([1, 2, 3, 4, "five"])); // Output: false

console.log(MultiTypeArraySchema.validate<MultiTypeArray>([1, 2, 3, 4, 5])); // Output: true
console.log(MultiTypeArraySchema.validate<MultiTypeArray>([1, 2, 3, 4, "five"])); // Output: true
```
### Tuple
```typescript
const TupleSchema = Schema.tuple(
    Schema.string(),
    Vector3Schema
);

console.log(TupleSchema.validate(["abc", { x: 0, y: 0, z: 0 }])); // Output: true

console.log(TupleSchema.validate(["def", { x: 0, y: 0, z: "zero" }])); // Output: false

console.log(TupleSchema.validate([{ x: 0, y: 0, z: 0 }, "abc"])); // Output: false
```
### Tuple with Optional Fields
```typescript
type Tuple = [string, number, number?];
const TupleSchema = Schema.tuple(
    Schema.string(),
    Schema.number(),
    Schema.number().optional()
);

console.log(TupleSchema.validate<Tuple>(["abc", 123, 123])); // Output: true
console.log(TupleSchema.validate<Tuple>(["abc", 123])); // Output: true
console.log(TupleSchema.validate<Tuple>(["abc", 123, "abc"])); // Output: false
console.log(TupleSchema.validate<Tuple>(["abc"])); // Output: false
```
### Set
```typescript
const SetSchema = Schema.set(Schema.union(Schema.number(), Schema.string()));
const testArray = [1, 2, 3, 4, "five"];
const testSet = new Set(testArray);
console.log(SetSchema.validate<NumberStringSet>(testSet)); // Output: true
```
### Map
```typescript
// Single type allowed for map key,
// array of types for map values:
const MapSchema = Schema.map(
    Schema.string(),
    [Schema.number(), Schema.string()]
);

const testArray: Array<[string, number | string]> = [
    ["key1", 1],
    ["key2", "string"]
];
const testMap = new Map(testArray);
console.log(MapSchema.validate(testMap)); // Output: true


// Single type allowed for map key,
// any type allowed for map values:
const MapSchema2 = Schema.map(
    Schema.string(),
    Schema.any()
);

const testArray2: Array<[string | number, any]> = [
    ["key1", new Date()],
    ["key2", undefined]
];
const testMap2 = new Map(testArray2);
console.log(MapSchema2.validate(testMap2)); // Output: true
```
### Object Prototype
```typescript
const ObjectSchema = Schema.create({
    properties: {
        map: Schema.objectPrototype(Map)
    }
});

const array: Array<[string, number]> = [["abc", 123]];

console.log(ObjectSchema.validate({
    map: new Map(array)
})); // Output: true

console.log(ObjectSchema.validate({
    map: new Set(array)
})); // Output: false

console.log(ObjectSchema.validate({
    map: array
})); // Output: false
```
### Array from Map
```typescript
// TypeScript type
type Person = {
    firstName: string;
    lastName: string;
};
type PeopleMap = Map<number, Person>;
type PeopleMapAsArray = Array<[number, Person]>;

const PersonSchema = Schema.create({
    properties: {
        firstName: Schema.string(),
        lastName: Schema.string()
    }
});
const PeopleMapArraySchema = Schema.arrayFromMap("number", PersonSchema);
// Or use Schema.array(Schema.tuple()):
// const PeopleMapArraySchema = Schema.array(Schema.tuple("number", PersonSchema));

const peopleFromId: PeopleMap = new Map();
peopleFromId.set(0, {
    firstName: "John",
    lastName: "Glorp"
});

storePeopleAsString(peopleFromId);
const peopleFromIdFromString = retrieveDataFromString();
if (peopleFromIdFromString !== undefined) {
    // Output: People in map: John
    console.log("People in map:", Array.from(peopleFromIdFromString.values()).map((value) => value.firstName).join(", "));
} else {
    console.warn("Failed to verify JSON data");
}

// Store a JavaScript map as a string safely by converting to an array
function storePeopleAsString(mapToStore: PeopleMap): void {
    const mapAsString = JSON.stringify(Array.from(mapToStore));
    storedData = mapAsString;
}

// Retrieve the stored string
function retrieveDataFromString(): PeopleMap | undefined {
    const mapAsString = storedData;
    try {
        const arrayFromMap = JSON.parse(mapAsString);       
        if (!PeopleMapArraySchema.validate<PeopleMapAsArray>(arrayFromMap)) return undefined;

        const peopleFromId = new Map(arrayFromMap);
        return peopleFromId;
    } catch {
        // Invalid JSON:
        return undefined;
    }
}
```
