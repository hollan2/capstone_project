import React, { useEffect } from "react";
import * as RK from "react-konva";
import "./css/App.css";
import Konva from "konva";
import useImage from "use-image";
import * as util from "./utilities";
import {
    AnimResources,
    AnimInfluence,
    AnimChoice,
    AnimMood,
    AnimChangeIdeology,
} from "./models/animation";

import { Face, Hat, GeneratePawn } from "./generators/pawn";
import { Grid } from "./generators/map";
import { PlayerSidebar } from "./components/playerSideBar";
import { SelectedSidebar } from "./components/selectedSideBar";
import { SidebarState } from "./components/sideBarState";
import { Board } from "./components/board";
import {
    Agent,
    AGENT_RADIUS,
    Relation,
    Ideology,
    Personality,
    SpendingContainer,
    DriftContainer,
} from "./models/agent";
import { Graph } from "./models/graph";
import {
    taglineFromStrategy,
    generateChoice,
    Turn,
    choiceTally,
    Strategy,
    generateCommitment,
    Commitment,
} from "./models/strategy";
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
}

export interface StartInfo {
    //Using strings until it's connected up
    name: string;
    hat: string;
    face: string;
    startingPoints: string;
    mapImage: string;
}

class GameView extends React.Component<StartInfo, GameViewState> {
    private stageRef = React.createRef<Konva.Stage>();
    //keeps track of the player's id for the round checks
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
        var promiseRelation;

        currentMap = props.mapImage;

        // TODO: put this in the JSON
    
        let position =Math.random() * map.getVertices().length-1; 
        position = Math.floor(position);
        const player =
            map.getVertices()[
                position
            ];
        
        //generates player with chosen face/hat/name/ideology
        if (player instanceof Agent) {
            player.face = Face[props.face as keyof typeof Face];
            player.hat = Hat[props.hat as keyof typeof Hat];
            player.name = props.name

            console.log("ID");
            console.log(player.id);
            this.player_id = player.id;
            console.log(this.player_id);
        }

