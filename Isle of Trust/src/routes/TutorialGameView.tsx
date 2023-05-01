import React from "react";
import * as RK from "react-konva";
import "../css/App.css";
import Konva from "konva";
import { TutorialGuide } from "../components/tutorialGuide";
import { TutorialBoard } from "../components/tutorialBoard";
import { TutorialPlayerSidebar } from "../components/tutorialPlayerSidebar";
import { TutorialSelectedSidebar } from "../components/tutorialSelectedSidebar";
import { useLocation } from "react-router-dom";
import useImage from "use-image";
import * as util from "../utilities";
import {
    AnimResources,
    AnimInfluence,
    AnimChoice,
    AnimMood,
    AnimChangeIdeology,
} from "../models/animation";

import { Face, Hat, GeneratePawn } from "../generators/pawn";
import { Grid } from "../generators/map";
import { SidebarState } from "../components/sideBarState";
import {
    Agent,
    AGENT_RADIUS,
    Relation,
    Ideology,
    Personality,
    SpendingContainer,
    DriftContainer,
} from "../models/agent";
import { Graph } from "../models/graph";
import {
    taglineFromStrategy,
    generateChoice,
    Turn,
    choiceTally,
    Strategy,
    generateCommitment,
    Commitment,
} from "../models/strategy";
/*
import { isAccordionItemSelected } from "react-bootstrap/esm/AccordionContext";
*/
import { KonvaEventObject } from "konva/lib/Node";
import { getActiveElement } from "@testing-library/user-event/dist/utils";
import { ThemeConsumer } from "react-bootstrap/esm/ThemeProvider";
import { timingSafeEqual } from "crypto";
import { allowedNodeEnvironmentFlags } from "process";
/*
import { timeStamp } from "console";
*/
export const RESIZE_TIMEOUT = 500;

export const SCENE_WIDTH = 800;
export const SCENE_HEIGHT = 600;
export const MAX_SIDEBAR_AGENT_WIDTH = 150;
export const MAX_SIDEBAR_AGENT_HEIGHT = 225;
const AGENT_IMAGE_WIDTH = 400;
const AGENT_IMAGE_HEIGHT = 594;
const MOOD_IMAGE_SIDE_LENGTH = 511;

const RESOURCE_LOST_PER_TURN = 3;
const BASE_INFLUENCE_LOST_PER_TURN = 2;

export const MAP_URL: { [key: string]: string } = {
    Pronged: "url(../Maps/mapPronged.png)",
    Choke: "url(../Maps/mapChoke.png)",
    Ring: "url(../Maps/mapRing.png)",
    Spokes: "url(../Maps/mapSpokes.png)",
    Crescent: "url(../Maps/mapCrescent.png)",
    Small: "url(../Maps/mapSmall.png)",
};

//export let MAP_INDEX = 0;
let currentMap = "Pronged";

const DIFFICULTY_VALUES: { [key: string]: number } = {
    easy: 19,
    medium: 15,
    hard: 10,
    extreme: 5,
};

interface GameViewState {
    map: Graph<Agent, Relation>;
    sidebarState: SidebarState;
    select: (agent: Agent) => void;
    turnCount: number;
    selectCharacterDisplay: boolean;
    userPromise: number;
    promiseRelation: any;
    stageCount: number;
}

export interface StartInfo {
    //Using strings until it's connected up
    name: string;
    hat: string;
    face: string;
    ideologyColor: string;
    startingPoints: string;
    mapImage: string;
    level: number;
}

export function TutorialDisplay() {
    const location = useLocation();
    const userState = {
        name: "User Player",
        hat: "None",
        face: "Glasses",
        ideologyColor: "9ec4ea",
        startingPoints: "Easy",
        mapImage: "Small",
        level: parseInt(location.pathname.replace(/^\D+/g, "")),
    };

    //logs the values chosen for the player character
    console.log("Game function for routing");
    console.log(userState);
    return (
        <TutorialView
            name={userState.name}
            hat={userState.hat}
            face={userState.face}
            ideologyColor={userState.ideologyColor}
            startingPoints={userState.startingPoints}
            mapImage={userState.mapImage}
            level={userState.level}
        />
    );
}

