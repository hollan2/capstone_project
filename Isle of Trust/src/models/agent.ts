import { Strategy, TurnLog, Choice } from "./strategy";
import { IdeoStratMap } from "./ideostratmap";
import { Face, Hat } from "../generators/pawn";

export const AGENT_RADIUS = 15;

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

export abstract class MetaAgent extends AttributeContainer {
    public id: number;
    public coords: [number, number];

    constructor(coords: [number, number], id: number) {
        super();
        this.id = id;
        this.coords = coords;
    }

    abstract isAlive(): boolean;
}

export class DeadAgent extends MetaAgent {
    public deadCount: number = 0;

    isAlive(): boolean {
        return false;
    }
}

export class Agent extends MetaAgent {
    public name: string;
    public resources: number;
    public ideology: Ideology;
    public personality: Personality;
    public mood: number;

    public face: Face;
    public hat: Hat;

    constructor(
        name: string,
        ideology: Ideology,
        personality: Personality,
        resources: number,
        mood: number,
        id: number,
        coords: [number, number]
    ) {
        super(coords, id);
        this.name = name;
        this.resources = resources;
        this.ideology = ideology;
        this.personality = personality;
        this.mood = mood;

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
    }

    isAlive(): boolean {
        return true;
    }

    // update the personality in response to how the agent was treated in the previous round.
    updatePersonality() {}

    // update the ideology to match the personality.
    updateIdeology() {}

    adoptIdeology(i: Ideology) {
        this.ideology = new Ideology(i.getGenerosity(), i.getForgiveness());
    }

    rewardResources(myChoice: Choice, theirChoice: Choice) {
        if (myChoice === Choice.Give && theirChoice === Choice.Give)
            this.resources += 2;
        else if (myChoice === Choice.Cheat && theirChoice === Choice.Cheat)
            this.resources += 1;
        else if (myChoice === Choice.Cheat && theirChoice === Choice.Give)
            this.resources += 3;
    }

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

    // Currently, the more volatile a neighbor is, the more resources an agent (you) will spend on them.
    // Reasoning: a more volatile agent is more likely to change to your ideology,
    // so it's best to focus your energies on them.
    // Ideally, this would be some sort of curve, so agents wouldn't use, for example, 10 resources
    // trying to sway a neighbor who would change ideologies for 3 resources.
    autoDisperseInfluence(
        neighbors: Map<MetaAgent, Relation>
    ): SpendingContainer {
        const myPreachability = this.getAttributeAsPercentage(
            this.personality.getPreachiness()
        );
        // an agent may spend up to 50% of their wealth influencing others,
        // depending on their preachiness and random chance
        const imWillingToSpendPct: number =
            (myPreachability + Math.random()) / 4;
        const imWillingToSpend: number = Math.round(
            imWillingToSpendPct * this.resources
        );

        let spendingMap = new SpendingContainer();
        let influencabilityMap: Map<Agent, number> = new Map();
        let totalInfluenceability: number = 0;
        neighbors.forEach((relation, neighbor) => {
            if (neighbor instanceof Agent) {
                const theirInfluenceablitity = neighbor.getInfluenceability();
                influencabilityMap.set(neighbor, theirInfluenceablitity);
                totalInfluenceability += theirInfluenceablitity;
            }
        });

        influencabilityMap.forEach((theirInfluenceablitity, neighbor) => {
            const neighborAllotment: number = Math.round(
                imWillingToSpend *
                    (theirInfluenceablitity / totalInfluenceability)
            );
            spendingMap.data.set(neighbor, neighborAllotment);
        });

        return spendingMap;
    }

    // the more volatile the neighbor,
    // and the unhappier they are,
    // the higher their chance to be influenced.
    getInfluenceability(): number {
        const volatilityPct = this.getAttributeAsPercentage(
            this.personality.getVolatility()
        );
        const moodPct = this.getAttributeAsPercentage(this.mood);
        return (volatilityPct + (1 - moodPct)) / 2;
    }

    acceptInfluenceDispersal(giver: Agent, dispersal: number) {
        giver.resources -= dispersal;
        this.resources += dispersal;
    }

    driftIdeology(driftMap: DriftContainer) {
        let totalGenerosityChange = 0;
        let totalForgivenessChange = 0;
        driftMap.data.forEach((pointsToDriftBy, targetIdeology) => {
            const generosityChange =
                (targetIdeology.getGenerosity() -
                    this.ideology.getGenerosity()) *
                pointsToDriftBy;
            const forgivenessChange =
                (targetIdeology.getForgiveness() -
                    this.ideology.getForgiveness()) *
                pointsToDriftBy;
            totalForgivenessChange += forgivenessChange;
            totalGenerosityChange += generosityChange;
        });
        const totalChange =
            Math.abs(totalForgivenessChange) + Math.abs(totalGenerosityChange);
        if (totalChange) {
            this.ideology.setForgiveness(
                this.ideology.incrementAttributeBy(
                    totalForgivenessChange / totalChange,
                    this.ideology.getForgiveness()
                )
            );
            this.ideology.setGenerosity(
                this.ideology.incrementAttributeBy(
                    totalGenerosityChange / totalChange,
                    this.ideology.getGenerosity()
                )
            );
        }
    }

    spendResources(cost: number) {
        this.resources -= cost;
    }

    updateInfluence() {}
}

// The internal ideological state of an agent which effectively determines the
// strategy which the agent uses, and can change over time.
export class Ideology extends AttributeContainer {
    // how likely they are to give instead of cheat.
    private generosity: number;

    // how likely they are to NOT hold a grudge.
    private forgiveness: number;

    constructor(generosity: number, forgiveness: number) {
        super();
        if (
            this.attributeInBounds(generosity) &&
            this.attributeInBounds(forgiveness)
        ) {
            this.generosity = generosity;
            this.forgiveness = forgiveness;
        } else {
            throw new Error(
                "generosity/forgiveness out of bounds: should be [0, 20)"
            );
        }
    }

    getGenerosity(): number {
        return this.generosity;
    }

    setGenerosity(set: number) {
        if (this.attributeInBounds(set)) {
            this.generosity = set;
        } else {
            throw new Error("attribute out of bounds: should be [0, 20)");
        }
    }

    getForgiveness(): number {
        return this.forgiveness;
    }

    setForgiveness(set: number) {
        if (this.attributeInBounds(set)) {
            this.forgiveness = set;
        } else {
            throw new Error("attribute out of bounds: should be [0, 20)");
        }
    }

    // get the strategy associated with this ideology
    toStrategy(): Strategy {
        return IdeoStratMap[Math.floor(this.forgiveness / 4)][
            Math.floor(this.generosity / 4)
        ];
    }
}

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

    addInfluenceBasedOn(dispersal: number, theirVolatility: number) {
        this.resourcesSpent += dispersal;
        this.influence = this.incrementAttributeBy(
            dispersal * this.getAttributeAsPercentage(theirVolatility),
            this.influence
        );
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