        // Arbitrarily, the first Agent in the graph starts out selected
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
            selectCharacterDisplay: false,
            userPromise: -1,
            promiseRelation: promiseRelation,
        };

        //Needed for setState function
        this.deselectCharacter = this.deselectCharacter.bind(this);
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
        var Promise_relation: [Agent, Agent, Relation, Commitment, Commitment][] = [];
        edges.forEach(([v1, v2, e1]) => {
            const e2 = this.state.map.getEdge(v2, v1);
            if (v1.id < v2.id && e2 instanceof Relation) {
                const v1Strat = v1.ideology.toStrategy();
                const v2Strat = v2.ideology.toStrategy();
                var v1Promise;
                var v2Promise;

                //checks if agent1 is the player agent if so we get the player selected promise
                if(v1.id == this.player_id){

                    //gets player inputted promises
                    const obj = v1.promises.find(e => e.promiseTo === v2)
                    if(obj) {
                        v1Promise = obj.promise
                    } else {
                         //if player didnt choose a promise randomly chooses promises
                        v1Promise = generateCommitment(
                            v1Strat,
                            e2.history);
                    }
                }

                else{
                    //generates the promise of the agent1
                    v1Promise = generateCommitment(
                        v1Strat,
                        e2.history);

                    //stores AI promises for use in front end 
                    v1.updatePromise(v1Promise, v2)
                }

                //checks if agent2 is the player agent if so we get the player selected choice
                if(v2.id == this.player_id){
                    //gets player inputted promises
                    const obj = v2.promises.find(e => e.promiseTo === v1)
                    if(obj) {
                        v2Promise = obj.promise
                    } else {
                         //if player didnt choose a promise randomly chooses promises
                        v2Promise = generateCommitment(
                            v1Strat,
                            e2.history);
                    }
                }
                else{
                    //generates the promise of the agent2
                    v2Promise = generateCommitment(
                        v2Strat,
                        e1.history);

                    //stores AI promises for use in front end
                    v2.updatePromise(v2Promise, v1)
                }

                //gets us the full array of promises between agents to pass back to generaterounds
                Promise_relation.push([v1, v2, e1, v1Promise, v2Promise])
            }
        });
        return(Promise_relation)
    }

    //accepts in the edges array with the addtional commitment info. Then generates the agent's choices
    generateChoiceRound(edges: [Agent, Agent, Relation, Commitment, Commitment][]){
        edges.forEach(([v1, v2, e1, v1Promise, v2Promise]) => {
            const e2 = this.state.map.getEdge(v2, v1);
            if (v1.id < v2.id && e2 instanceof Relation) {
                const v1Strat = v1.ideology.toStrategy();
                const v2Strat = v2.ideology.toStrategy();
                var v1Choice;
                var v2Choice;

                //checks if agent1 is the player agent if so we get the player selected choice
                if(v1.id == this.player_id){
                    //gets player inputted choices
                    const obj = v1.choices.find(e => e.choiceTo === v2)
                    if(obj) {
                        v1Choice = obj.choice
                    } else {
                        console.log("NO CHOICE SELECTED")
                         //if player didnt choose a promise randomly chooses choice
                         v1Choice = generateChoice(
                            v1Promise, 
                            v2Promise,
                            v1Strat,
                            e2.history);
                    }
                    
                }
                else{
                    v1Choice = generateChoice(
                        v1Promise, 
                        v2Promise,
                        v1Strat,
                        e2.history);
                }

                //checks if agent2 is the player agent if so we get the player selected choice
                if(v2.id == this.player_id){
                    //gets player inputted choices
                    const obj = v2.choices.find(e => e.choiceTo === v1)
                    if(obj) {
                        v2Choice = obj.choice
                    } else {
                        console.log("NO CHOICE SELECTED")
                         //if player didnt choose a choice randomly chooses choice
                         v2Choice = generateChoice(
                            v1Promise, 
                            v2Promise,
                            v1Strat,
                            e2.history);
                    }
                }
                else{
                    v2Choice = generateChoice(
                        v2Promise, 
                        v1Promise,
                        v2Strat,
                        e1.history);
                }

                console.log(v1.name, v1Choice, v1Promise);
                console.log(v2.name ,v2Choice, v2Promise);
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

        console.log("turncount " + this.state.turnCount)
        if(this.state.turnCount%1 == 0){
            //promise round
            console.log("PROMISE ROUND START")
            const promiseRelation = this.generatePromiseRound(edges);
            this.setState((state) => {
                return { promiseRelation: promiseRelation };
            });
            
        } else {
            //choice round
            console.log("CHOICE ROUND START")
            this.generateChoiceRound(this.state.promiseRelation);

        }

        this.setState((state) => {
            return { turnCount: this.state.turnCount + .5};
        });
    }
    /* This function doesn't serve a purpose anymore, can be removed
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
    */
   
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
                            turnCount={this.state.turnCount}
                            promiseRelation={this.state.promiseRelation}
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
        } 
        else {
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
                            turnCount={this.state.turnCount}
                            promiseRelation={this.state.promiseRelation}
                        />
                </div>
            );
        }

    } 
}


interface DisplayState {
    scale: number;
}

interface DisplayProps {
    map: Graph<Agent, Relation>;
    agent: Agent;
    agentChoices: choiceTally;
    countTotalInfluence(map: Graph<Agent, Relation>, agent: Agent): String;
}

export class Display extends React.Component<DisplayProps, DisplayState> {
    private containerRef = React.createRef<HTMLDivElement>();
    private stageRef = React.createRef<Konva.Stage>();
    private resizeTimeout?: NodeJS.Timeout;
    private currentCanvasWidth: number = 0;

    constructor(props: any) {
        super(props);
        this.state = {
            scale: 0,
        };
    }