class TutorialView extends React.Component<StartInfo, GameViewState> {
    private stageRef = React.createRef<Konva.Stage>();
    public player_id: number = 0;
    constructor(props: StartInfo) {
        super(props);
        // Here may be some kind of switch to generate map
        // type based on props, for now it's just the grid
        const map = new Grid(
            props.mapImage,
            DIFFICULTY_VALUES[props.startingPoints]
        ).getGraph();
        const turnCount = 0;
        const stageCount = 0;
        var promiseRelation;

        currentMap = props.mapImage;
        
       // Puts User Player in position 1 on map
        const position = 0;
        const player =
            map.getVertices()[position];
        
        //generates player with chosen face/hat/name/ideology
        if (player instanceof Agent) {
            player.face = Face[props.face as keyof typeof Face];
            player.hat = Hat[props.hat as keyof typeof Hat];
            player.name = props.name;

            this.player_id = player.id;

            switch (props.ideologyColor) {
                case "9ec4ea":
                    //Dove
                    player.ideology = new Ideology(19, 19);
                    break;
                case "df7e68":
                    //Hawk
                    player.ideology = new Ideology(0, 0);
                    break;
                case "f8b365":
                    //Grim
                    player.ideology = new Ideology(19, 0);
                    break;
                case "ffda5c":
                    //AntiGrim
                    player.ideology = new Ideology(0, 19);
                    break;
                case "b4a6d8":
                    //TitforTat
                    player.ideology = new Ideology(14, 19);
                    break;
                case "b5d8a6":
                    //Dum
                    player.ideology = new Ideology(0, 5);
                    break;
                case "a1c4ca":
                    //Dee
                    player.ideology = new Ideology(19, 5);
                    break;
            }
        }

        // Set selected to position 1 so user is first player selected on load in
        let selected = map.getVertices()[position+1];

        let sidebarState = new SidebarState(map, player, selected,position);

        let select = (agent: Agent) => {
            sidebarState.selected = agent;
            sidebarState.playerToSelected = map.getEdge(player, agent)!;
            sidebarState.selectedToPlayer = map.getEdge(agent, player)!;
            sidebarState.influenceChoices = new SpendingContainer();
            this.setState({ sidebarState: sidebarState });
        };

        this.state = {
            map: map,
            sidebarState: sidebarState,
            select: select,
            turnCount: turnCount,
            stageCount: stageCount,
            selectCharacterDisplay: false,
            userPromise: -1,
            promiseRelation: promiseRelation,
        };

        //Needed for setState function
        this.deselectCharacter = this.deselectCharacter.bind(this);

        //checking to see if props are coming in
        console.log("GameView");
        console.log(props);
    }

    tallyChoicesForAllNeighbors(
        map: Graph<Agent, Relation>,
        you: Agent
    ): choiceTally {
        const neighbors = map.getEdges(you);
        let tally;
        let sumChoices = new choiceTally();
        if (neighbors) {
            neighbors.forEach((relation, neighbor) => {
                tally = new choiceTally();
                tally.tallyChoices(relation.history);
                sumChoices.gave += tally.gave;
                sumChoices.cheated += tally.cheated;
            });
        }
        return sumChoices;
    }

    //Should be removed but too many lines of code rely on this to do it yet
    countTotalInfluence(map: Graph<Agent, Relation>, agent: Agent): String {
        const neighbors = map.getEdges(agent);
        let totalInfluence = 0;
        let numberOfNeighbors = 0;
        if (neighbors) {
            neighbors.forEach((relation, neighbor) => {
                totalInfluence += relation.influence;
                numberOfNeighbors += 1;
            });
        }

        const proportionalInfluence = totalInfluence / numberOfNeighbors;

        const preachiness = agent.personality.getPreachiness();
        if (proportionalInfluence > 15) {
            return "revered";
        } else if (proportionalInfluence > 11) {
            return "valued";
        } else if (proportionalInfluence > 7) {
            return "known";
        } else if (proportionalInfluence > 3) {
            return "unpopular";
        } else {
            return "ignored";
        }
    }

    // tempRound is passed to SideBar as a prop, then passed to InfluenceMenu to be used as an
    // onClick event for the give/cheat/influence buttons.
    tempTurn() {
        const vertices = this.state.map.getVertices();
        const edges = this.state.map.getAllEdges();

        //these lines can be removed
        //this.drainInfluence(edges);
        //this.handleInfluenceChanges(vertices);

        this.generateRound(edges);
        //this.drainResources(vertices);

        this.forceUpdate();
    }

    drainResources(vertices: Agent[]) {
        vertices.forEach((v1) => {
            v1.resources -= RESOURCE_LOST_PER_TURN;
        });
    }

