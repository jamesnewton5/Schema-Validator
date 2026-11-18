import { testCases } from "./test_cases";

function printColour(...args: Array<string | number>) {
    const prefixArray = [];
    let message = "";
    for (const arg of args) {
        if (typeof arg === "string") message += arg;
        else prefixArray.push(arg);
    }
    const prefixString = `\x1b[${prefixArray.join(";")}m%s\x1b[0m`;
    console.log(prefixString, message);
}
const Colour = {
    Black: 30,
    Red: 31,
    Green: 32,
    Yellow: 33,
    Blue: 34,
    Magenta: 35,
    Cyan: 36,
    White: 37
};
const BackgroundColour = {
    Black: 40,
    Red: 41,
    Green: 42,
    Yellow: 43,
    Blue: 44,
    Magenta: 45,
    Cyan: 46,
    White: 47
};

let testCasesPassed = 0;
testCases.forEach((testCase, number) => {
    const { callback, expectedResult } = testCase;
    const result = callback();
    if (result === expectedResult) {
        testCasesPassed++;
        printColour(Colour.Green, ` Passed test case ${number} `, BackgroundColour.Green);
    } else {
        printColour(Colour.Red, ` Failed test case ${number} `, BackgroundColour.Red);
        printColour(Colour.Red, `Expected: ${expectedResult} `);
        printColour(Colour.Red, `Received: ${result} `);
    }
});

printColour(Colour.White, `\nFinished.\nTest cases passed: ${testCasesPassed}/${testCases.length}`);