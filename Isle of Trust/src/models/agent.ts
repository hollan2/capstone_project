import { Strategy, TurnLog, Choice, Commitment } from "./strategy";
import { Face, Hat } from "../generators/pawn";

export const AGENT_RADIUS = 15;

//Set Default Pawn aesthetics based on level
const getDefaultPawns = (level: number) => {
    if (level >= 0 && level < 5) {
        return [
            {
                defName: "Tutor",
                defFace: 4,
                defHat: 4,
                resources: 10,
            },
            {
                defName: "Rec",
                defFace: 2,
                defHat: 3,
                resources: 5,
            },
            {
                defName: "Susi",
                defFace: 5,
                defHat: 1,
                resources: 2,
            },
            {
                defName: "Domran",
                defFace: 6,
                defHat: 2,
                resources: 8,
            },
            {
                defName: "Pessimo",
                defFace: 3,
                defHat: 0,
                resources: 0,
            },
            {
                defName: "Profe",
                defFace: 1,
                defHat: 5,
                resources: 5,
            },
        ];
    }
    if (level === 5) {
        return [
            {
                defName: "Tutor",
                defFace: 4,
                defHat: 4,
                resources: 10,
            },
            {
                defName: "Profe",
                defFace: 1,
                defHat: 5,
                resources: 5,
            },
            {
                defName: "Pessimo",
                defFace: 3,
                defHat: 0,
                resources: 0,
            },
            {
                defName: "Susi",
                defFace: 5,
                defHat: 1,
                resources: 2,
            },
        ];
    }
    if (level === 6) {
        return [
            {
                defName: "Tutor",
                defFace: 4,
                defHat: 4,
                resources: 10,
            },
            {
                defName: "Profe",
                defFace: 1,
                defHat: 5,
                resources: 5,
            },
            {
                defName: "Pessimo",
                defFace: 3,
                defHat: 0,
                resources: 0,
            },
            {
                defName: "Susi",
                defFace: 5,
                defHat: 1,
                resources: 2,
            },
            {
                defName: "Susi",
                defFace: 5,
                defHat: 1,
                resources: 2,
            },
            {
                defName: "Susi",
                defFace: 5,
                defHat: 1,
                resources: 2,
            },
        ];
    }
    return [];
};

// perhaps it would be better if attributes were their own classes that could
// call methods to increment themselves, but this way is a lot lighter.
abstract class AttributeContainer {
    public upperBound = 19;
    public lowerBound = 0;

    attributeInBounds(attribute: number): boolean {
        if (
            attribute < this.lowerBound ||
            attribute > this.upperBound ||
            isNaN(attribute)
        ) {
            return false;
        } else {
            return true;
        }
    }

    attributeAboveBounds(attribute: number): boolean {
        return attribute > this.upperBound;
    }

    attributeUnderBounds(attribute: number): boolean {
        return attribute < this.lowerBound;
    }

    incrementAttributeBy(increment: number, attribute: number): number {
        let target: number = attribute + increment;
        if (target > this.upperBound) {
            attribute = this.upperBound;
        } else if (target < this.lowerBound) {
            attribute = this.lowerBound;
        } else {
            attribute = target;
        }
        return attribute;
    }

    getAttributeAsPercentage(attribute: number): number {
        return attribute / this.upperBound;
    }
}

//holds the user input of promises and who they are promising
export interface promises {
    promise: Commitment;
    promiseTo: Agent;
}

export interface choices {
    choice: Choice;
    choiceTo: Agent;
}

export interface userChoice {}

export class Agent extends AttributeContainer {
    public id: number;
    public coords: [number, number];
    public name: string;
    public resources: number;
    public ideology: Ideology;
    public mood: number;
    public promises: promises[] = [];
    public choices: choices[] = [];

    public face: Face;
    public hat: Hat;
    public spot: number;

    constructor(
        name: string,
        ideology: Ideology,
        resources: number,
        mood: number,
        id: number,
        coords: [number, number],
        spot: number,
        level: number
    ) {
        super();
        this.name = name;
        this.ideology = ideology;
        this.mood = mood;
        this.id = id;
        this.coords = coords;
        this.spot = spot;
        // Create player based off current level
        let defaultPawns = getDefaultPawns(level);
        if (spot >= 0) {
            let defFace = Object.values(Face)[defaultPawns[this.spot].defFace];
            let defHat = Object.values(Hat)[defaultPawns[this.spot].defHat];

            this.face = Face[defFace as keyof typeof Face];
            this.hat = Hat[defHat as keyof typeof Hat];
            this.name = defaultPawns[this.spot].defName;
            this.resources = defaultPawns[this.spot].resources;
        }
        // Create Random players
        else {
            //this is why I hate enums
            //also this should later be changed to a generator function to allow player selected appearance
            let randface =
                Object.values(Face)[
                    Math.floor(Math.random() * (Object.values(Face).length / 2))
                ];
            let randhat =
                Object.values(Hat)[
                    Math.floor(Math.random() * (Object.values(Hat).length / 2))
                ];

            this.face = Face[randface as keyof typeof Face];
            this.hat = Hat[randhat as keyof typeof Hat];
            this.resources = resources;
        }
    }

