// The strategy an agent uses is determined during gameplay based on their personality.

import { time } from "console";
import { createTypePredicateNodeWithModifier } from "typescript";
import { compileFunction } from "vm";

// The associated taglines are used on the front-end to describe each strategy's philosophy.
export enum Strategy {
    //Always suspicious of others
    Suspicious,
    //suspicious but can learn
    Student,
    //compeletly random on what it wants to do
    Random,
    //Will match you
    Reciprocator,
    //Wants others to do cooperate
    Teacher,
    //player
    Player

}

export const taglineFromStrategy = (strat: Strategy): string => {
    switch (strat) {
        case Strategy.Suspicious:
            return "You can't trust anyone.";
        case Strategy.Student:
            return "I need guidance.";
        case Strategy.Random:
            return "Let chaos reign!";
        case Strategy.Reciprocator:
            return "I'll match what you promise.";
        case Strategy.Teacher:
            return "I am here to guide others.";
        case Strategy.Player:
            return "I'm just here to try things out.";
        default:
            return "";
    }
};

export enum Choice {
    Compete,
    Cooperate,
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
    theirHistory: TurnLog
): Choice => {
    switch (strat) {
        case Strategy.Suspicious:
            return Choice.Compete
        case Strategy.Student:
            return Student(v1Promise, v2Promise, theirHistory)
        case Strategy.Random:
            return Random(v1Promise, v2Promise)
        case Strategy.Reciprocator:
            return getTruth(v1Promise, v2Promise);
        case Strategy.Teacher:
            return getTruth(v1Promise, v2Promise);
        default:
            console.log(`warn: unknown strategy ${strat}`);
    }

    return Choice.Compete;
};

export const generateCommitment = (
    strat: Strategy,
    theirHistory: TurnLog
): Commitment => {
    switch (strat) {
        //alwats returns compete
        case Strategy.Suspicious:
            return Commitment.Compete;

        case Strategy.Student:
            {
                //if a streak of 3 cooperates has ever been peformed by a neighbour we want to reciprocate
                let temphist = theirHistory.actions;
                let timesCooperate = 0;
                for (var i = 0; i < theirHistory.length(); i++) {
                    if (temphist[i].choice === Choice.Cooperate)
                        timesCooperate += 1;
                    //if the 3 cooperates aren't in succession, we set timeCooperate back to 0
                    else if(timesCooperate < 3) 
                        timesCooperate = 0;
                }

                if(timesCooperate >= 3)
                    return Commitment.Reciprocate

                return Commitment.Compete
            }

        case Strategy.Random:
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
        case Strategy.Reciprocator:
            return Commitment.Reciprocate;
        case Strategy.Teacher:
            {
                console.log(theirHistory.getAvgChoice(3))
                if(theirHistory.length() != 0 && theirHistory.getAvgChoice(3) != 1)            
                    return Commitment.Cooperate
                return Commitment.Reciprocate
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
            return Choice.Compete;
        case Commitment.Cooperate:
            return Choice.Cooperate;
        case Commitment.Reciprocate:
            if(v2Promise == Commitment.Compete)
                return Choice.Cooperate;
            else
                return Choice.Compete;
        default:
            return Choice.Cooperate;

    }
}

//Get the Choice corsponding to the Commitment
export const getTruth = (
    v1Promise: Commitment, 
    v2Promise: Commitment,
): Choice => {
    switch (v1Promise){
        case Commitment.Compete:
            return Choice.Compete;
        case Commitment.Cooperate:
            return Choice.Cooperate;
        case Commitment.Reciprocate:
            if(v2Promise == Commitment.Compete)
                return Choice.Compete;
            else
                return Choice.Cooperate;
        default:
            return Choice.Cooperate;
    }
}


export class Turn {
    //The agent's Action
    public choice: Choice;
    //changed the unused commitment variable from type Choice to new type Commitment
    //The agent's Promise
    public commitment: Commitment;
    //Determines if the turn is an honest or lie move
    public truth: String;

    constructor(choice: Choice, commitment: Commitment, truth: String) { 
        this.choice = choice;
        this.commitment = commitment;
        this.truth = truth;

    }
}

export class choiceTally {
    public together: number;
    public solo: number;
    public honest: number;
    public cheated: number;

    constructor() {
        this.together = 0;
        this.solo = 0;
        this.honest = 0;
        this.cheated = 0;
    }

    public tallyChoices(turnLog: TurnLog) {
        let history = turnLog.actions;
        for (let i = 0; i < history.length; ++i) {
            let action = history[i];
            if (action.choice === Choice.Cooperate) 
                this.together += 1;
            else if (action.choice === Choice.Compete) 
                this.solo += 1;
            if (action.truth === "Lied")
                this.cheated += 1;
            else 
                this.honest += 1;
        }
    }
}

export class TurnLog {
    public actions: Turn[];

    constructor() {
        this.actions = [];
    }

    public resetTurns(){
        this.actions = [];
    }

    public addTurn(turn: Turn) {
        this.actions.push(turn);
    }

    public lastAction(): Choice {
        if (this.actions.length === 0) {
            return Choice.Cooperate;
        }
        return this.actions[this.actions.length - 1].choice;
    }

    public length(): number {
        return this.actions.length;
    }

    public getList(): Turn[] {
        return this.actions;
    }

    // returns a number between Choice.Give (1) and Choice.Cheat (0)
    //countdowns from thhe top
    public getAvgChoice(maxSampleLength: number): number {
        let actionsLength = this.actions.length;
        let sampleLength =
            actionsLength < maxSampleLength ? actionsLength : maxSampleLength;

        let endGoal: number = actionsLength - sampleLength;
        let sumAll: number = 0;
        for (let i: number = actionsLength; i > endGoal; i--) {
            console.log(actionsLength, sampleLength, this.actions, endGoal, i)
            sumAll += this.actions[i-1].choice;
        }

        const avg: number = sumAll / sampleLength;
        return avg;
    }

}


//THE AGENT CHOICE FUNCTIONS

const Suspicious = function(): Choice {
    return Choice.Compete;
};

const Student = function(v1Promise: Commitment, v2Promise: Commitment, theirHistory: TurnLog): Choice {
    let temphist = theirHistory.actions;
    let timesCooperate = 0;
    

    for (var i = 0; i < theirHistory.length(); i++) {
        if (temphist[i].choice === Choice.Cooperate)
            timesCooperate += 1;
        //if the 3 cooperates aren't in succession, we set timeCooperate back to 0
        else if(timesCooperate < 3) 
            timesCooperate = 0;
    }

    if(timesCooperate >= 3)
        return getTruth(v1Promise, v2Promise);
    return Choice.Compete;
};

const Random = function(v1Promise: Commitment, v2Promise: Commitment): Choice {
    const lieChoice = getLie(v1Promise, v2Promise);
    const truthChoice = getTruth(v1Promise, v2Promise);

    if (Math.random() <= 0.5)
        return lieChoice
    return truthChoice;  
}