    /* THESE functions don't serve a purpose anymore, can be removed
    drainInfluence(edges: [Agent, Agent, Relation][]) {
        edges.forEach(([v1, v2, e]) => {
            const v2Agent = v2 as Agent;
            const maxInfluenceChange =
                BASE_INFLUENCE_LOST_PER_TURN *
                v2Agent.getInfluenceability();
            e.influence = e.incrementAttributeBy(
                -maxInfluenceChange,
                e.influence
            );
        });
    }

    handleInfluenceChanges(vertices: Agent[]) {
        vertices.forEach((v1) => {
                const v1Relations = this.state.map.getEdges(v1)!;
                let spendingMap = new SpendingContainer();
                if (v1 === this.state.sidebarState.player) {
                    spendingMap = this.state.sidebarState.influenceChoices;
                } else {
                    spendingMap = v1.autoDisperseInfluence(v1Relations);
                }
                spendingMap.data.forEach((allotment, v2) => {
                    v2.resources += allotment;
                    v1.resources -= allotment;
                    this.state.map
                        .getEdge(v1, v2)!
                        .addInfluenceBasedOn(
                            allotment,
                            v2.personality.getVolatility()
                        );
                });
                this.driftIdeology(v1);
        });
    }
    */

    //generates the promises for each agent and returns them as a part of an array that indludes the agents and relation
    generatePromiseRound(edges: [Agent, Agent, Relation][]) {
        var Promise_relation: [
            Agent,
            Agent,
            Relation,
            Commitment,
            Commitment
        ][] = [];
        edges.forEach(([v1, v2, e1]) => {
            const e2 = this.state.map.getEdge(v2, v1);
            if (v1.id < v2.id && e2 instanceof Relation) {
                const v1Strat = v1.ideology.toStrategy();
                const v2Strat = v2.ideology.toStrategy();
                var v1Promise;
                var v2Promise;

                //checks if agent1 is the player agent if so we get the player selected promise
                if (v1.id == this.player_id) {
                    //gets player inputted promises
                    const obj = v1.promises.find((e) => e.promiseTo === v2);
                    if (obj) {
                        v1Promise = obj.promise;
                    } else {
                        //if player didnt choose a promise randomly chooses promises
                        v1Promise = generateCommitment(v1Strat, e2.history);
                    }
                } else {
                    //generates the promise of the agent1
                    v1Promise = generateCommitment(v1Strat, e2.history);

                    //stores AI promises for use in front end
                    v1.updatePromise(v1Promise, v2);
                }

                //checks if agent2 is the player agent if so we get the player selected choice
                if (v2.id == this.player_id) {
                    //gets player inputted promises
                    const obj = v2.promises.find((e) => e.promiseTo === v1);
                    if (obj) {
                        v2Promise = obj.promise;
                    } else {
                        //if player didnt choose a promise randomly chooses promises
                        v2Promise = generateCommitment(v1Strat, e2.history);
                    }
                } else {
                    //generates the promise of the agent2
                    v2Promise = generateCommitment(v2Strat, e1.history);

                    //stores AI promises for use in front end
                    v2.updatePromise(v2Promise, v1);
                }

                //gets us the full array of promises between agents to pass back to generaterounds
                Promise_relation.push([v1, v2, e1, v1Promise, v2Promise]);
            }
        });
        return Promise_relation;
    }

    //accepts in the edges array with the addtional commitment info. Then generates the agent's choices
    generateChoiceRound(
        edges: [Agent, Agent, Relation, Commitment, Commitment][]
    ) {
        edges.forEach(([v1, v2, e1, v1Promise, v2Promise]) => {
            const e2 = this.state.map.getEdge(v2, v1);
            if (v1.id < v2.id && e2 instanceof Relation) {
                const v1Strat = v1.ideology.toStrategy();
                const v2Strat = v2.ideology.toStrategy();
                var v1Choice;
                var v2Choice;

                //checks if agent1 is the player agent if so we get the player selected choice
                if (v1.id == this.player_id) {
                    //gets player inputted choices
                    const obj = v1.choices.find((e) => e.choiceTo === v2);
                    if (obj) {
                        v1Choice = obj.choice;
                    } else {
                        console.log("NO CHOICE SELECTED");
                        //if player didnt choose a promise randomly chooses choice
                        v1Choice = generateChoice(
                            v1Promise,
                            v2Promise,
                            v1Strat,
                            e2.history
                        );
                    }
                } else {
                    v1Choice = generateChoice(
                        v1Promise,
                        v2Promise,
                        v1Strat,
                        e2.history
                    );
                }

                //checks if agent2 is the player agent if so we get the player selected choice
                if (v2.id == this.player_id) {
                    //gets player inputted choices
                    const obj = v2.choices.find((e) => e.choiceTo === v1);
                    if (obj) {
                        v2Choice = obj.choice;
                    } else {
                        console.log("NO CHOICE SELECTED");
                        //if player didnt choose a choice randomly chooses choice
                        v2Choice = generateChoice(
                            v1Promise,
                            v2Promise,
                            v1Strat,
                            e2.history
                        );
                    }
                } else {
                    v2Choice = generateChoice(
                        v2Promise,
                        v1Promise,
                        v2Strat,
                        e1.history
                    );
                }

                console.log(v1.name, v1Choice, v1Promise);
                console.log(v2.name, v2Choice, v2Promise);
                //rewards the agents resouces based on their resources
                v1.rewardResources(v1Choice, v2Choice);
                v2.rewardResources(v2Choice, v1Choice);

                //a reward trust function will be need when trust implmented

                //add to the history of each edge for each agent
                e1.history.addTurn(new Turn(v1Choice, v1Promise));
                e2.history.addTurn(new Turn(v2Choice, v2Promise));
            }
        });
    }

