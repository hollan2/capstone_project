import { Strategy, TurnLog, Choice, Commitment } from "./strategy";
import { Face, Hat } from "../generators/pawn";

export const AGENT_RADIUS = 15;

//Set Default Pawn aesthetics based on level
const getDefaultPawns = (level: number) => {
    if (level >= 1 && level < 6) {
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
        ];
    }
    if (level === 7) {
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
                defName: "Pessimo",
                defFace: 3,
                defHat: 0,
                resources: 0,
            },
            {
                defName: "Domran",
                defFace: 6,
                defHat: 2,
                resources: 8,
            },
            {
                defName: "Profe",
                defFace: 1,
                defHat: 5,
                resources: 15,
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
    public donated: number;
    public ideology: Ideology;
    public initialStrategy: Strategy;
    public personality: Personality;
    public mood: number;
    public promises: promises[] = [];
    public choices: choices[] = [];

    public face: Face;
    public hat: Hat;
    public spot: number;

    constructor(
        name: string,
        ideology: Ideology,
        personality: Personality,
        resources: number,
        donated: number,
        mood: number,
        id: number,
        coords: [number, number],
        spot: number,
        level: number
    ) {
        super();
        this.name = name;
        this.ideology = ideology;
        this.initialStrategy = ideology.toStrategy();
        this.personality = personality;
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
            this.donated = 0;
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
            this.donated = donated;
        }
    }

    /* These functions don't serve a purpose anymore, can be removed
    // update the personality in response to how the agent was treated in the previous round.
    updatePersonality() {}

    // update the ideology to match the personality.
    updateIdeology() {}
    */

    setInitialStrategy(strategy: Strategy) {
        this.initialStrategy = strategy;
    }
    //Reset the resources
    resetResources(initialResources: number) {
        this.resources = initialResources;
        this.donated = 0;
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

    canDonate(): boolean {
        // If an agent has at least 20 resources and has an ideology that can donate return true
        if (this.resources > 20 && this.ideology.canDonate()) {
            return true;
        }
        return false;
    }

    donate(donate: number): number {
        this.resources -= donate;
        this.donated += donate;
        return donate;
    }

    /*This function doesn't serve a purpose anymore, can be removed
    updateMood(myChoice: Choice, theirChoice: Choice) {
        // consider that the average volatilityPct will be 0.50
        const volatilityPct = this.getAttributeAsPercentage(
            this.personality.getVolatility()
        );
        if (myChoice === Choice.Give && theirChoice === Choice.Give) {
            // prettier-ignore
            // on average, this will increase the mood by 1
            this.mood = this.incrementAttributeBy(
                0.5 + (1 * volatilityPct),
                this.mood
            );
        } else if (myChoice === Choice.Give && theirChoice === Choice.Cheat) {
            // prettier-ignore
            // on average, this will decrease the mood by -2
            this.mood = this.incrementAttributeBy(
                -1 + (-2 * volatilityPct),
                this.mood
            );
        } else if (myChoice === Choice.Cheat && theirChoice === Choice.Cheat) {
            // prettier-ignore
            // on average, this will decrease the mood by -1
            this.mood = this.incrementAttributeBy(
                -0.5 + (-1 * volatilityPct),
                this.mood
            );
        }
    }
    */

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
    // how likely they are to give instead of cheat.
    private generosity: number;

    // how likely they are to NOT hold a grudge.
    private forgiveness: number;

    private isTutorial: boolean;
    
    private role: Strategy;

    constructor(generosity: number, forgiveness: number, isTutorial: boolean) {
        super();
        if (
            this.attributeInBounds(generosity) &&
            this.attributeInBounds(forgiveness)
        ) {
            this.generosity = generosity;
            this.forgiveness = forgiveness;
            this.isTutorial = isTutorial;
        } else {
            throw new Error(
                "generosity/forgiveness out of bounds: should be [0, 20)"
            );
        }
        // Sets Strategy to Player type
        if (generosity === 12 && isTutorial == true) {
            this.role = 5;
        }
        // Sets Strategy to Reciprocator type
        else if (generosity === 19 && isTutorial == true) {
            this.role = 3;
        }
        // Sets Strategy to Student type
        else if (generosity === 15 && isTutorial == true) {
            this.role = 1;
        }
        // Sets Strategy to Teacher type
        else if (generosity === 13 && isTutorial == true) {
            this.role = 4;
        }
        // Sets Strategy to Random type
        else if (generosity === 10 && isTutorial == true) {
            this.role = 2;
        }
        // Sets Strategy to Supicious type
        else if (generosity === 5 && isTutorial == true) {
            this.role = 0;
        }
        // Randomly selects a Strategy
        else {
            this.role = Math.floor(Math.random() * 5);
        }
    }

    // get the strategy associated with this ideology
    toStrategy(): Strategy {
        return this.role;
    }

    setStrategy(newRole: Strategy) {
        this.role = newRole;
    }

    canDonate(): boolean {
        // Returns true for reciprocators and teachers since they can to donate. All others can't
        if (this.role == 3 || this.role == 4) {
            return true;
        }
        return false;
    }
}

//PERSONALITY IS NO LONGER IN USE
// Immutable personality traits which affect how the agent influences others and
// adapts their own ideology.
export class Personality extends AttributeContainer {
    // how quickly they change their personality based on their neighbors
    // (e.g. misers becoming generous after being treated well.)
    // an agent with a volatility of [insert lowest possible value here] will never change.
    private volatility: number;

    // how likely an agent is to try to spread their ideology on a given turn.
    private preachiness: number;

    getVolatility(): number {
        return this.volatility;
    }

    setVolatility(set: number) {
        if (this.attributeInBounds(set)) {
            this.volatility = set;
        } else {
            throw new Error("attribute out of bounds: should be [0, 20)");
        }
    }

    getPreachiness(): number {
        return this.preachiness;
    }

    setPreachiness(set: number) {
        if (this.attributeInBounds(set)) {
            this.preachiness = set;
        } else {
            throw new Error("attribute out of bounds: should be [0, 20)");
        }
    }

    // get the strategy associated with this ideology
    constructor(volatility: number, preachiness: number) {
        super();
        if (
            this.attributeInBounds(volatility) &&
            this.attributeInBounds(preachiness)
        ) {
            this.volatility = volatility;
            this.preachiness = preachiness;
        } else {
            throw new Error(
                "volatility/preachiness out of bounds: should be [0, 20)"
            );
        }
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

    /*This function doesn't serve a purpose anymore, can be removed
    addInfluenceBasedOn(dispersal: number, theirVolatility: number) {
        this.resourcesSpent += dispersal;
        this.influence = this.incrementAttributeBy(
            dispersal * this.getAttributeAsPercentage(theirVolatility),
            this.influence
        );
    }
    */
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
