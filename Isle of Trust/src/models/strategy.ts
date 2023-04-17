// The strategy an agent uses is determined during gameplay based on their personality.
// The associated taglines are used on the front-end to describe each strategy's philosophy.
export enum Strategy {
    // For testing
    Default,
    // Pure altruism
    Dove,
    // Pure selfishness
    Hawk,
    // Grudger
    Grim,
    // Anti-grudger; starts mean but is forgiving
    AntiGrim,
    // Cheat-cheat-give
    TweedleDum,
    // Give-give-cheat
    TweedleDee,
    // Copycat
    TitForTat,
}

export const taglineFromStrategy = (strat: Strategy): string => {
    switch (strat) {
        case Strategy.Default:
            return "I'm just here to try things out.";
        case Strategy.Dove:
            return "Everyone deserves to thrive!";
        case Strategy.Hawk:
            return "Every man for himself!";
        case Strategy.Grim:
            return "No second chances.";
        case Strategy.AntiGrim:
            return "You can't trust anyone.";
        case Strategy.TweedleDum:
            return "I'll help if I feel like it.";
        case Strategy.TweedleDee:
            return "Let's get along... please?";
        case Strategy.TitForTat:
            return "What's in it for me?";
        default:
            return "";
    }
};

export enum Choice {
    Cheat,
    Give,
}

//NATON added a enum for promises
export enum Commitment {
    Compete,
    Cooperate,
    Reciprocate, 
}

//generates the action the agent will committ to
//TODO changing the strategies to our new system
export const generateChoice = (
    v1Promise: Commitment, 
    v2Promise: Commitment,
    strat: Strategy,
    //removed the mood since it wasn't factored into choice rn anyways
    theirHistory: TurnLog
): Choice => {
    switch (strat) {
        case Strategy.Default:
            return Default(v1Promise, v2Promise);
        /*
        case Strategy.Dove:
            return Choice.Give;
        case Strategy.Hawk:
            return Choice.Cheat;
        case Strategy.Grim:
            return Grim(theirHistory);
        case Strategy.AntiGrim:
            return AntiGrim(theirHistory);
        case Strategy.TweedleDum:
            return TDum(theirHistory);
        case Strategy.TweedleDee:
            return TDee(theirHistory);
        case Strategy.TitForTat:
            return CopyCat(theirHistory);
        */
        default:
            console.log(`warn: unknown strategy ${strat}`);
    }

    return Choice.Give;
};

//temp function to generate promises Naton
//TODO impelment new strategies into the promise
export const generateCommitment = (
    strat: Strategy,
    theirHistory: TurnLog
): Commitment => {
    switch (strat) {
        case Strategy.Default:
            {
            //randomly chooses between Compete, Cooperate and Reciprocate
            const randomNum = Math.random();
            if (randomNum <= 0.3)
                return Commitment.Compete;
            if(randomNum > 0.3 && randomNum < 0.6) 
                return Commitment.Reciprocate;
            else
                return Commitment.Cooperate
            }

        default:
            console.log(`warn: unknown strategy ${strat}`);
    }
    
    return Commitment.Cooperate;   
};

//Gets the opposite choice of the Commitment
export const getLie = (
    v1Promise: Commitment, 
    v2Promise: Commitment,
): Choice => {
    switch (v1Promise){
        case Commitment.Compete:
            return Choice.Cheat;
        case Commitment.Cooperate:
            return Choice.Cheat;
        case Commitment.Reciprocate:
            if(v2Promise == Commitment.Compete)
                return Choice.Give;
            else
                return Choice.Cheat;
        default:
            return Choice.Give;

    }
}

//Get the Choice corsponding to the Commitment
export const getTruth = (
    v1Promise: Commitment, 
    v2Promise: Commitment,
): Choice => {
    switch (v1Promise){
        case Commitment.Compete:
            return Choice.Cheat;
        case Commitment.Cooperate:
            return Choice.Give;
        case Commitment.Reciprocate:
            if(v2Promise == Commitment.Compete)
                return Choice.Cheat;
            else
                return Choice.Give;
        default:
            return Choice.Give;
    }
}


export class Turn {
    //agent Action NATON
    public choice: Choice;
    //changed the unused commitment variable from type Choice to new type Commitment
    //agent Promise NATON
    public commitment: Commitment;

    constructor(choice: Choice, commitment: Commitment) { 
        this.choice = choice;
        this.commitment = commitment;

    }
}

export class choiceTally {
    public gave: number;
    public cheated: number;

    constructor() {
        this.gave = 0;
        this.cheated = 0;
    }

    public tallyChoices(turnLog: TurnLog) {
        let history = turnLog.actions;
        for (let i = 0; i < history.length; ++i) {
            let action = history[i];
            if (action.choice === Choice.Give) {
                this.gave += 1;
            } else {
                this.cheated += 1;
            }
        }
    }
}

export class TurnLog {
    public actions: Turn[];

    constructor() {
        this.actions = [];
    }

    public addTurn(turn: Turn) {
        this.actions.push(turn);
    }

    public lastAction(): Choice {
        if (this.actions.length === 0) {
            return Choice.Give;
        }
        return this.actions[this.actions.length - 1].choice;
    }

    public length(): number {
        return this.actions.length;
    }

    public getList(): Turn[] {
        return this.actions;
    }

    // returns a number between Choice.Give (0) and Choice.Cheat (1)
    public getAvgChoice(maxSampleLength: number): number {
        let actionsLength = this.actions.length;
        let sampleLength =
            actionsLength < maxSampleLength ? actionsLength : maxSampleLength;

        let sumAll: number = 0;
        for (let i: number = 0; i < sampleLength; ++i) {
            sumAll += this.actions[i].choice;
        }

        const avg: number = sumAll / sampleLength;
        return avg;
    }
}

const CopyCat = function (history: TurnLog): Choice {
    return history.lastAction();
};

//Default has a 10% chance of lying
const Default = function (v1Promise: Commitment, v2Promise: Commitment): Choice {
    const lieChoice = getLie(v1Promise, v2Promise);
    const truthChoice = getTruth(v1Promise, v2Promise);

    if (Math.random() <= 0.1)
        return lieChoice
    return truthChoice;
};


const Grim = function (history: TurnLog): Choice {
    let temphist = history.actions;
    for (var i = 0; i < history.length(); i++) {
        if (temphist[i].choice === Choice.Cheat) {
            return Choice.Cheat;
        }
    }
    return Choice.Give;
};

const AntiGrim = function (history: TurnLog): Choice {
    let temphist = history.actions;
    for (var i = 0; i < history.length(); i++) {
        if (temphist[i].choice === Choice.Give) {
            return Choice.Give;
        }
    }
    return Choice.Cheat;
};

const TDum = function (history: TurnLog): Choice {
    let temphist = history.actions;
    let timesCheated = 0;
    for (var i = 0; i < history.length(); i++) {
        if (temphist[i].choice === Choice.Cheat) {
            timesCheated += 1;
        }
    }
    if (timesCheated % 3 === 2) {
        return Choice.Give;
    }
    return Choice.Cheat;
};

const TDee = function (history: TurnLog): Choice {
    let temphist = history.actions;
    let timesCheated = 0;
    for (var i = 0; i < history.length(); i++) {
        if (temphist[i].choice === Choice.Cheat) {
            timesCheated += 1;
        }
    }
    if (timesCheated % 3 === 0) {
        return Choice.Give;
    }
    return Choice.Cheat;
};