    //generates each round when player hits confirm choices
    generateRound(edges: [Agent, Agent, Relation][]) {
        console.log("turncount " + this.state.turnCount);
        if (this.state.turnCount % 1 == 0) {
            //promise round
            console.log("PROMISE ROUND START");
            const promiseRelation = this.generatePromiseRound(edges);
            this.setState((state) => {
                return { promiseRelation: promiseRelation };
            });
        } else {
            //choice round
            console.log("CHOICE ROUND START");
            this.generateChoiceRound(this.state.promiseRelation);
        }

        this.setState((state) => {
            return { turnCount: this.state.turnCount + 0.5 };
        });
    }

    deselectCharacter(value: boolean) {
        this.setState({ selectCharacterDisplay: value });
    }

    //This method keeps track of how many times the arrow button in <TutorialGuide /> has
    //been clicked. This is used to keep track of which stage in the tutorial story the user is at.
    handleClick = () => {
        this.setState({
            stageCount: this.state.stageCount + 1,
        });
    };

    render() {
        //if there is a selected player display right sidebar
        if (this.state.selectCharacterDisplay) {
            return (
                <div className="game">
                    <TutorialBoard
                        map={this.state.map}
                        turnCount={this.state.turnCount}
                        selected={this.state.sidebarState.selected}
                        select={this.state.select.bind(this)}
                        player={this.state.sidebarState.player}
                        deselectCharacter={this.deselectCharacter}
                        current={currentMap}
                        stageCount={this.state.stageCount}
                    />
                    <TutorialPlayerSidebar
                        map={this.state.map}
                        round={this.tempTurn.bind(this)}
                        sidebarState={this.state.sidebarState}
                        tallyChoicesNeighbors={this.tallyChoicesForAllNeighbors}
                        countTotalInfluence={this.countTotalInfluence}
                        turnCount={this.state.turnCount}
                        promiseRelation={this.state.promiseRelation}
                        stageCount={this.state.stageCount}
                    />
                    <TutorialSelectedSidebar
                        map={this.state.map}
                        round={this.tempTurn.bind(this)}
                        sidebarState={this.state.sidebarState}
                        tallyChoicesNeighbors={this.tallyChoicesForAllNeighbors}
                        countTotalInfluence={this.countTotalInfluence}
                        deselectCharacter={this.deselectCharacter}
                    />
                    <TutorialGuide
                        turnCount={this.state.turnCount}
                        stageCount={this.state.stageCount}
                        onClick={this.handleClick}
                        level={this.props.level}
                    />
                </div>
            );
        } else {
            return (
                <div className="game">
                    <TutorialBoard
                        map={this.state.map}
                        turnCount={this.state.turnCount}
                        selected={this.state.sidebarState.selected}
                        select={this.state.select.bind(this)}
                        player={this.state.sidebarState.player}
                        deselectCharacter={this.deselectCharacter}
                        current={currentMap}
                        stageCount={this.state.stageCount}
                    />
                    <TutorialPlayerSidebar
                        map={this.state.map}
                        round={this.tempTurn.bind(this)}
                        sidebarState={this.state.sidebarState}
                        tallyChoicesNeighbors={this.tallyChoicesForAllNeighbors}
                        countTotalInfluence={this.countTotalInfluence}
                        turnCount={this.state.turnCount}
                        promiseRelation={this.state.promiseRelation}
                        stageCount={this.state.stageCount}
                    />
                    <TutorialGuide
                        turnCount={this.state.turnCount}
                        stageCount={this.state.stageCount}
                        onClick={this.handleClick}
                        level={this.props.level}
                    />
                </div>
            );
        }
    }
}