    //adds a promise to list of promises in agent
    updatePromise(commitment: Commitment, promiseTo: Agent) {
        const newPromise: promises = {
            promise: commitment,
            promiseTo: promiseTo,
        };

        const found = this.promises.some((e) => e.promiseTo === promiseTo);

        if (!found) {
            this.promises.push(newPromise);
        } else {
            const promise = this.getPromiseTo(promiseTo);
            if (promise) {
                promise.promise = commitment;
            }
        }
    }

    //adds choice from player to list of choices
    //NOTE on a consecutive round if a player has not chosen a promise, the previous round promise is used
    updateChoice(choice: Choice, choiceTo: Agent) {
        const newChoice: choices = {
            choice: choice,
            choiceTo: choiceTo,
        };

        const found = this.choices.some((e) => e.choiceTo === choiceTo);

        if (!found) {
            this.choices.push(newChoice);
        } else {
            const aChoice = this.getChoiceTo(choiceTo);
            if (aChoice) {
                aChoice.choice = choice;
            }
        }
    }

    getPromiseTo(agent: Agent) {
        return this.promises.find((e) => e.promiseTo === agent);
    }

    getChoiceTo(agent: Agent) {
        return this.choices.find((e) => e.choiceTo === agent);
    }

    //rewards resources base off agent's choices
    rewardResources(myChoice: Choice, theirChoice: Choice) {
        if (myChoice === Choice.Cooperate && theirChoice === Choice.Cooperate)
            this.resources += 1;
        else if (
            myChoice === Choice.Cooperate &&
            theirChoice === Choice.Compete
        )
            this.resources -= 2;
        else if (
            myChoice === Choice.Compete &&
            theirChoice === Choice.Cooperate
        )
            this.resources += 3;
        else if (myChoice === Choice.Compete && theirChoice === Choice.Compete)
            this.resources -= 1;
    }

    getMoodDescription(): string {
        if (this.mood > 15) {
            return "Joyful";
        } else if (this.mood > 11) {
            return "Pleased";
        } else if (this.mood > 7) {
            return "Feeling fine";
        } else if (this.mood > 3) {
            return "Stressed";
        } else {
            return "Very upset";
        }
    }

    spendResources(cost: number) {
        this.resources -= cost;
    }
}

//generosity and forgivness still need to be removed
export class Ideology extends AttributeContainer {
    private role: Strategy;

    constructor(role?: number) {
        super();
        if (role) {
            this.role = role
        } 
        this.role =  Math.floor(Math.random() * 5);
    }

        // get the strategy associated with this ideology
        toStrategy(): Strategy {
            return this.role;
        }
    
        setStrategy(newRole: Strategy) {
            this.role = newRole;
        }
}



export class Relation extends AttributeContainer {
    history: TurnLog;
    influence: number;
    resourcesSpent: number;
    opinion: number;

    constructor(influence: number, opinion: number) {
        super();
        this.history = new TurnLog();
        this.resourcesSpent = 0;
        if (this.attributeInBounds(influence)) {
            this.influence = influence;
        } else {
            throw new Error("influence out of bounds: should be [0, 20)");
        }
        if (this.attributeInBounds(opinion)) {
            this.opinion = opinion;
        } else {
            throw new Error("opinion out of bounds: should be [0, 20)");
        }
    }

    updateOpinion(
        theirInfluence: number,
        theirAvgChoice: number,
        yourVolatility: number
    ): void {
        // 0-1 range
        const volatilityQuotient = yourVolatility / 19;
        const zeroCenteredAvgChoice = theirAvgChoice - 0.5;
        let opinionChange =
            theirInfluence * volatilityQuotient * zeroCenteredAvgChoice;
        this.opinion = this.incrementAttributeBy(opinionChange, this.opinion);
    }

    getDescriptiveInfluence(): string {
        if (this.influence > 15) {
            return "follows your lead";
        } else if (this.influence > 11) {
            return "respects your ideas";
        } else if (this.influence > 7) {
            return "feels neutral on your ideas";
        } else if (this.influence > 3) {
            return "doesn't respect your ideas";
        } else {
            return "is offended by your ideas";
        }
    }

    getDescriptiveOpinion(): string {
        if (this.opinion > 15) {
            return "loves you";
        } else if (this.opinion > 11) {
            return "likes you";
        } else if (this.opinion > 7) {
            return "feels neutral on you";
        } else if (this.opinion > 3) {
            return "dislikes you";
        } else {
            return "hates you";
        }
    }
}

// Use this to keep track of which neighbors an Agent is planning on influencing.
export class SpendingContainer {
    public data: Map<Agent, number>;

    constructor() {
        this.data = new Map();
    }
}

export class DriftContainer {
    public data: Map<Ideology, number>;

    constructor() {
        this.data = new Map();
    }
}
