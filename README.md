<h1 style="margin-bottom: 12px; margin-top: 0px; padding-bottom: 0px; padding-top: 0px; color: #FFAAFF; border-bottom: none;">
JSON / JavaScript Schema Validator
</h1>
Installation:

```
npm install github:jamesnewton5/Schema-Validator
```

```
git clone https://github.com/jamesnewton5/Schema-Validator
```
<h3 style="margin-bottom: 8px; margin-top: 0px; padding-bottom: 0px; padding-top: 0px; border-bottom: none;">- Zero dependencies</h3>
<h3 style="margin-bottom: 8px; margin-top: 0px; padding-bottom: 0px; padding-top: 0px; border-bottom: none;">- Small file size (12 KB)</h3>
<h3 style="margin-bottom: 8px; margin-top: 0px; padding-bottom: 0px; padding-top: 0px; border-bottom: none;">- Easy to setup</h3>
<h3 style="margin-bottom: 8px; margin-top: 0px; padding-bottom: 0px; padding-top: 0px; border-bottom: none;">- Very fast</h3><br>

# Example
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
    const isVector3 = Vector3Schema.check<Vector3>(vector3);
    if (!isVector3) return;
    console.log(vector3.x, vector3.y, vector3.z);
}
```

# Use Case - Type Validation

```typescript
const jsonString = "{x: 0, y: 0, z: 0}";
const testData = JSON.parse(jsonString);
outputVector3(testData);

// This sucks:
function outputVector3(vector3: any) {
    if (typeof testData.x !== "number" || typeof testData.y !== "number" || typeof testData.z !== "number") {
        return;
    }
    console.log(vector3.x, vector3.y, vector3.z);
}
```

# Basic Setup
<h3 style="margin-bottom: 6px; padding-bottom: 0px;">Default Options</h3>

```typescript
const options: SchemaOptions = {
    allowPartial: false, // When set to false all properties are required
    allowExtensions: false // When set to false no extra properties are permitted
};
```
<h3 style="margin-bottom: 6px; padding-bottom: 0px;">Schema with Default Options:</h3>

```typescript
const PersonSchema = Schema.create({
    // (No options property)
    properties: {
        firstName: Schema.string(),
        lastName: Schema.string()
    }
});
```
<h3 style="margin-bottom: 6px; padding-bottom: 0px;">Options Specified:</h3>

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

<h3 style="margin-bottom: 6px; padding-bottom: 0px;">One Option Specified:</h3>

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

console.log(PersonSchema.check(testData)); // Output: true
```

# Usage
### No type parameter (bad)
```diff
function outputVector3(vector3: unknown) {
     const isVector3 = Vector3Schema.check(vector3);
     if (!isVector3) return;
-    console.log(vector3.x, vector3.y, vector3.z); <--- TypeScript error: 'vector3' is of type 'unknown'.
}
```
### With type parameter (good)
```diff
type Vector3 = {x: number, y: number, z: number};

function outputVector3(vector3: unknown) {
+                                          ↓ ↓ ↓            
+   const isVector3 = Vector3Schema.check<Vector3>(vector3);
    if (!isVector3) return;
    console.log(vector3.x, vector3.y, vector3.z); // <--- No error
}
```

# Methods and Examples
<p style="margin-bottom: 6px; padding-bottom: 0px;">Schema methods can be used in place of strings to define types:</p>

```typescript
Schema.create(Schema.array(Schema.number()));
```
<h3 style="margin-bottom: 6px; padding-bottom: 0px;">Optional Method</h3>


```diff
const PersonSchema = Schema.create({
    properties: {
        firstName: Schema.string(),
+       lastName: Schema.string().optional()
    }
});
```
```typescript
console.log(PersonSchema.check<Person>({
    firstName: "John",
    lastName: "Glorp"
})); // Output: true

console.log(PersonSchema.check<Person>({
    firstName: "John"
})); // Output: true

console.log(PersonSchema.check<Person>({
    firstName: "John",
    lastName: 4
})); // Output: false
```
<h3 style="margin-bottom: 6px; padding-bottom: 0px;">Array</h3>

