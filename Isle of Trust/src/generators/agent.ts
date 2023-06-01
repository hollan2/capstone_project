import { Agent, Ideology, Relation } from "../models/agent";
import { randomIntRange } from "../utilities";
let name_iter = 1;
const SEED = 102938123;

const names: string[] = [
    "Bob",
    "Janet",
    "Alice",
    "Alex",
    "Jeremy",
    "Susan",
    "Sara",
    "Elizabeth",
    "Ned",
    "Ryan",
    "Jesse",
    "Walter",
    "Winnifred",
    "Joline",
    "Matthew",
    "Brandon",
    "Brandi",
    "Ingrid",
    "Emily",
    "Vladimir Von V",
    "Nina",
    "Tina",
    "James M Esquire",
];
var randnames: string[] = names;

export const genAgent = function (
    vID: number,
    newName: string,
    newIdeology: [number],
    newResource: number,
    newMood: number,
    newCoord: [number, number],
    level: number
) {};

export const genRandomAgent = function (
    vID: number,
    coords: [number, number],
    resources: number = 10
): Agent {
    const level = -1;
    const spot = -1;
    let result = new Agent(
        genName(vID),
        new Ideology(),
        resources,
        10,
        vID,
        coords,
        spot,
        level
    );
    return result;
};

const genName = function (vID: number): string {
    if (randnames.length === 0) randnames = names;

    let index = Math.floor(Math.random() * randnames.length);
    let result = randnames[index];
    randnames.splice(index, 1);

    return result;
};

export const genDefaultAgent = function (
    vID: number,
    coords: [number, number],
    resources: number = 10,
    spot: number,
    level: number
): Agent {
    let chart = [0, 0, 0, 0, 0, 0];
    if (level === 5) chart = [14, 5, 1, 2];
    else if (level === 6) chart = [4, 4, 2, 3, 1, 1];
    let result = new Agent(
        genName(vID),
        new Ideology(chart[spot]),
        resources,
        10,
        vID,
        coords,
        spot,
        level
    );
    return result;
};