    componentDidMount() {
        this.resizeEvent = this.resizeEvent.bind(this);
        this.resizeEvent();
        window.addEventListener("resize", this.resizeEvent);
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.resizeEvent);
    }

    resizeEvent() {
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);

        this.resizeTimeout = setTimeout(() => {
            if (
                this.containerRef === undefined ||
                this.containerRef.current == null ||
                this.stageRef.current == null
            )
                return;

            const container = this.containerRef.current;
            const stage = this.stageRef.current;

            const scale = container.offsetWidth / 2.5 / MAX_SIDEBAR_AGENT_WIDTH;
            this.currentCanvasWidth = MAX_SIDEBAR_AGENT_WIDTH * scale;
            stage.width(this.currentCanvasWidth);
            stage.height(MAX_SIDEBAR_AGENT_HEIGHT * scale);
            this.setState({ scale: scale });
        }, RESIZE_TIMEOUT);
    }

    render() {
        let totalInfluence: String = "None";
        let agentPoints: number = 0;
        let agentStrat: string = "No strategy";
        let agentGoal: string = "Avenge me...";
        if (this.props.agent instanceof Agent) {
            const agent = this.props.agent as Agent;
            let strat = agent.ideology.toStrategy();
            agentStrat = Strategy[strat];
            agentGoal = taglineFromStrategy(strat);
            agentPoints = agent.resources;
            totalInfluence = this.props.countTotalInfluence(
                this.props.map,
                agent
            );
        }

        return (
            <section className="display" ref={this.containerRef}>
                <div className="sidebar-agent">
                    <RK.Stage ref={this.stageRef}>
                        <RK.Layer>
                            <SidebarAgentImage
                                canvasWidth={this.currentCanvasWidth}
                                data={this.props.agent}
                            />
                        </RK.Layer>
                    </RK.Stage>
                </div>
                <div className="tagline">
                    <p>
                        "{agentGoal}" ({agentStrat})
                    </p>
                </div>
                <div className="stats">
                    <p className="end">{agentPoints} resources</p>
                    <p className="end">
                        Gave {this.props.agentChoices.gave} times
                    </p>
                    <p className="end">
                        Cheated {this.props.agentChoices.cheated} times
                    </p>
                    <div className="end">regionally {totalInfluence}</div>
                </div>
                <Mood agent={this.props.agent} />
            </section>
        );
    }
}

interface MoodProps {
    agent: Agent;
}

function Mood(props: MoodProps) {
    const imgScale: number = 0.1;

    let moodDesc: String;
    let moodImgPath: string;

    const agent = props.agent as Agent;
    moodDesc = agent.getMoodDescription();
    moodImgPath =
        "images/mood-" +
        moodDesc.split(" ").join("-").toLowerCase() +
        ".png";

    return (
        <div className="mood">
            <img
                alt=""
                src={moodImgPath}
                height={MOOD_IMAGE_SIDE_LENGTH * imgScale}
                width={MOOD_IMAGE_SIDE_LENGTH * imgScale}
            />
            <p>{moodDesc}</p>
        </div>
    );
}

interface SidebarAgentImageType {
    canvasWidth: number;
    data: Agent;
}

export function SidebarAgentImage(props: SidebarAgentImageType) {
    const scale = props.canvasWidth / AGENT_IMAGE_WIDTH;

    let face = Face.Glasses;
    let hat = Hat.Cap;
    let ideology = { red: 0, green: 150, blue: 200 };

    if (props.data instanceof Agent) {
        face = props.data.face;
        hat = props.data.hat;
        switch (props.data.ideology.toStrategy()) {
            case Strategy.Dove:
                ideology = { red: 158, green: 196, blue: 234 };
                break;
            case Strategy.Hawk:
                ideology = { red: 223, green: 126, blue: 104 };
                break;
            case Strategy.Grim:
                ideology = { red: 248, green: 179, blue: 101 };
                break;
            case Strategy.AntiGrim:
                ideology = { red: 255, green: 218, blue: 92 };
                break;
            case Strategy.TweedleDum:
                ideology = { red: 181, green: 216, blue: 166 };
                break;
            case Strategy.TweedleDee:
                ideology = { red: 161, green: 196, blue: 202 };
                break;
            case Strategy.TitForTat:
                ideology = { red: 180, green: 166, blue: 216 };
                break;
        }
    }

    return (
        <RK.Group scaleX={scale} scaleY={scale}>
            {GeneratePawn(hat, face, ideology)}
        </RK.Group>
    );
}

/*
function give() {
    alert("Gee thanks");
}
*/
function cheat() {
    alert(":'(");
}

function influence() {
    alert("Ahh im influenced.");
}

export default GameView;
