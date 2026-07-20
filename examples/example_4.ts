import { Schema } from "../schema_validator";

// (Just for the example)
let storedData: string;

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