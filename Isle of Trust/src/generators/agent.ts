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
    newIdeology: number,
    newResource: number,
    newDonated: number,
    newMood: number,
    newCoord: [number, number],
    level: number
) {};

const randomAttribute = function (): number {
    return randomIntRange(0, 20);
};

export const genRandomAgent = function (
    vID: number,
    coords: [number, number],
    resources: number = 10,
    donated: number
): Agent {
    const level = -1;
    const spot = -1;
    let result = new Agent(
        genName(vID),
        new Ideology(),
        resources,
        donated,
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
    donated: number,
    spot: number,
    level: number
): Agent {
    // Chart helps decide what is the right stategy for each generated default player
    let chart = [3, 3, 1, 2, 5];
    if (level === 5) chart = [3, 4, 0, 1];
    else if (level === 6) chart = [3, 3, 1, 2, -1, -1];
    let result = new Agent(
        genName(vID),
        new Ideology(chart[spot]),
        resources,
        donated,
        10,
        vID,
        coords,
        spot,
        level
    );
    return result;
};