```typescript
type SingleTypeArray = Array<number>;
type MultiTypeArray = Array<number | string>;

const SingleTypeArraySchema = Schema.create(Schema.array(Schema.number()));

const MultiTypeArraySchema = Schema.create(
    // Comma separated parameters for creating an array schema:
    Schema.array(Schema.number(), Schema.string())
);

console.log(SingleTypeArraySchema.check<SingleTypeArray>([1, 2, 3, 4, 5])); // Output: true
console.log(SingleTypeArraySchema.check<SingleTypeArray>([1, 2, 3, 4, "five"])); // Output: false

console.log(MultiTypeArraySchema.check<MultiTypeArray>([1, 2, 3, 4, 5])); // Output: true
console.log(MultiTypeArraySchema.check<MultiTypeArray>([1, 2, 3, 4, "five"])); // Output: true
```
<h3 style="margin-bottom: 6px; padding-bottom: 0px;">Tuple</h3>

```typescript
const TupleSchema = Schema.create(Schema.tuple(
    Schema.string(),
    Vector3Schema
));

console.log(TupleSchema.check(["abc", { x: 0, y: 0, z: 0 }])); // Output: true

console.log(TupleSchema.check(["def", { x: 0, y: 0, z: "zero" }])); // Output: false

console.log(TupleSchema.check([{ x: 0, y: 0, z: 0 }, "abc"])); // Output: false
```
<h3 style="margin-bottom: 6px; padding-bottom: 0px;">Tuple with Optional Fields</h3>

```typescript
type Tuple = [string, number, number?];
const TupleSchema = Schema.create(Schema.tuple(
    Schema.string(),
    Schema.number(),
    Schema.number().optional()
));

console.log(TupleSchema.check<Tuple>(["abc", 123, 123])); // Output: true
console.log(TupleSchema.check<Tuple>(["abc", 123])); // Output: true
console.log(TupleSchema.check<Tuple>(["abc", 123, "abc"])); // Output: false
console.log(TupleSchema.check<Tuple>(["abc"])); // Output: false
```
<h3 style="margin-bottom: 6px; padding-bottom: 0px;">Set</h3>

```typescript
// Comma separated parameters for creating array and set schemas:
const SetSchema = Schema.create(
    Schema.set(Schema.number(), Schema.string())
);
const testArray = [1, 2, 3, 4, "five"];
const testSet = new Set(testArray);
console.log(SetSchema.check<NumberStringSet>(testSet)); // Output: true
```
<h3 style="margin-bottom: 6px; padding-bottom: 0px;">Map</h3>

```typescript
// Single type allowed for map key,
// array of types for map values:
const MapSchema = Schema.create(Schema.map(
    Schema.string(),
    [Schema.number(), Schema.string()]
));

const testArray: Array<[string, number | string]> = [
    ["key1", 1],
    ["key2", "string"]
];
const testMap = new Map(testArray);
console.log(MapSchema.check(testMap)); // Output: true


// Single type allowed for map key,
// any type allowed for map values:
const MapSchema2 = Schema.create(Schema.map(
    Schema.string(),
    Schema.any()
));

const testArray2: Array<[string | number, any]> = [
    ["key1", new Date()],
    ["key2", undefined]
];
const testMap2 = new Map(testArray2);
console.log(MapSchema2.check(testMap2)); // Output: true
```
<h3 style="margin-bottom: 6px; padding-bottom: 0px;">Object Prototype</h3>

```typescript
const ObjectSchema = Schema.create({
    properties: {
        map: Schema.objectPrototype(Map)
    }
});

const array: Array<[string, number]> = [["abc", 123]];

console.log(ObjectSchema.check({
    map: new Map(array)
})); // Output: true

console.log(ObjectSchema.check({
    map: new Set(array)
})); // Output: false

console.log(ObjectSchema.check({
    map: array
})); // Output: false
```
<h3 style="margin-bottom: 6px; padding-bottom: 0px;">Array from Map</h3>

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
const PeopleMapArraySchema = Schema.create(Schema.arrayFromMap("number", PersonSchema));
// Or use Schema.array(Schema.tuple()):
// const PeopleMapArraySchema = Schema.create(Schema.array(Schema.tuple("number", PersonSchema)));

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
        if (!PeopleMapArraySchema.check<PeopleMapAsArray>(arrayFromMap)) return undefined;

        const peopleFromId = new Map(arrayFromMap);
        return peopleFromId;
    } catch {
        // Invalid JSON:
        return undefined;
    }
}
```
