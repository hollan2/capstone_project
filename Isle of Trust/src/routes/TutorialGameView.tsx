import React from "react";
import * as RK from "react-konva";
import "../css/App.css";
import Konva from "konva";
import useImage from "use-image";
import * as util from "../utilities";
import { useLocation } from "react-router-dom";
import {
    AnimResources,
    AnimInfluence,
    AnimChoice,
    AnimMood,
    AnimChangeIdeology,
} from "../models/animation";

import { Face, Hat, GeneratePawn } from "../generators/pawn";
import { Grid } from "../generators/map";
import { PlayerSidebar } from "../components/playerSideBar";
import { SelectedSidebar } from "../components/selectedSideBar";
import { SidebarState } from "../components/sideBarState";
import { Board } from "../components/board";
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
}

export interface StartInfo {
    //Using strings until it's connected up
    name: string;
    hat: string;
    face: string;
    ideologyColor: string;
    startingPoints: string;
    mapImage: string;
}

export function TutorialDisplay() {
    const state = {
        name: 'Adam',
        hat: 'None',
        face: 'Glasses',
        ideologyColor: '9ec4ea',
        startingPoints: 'Easy',
        mapImage: 'Small'
    }

    //logs the values chosen for the player character 
    console.log("Game function for routing");
    console.log(state);
    return (
        <TutorialView
            name={state.name}
            hat={state.hat}
            face={state.face}
            ideologyColor={state.ideologyColor}
            startingPoints={state.startingPoints}
            mapImage={state.mapImage}
        />
    );
}

class TutorialView extends React.Component<StartInfo, GameViewState> {
    private stageRef = React.createRef<Konva.Stage>();
    constructor(props: StartInfo) {
        super(props);
        // Here may be some kind of switch to generate map
        // type based on props, for now it's just the grid
        const map = new Grid(
            props.mapImage,
            DIFFICULTY_VALUES[props.startingPoints]
        ).getGraph();
        const turnCount = 0;

        currentMap = props.mapImage;

        // TODO: put this in the JSON
        //A random agent in the graph is selected to be the player
        const player =
            map.getVertices()[
                Math.floor(Math.random() * map.getVertices().length)
            ];
        
        //generates player with chosen face/hat/name/ideology
        if (player instanceof Agent) {
            player.face = Face[props.face as keyof typeof Face];
            player.hat = Hat[props.hat as keyof typeof Hat];
            player.name = props.name

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

        // Arbitrarily, the first Agent in the graph starts out selected
        let selected = map.getVertices()[0];
        let sidebarState = new SidebarState(map, player, selected);

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
            selectCharacterDisplay: false,
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

        this.drainInfluence(edges);
        this.handleInfluenceChanges(vertices);
        this.generateRound(edges);
        this.drainResources(vertices);

        this.forceUpdate();
    }

    drainResources(vertices: Agent[]) {
        vertices.forEach((v1) => {
            v1.resources -= RESOURCE_LOST_PER_TURN;
        });
    }

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

    generateRound(edges: [Agent, Agent, Relation][]) {
        const turnsToSample: number = 10;
        edges.forEach(([v1, v2, e1]) => {
            const e2 = this.state.map.getEdge(v2, v1);
            if (v1.id < v2.id && e2 instanceof Relation) {
                const v1Strat = v1.ideology.toStrategy();
                const v2Strat = v2.ideology.toStrategy();
                const v1Choice = generateChoice(
                    v1Strat,
                    v1.mood,
                    e2.history
                );
                const v2Choice = generateChoice(
                    v2Strat,
                    v2.mood,
                    e1.history
                );

                let resourceChange = v1.resources;
                let moodChange = v1.mood;

                v1.rewardResources(v1Choice, v2Choice);
                v2.rewardResources(v1Choice, v2Choice);
                v1.updateMood(v1Choice, v2Choice);
                v2.updateMood(v1Choice, v2Choice);

                resourceChange = v1.resources - resourceChange;
                moodChange = v1.mood - moodChange;

                e1.history.addTurn(new Turn(v1Choice, v1Choice));
                e2.history.addTurn(new Turn(v2Choice, v2Choice));

                let opinionChange = e1.opinion;
                e1.updateOpinion(
                    e2.influence,
                    e2.history.getAvgChoice(turnsToSample),
                    v1.personality.getVolatility()
                );
                e2.updateOpinion(
                    e1.influence,
                    e1.history.getAvgChoice(turnsToSample),
                    v2.personality.getVolatility()
                );
                opinionChange = e1.opinion - opinionChange;
            }
        });

        this.setState((state) => {
            return { turnCount: this.state.turnCount + 1 };
        });
    }

    driftIdeology(agent: Agent) {
        // Drift factor represents by how many attribute points an agent will drift towards a new ideology.
        // A factor of 4 = an agent will change its ideology by 4 points (dividing the 4 points appropriately
        // among its generosity and forgiveness.)
        // Drift factor has an intended range of 1-10. (Keep in mind that since the change is divided between
        // generotisy and forgiveness, it still represents a max change of 5 in either.)
        const driftFactor = 1 + agent.getInfluenceability() * 19;

        const ideologyAppeal: Map<Ideology, number> = new Map();
        const neighbors = this.state.map.getEdges(agent)!;
        let totalInfluence = 0;
        
        //calcautes the total influnce of all nehboors
        neighbors.forEach((relation: Relation, neighbor: Agent) => {
            const theirInfluence = this.state.map.getEdge(
                neighbor,
                agent
            )!.influence;
            ideologyAppeal.set(neighbor.ideology, theirInfluence);
            totalInfluence += theirInfluence;
        });

        const drifts = new DriftContainer();
        ideologyAppeal.forEach((theirInfluence, ideology) => {
            const drift: number = Math.round(
                driftFactor * (theirInfluence / totalInfluence)
            );
            drifts.data.set(ideology, drift);
        });
        agent.driftIdeology(drifts);
    }

    deselectCharacter(value: boolean) {
        this.setState({selectCharacterDisplay: value});
    }

    render() {
        //if there is a selected player display right sidebar
        if (this.state.selectCharacterDisplay) {
            return (
                <div className="game">
                        <Board
                            map={this.state.map}
                            turnCount={this.state.turnCount}
                            selected={this.state.sidebarState.selected}
                            select={this.state.select.bind(this)}
                            player = {this.state.sidebarState.player}
                            deselectCharacter={this.deselectCharacter}
                            current = {currentMap}
                        />
                        <PlayerSidebar
                            map={this.state.map}
                            round={this.tempTurn.bind(this)}
                            sidebarState={this.state.sidebarState}
                            tallyChoicesNeighbors={this.tallyChoicesForAllNeighbors}
                            countTotalInfluence={this.countTotalInfluence}
                        />
                        <SelectedSidebar
                            map={this.state.map}
                            round={this.tempTurn.bind(this)}
                            sidebarState={this.state.sidebarState}
                            tallyChoicesNeighbors={this.tallyChoicesForAllNeighbors}
                            countTotalInfluence={this.countTotalInfluence}
                            deselectCharacter={this.deselectCharacter}
                        />
                </div>
            );
        } else {
            return (
                <div className="game">
                        <Board
                            map={this.state.map}
                            turnCount={this.state.turnCount}
                            selected={this.state.sidebarState.selected}
                            select={this.state.select.bind(this)}
                            player = {this.state.sidebarState.player}
                            deselectCharacter={this.deselectCharacter}
                            current = {currentMap}
                            
                        />
                        <PlayerSidebar
                            map={this.state.map}
                            round={this.tempTurn.bind(this)}
                            sidebarState={this.state.sidebarState}
                            tallyChoicesNeighbors={this.tallyChoicesForAllNeighbors}
                            countTotalInfluence={this.countTotalInfluence}
                        />
                </div>
            );
        }

    }
}