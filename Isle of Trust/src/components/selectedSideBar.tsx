import React from "react";
import ReactDom from "react-dom";
import * as RK from "react-konva";
import "../css/App.css";
import Konva from "konva";
import { useEffect } from "react";
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
import { PlayerSidebar } from "../components/playerSideBar";
import { SidebarState } from "./sideBarState";
import { Display } from "../App";
import { SidebarAgentImage } from "../App";
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
    TurnLog,
    choiceTally,
    Strategy,
    Choice,
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
    Cruz: "url(../Maps/mapCruz.png)",
};

//export let MAP_INDEX = 0;
let currentMap = "Pronged";

const DIFFICULTY_VALUES: { [key: string]: number } = {
    easy: 19,
    medium: 15,
    hard: 10,
    extreme: 5,
};

interface SelectedSidebarProps {
    sidebarState: SidebarState;
    map: Graph<Agent, Relation>;
    tallyChoicesNeighbors: (
        map: Graph<Agent, Relation>,
        agent: Agent
    ) => choiceTally;
    countTotalInfluence(map: Graph<Agent, Relation>, agent: Agent): String;
    round: () => void;
    deselectCharacter: (value: boolean) => void;
    turnCount: number;
}


export class SelectedSidebar extends React.Component<
    SelectedSidebarProps,
    unknown
> {
    render() {
        return (
            <div className="sidebar selectedSidebar">
                <SelectedDisplay
                    map={this.props.map}
                    sidebarState={this.props.sidebarState}
                    tallyChoicesNeighbors={this.props.tallyChoicesNeighbors}
                    countTotalInfluence={this.props.countTotalInfluence}
                    deselectCharacter={this.props.deselectCharacter}
                    turnCount={this.props.turnCount}
                />
                {<Stats
                    sidebarState={this.props.sidebarState}
                    tallyChoicesNeighbors={this.props.tallyChoicesNeighbors}
                    neighbors={this.props.map.getEdges(
                        this.props.sidebarState.selected
                    )!}
                />}
                <History
                    selected={this.props.sidebarState.selected}
                    map={this.props.map}
                    turnCount={this.props.turnCount}
                    tutorial={false}
                />
            </div>
        );
    }
}

interface SelectedDisplayProps {
    sidebarState: SidebarState;
    map: Graph<Agent, Relation>;
    tallyChoicesNeighbors: (
        map: Graph<Agent, Relation>,
        agent: Agent
    ) => choiceTally;

    countTotalInfluence(map: Graph<Agent, Relation>, agent: Agent): String;
    countTotalInfluence(map: Graph<Agent, Relation>, agent: Agent): String;
    deselectCharacter: (value: boolean) => void;
    turnCount: number;
}

class SelectedDisplay extends React.Component<SelectedDisplayProps> {
  
    deselectCharacter(value: boolean) {
        this.props.deselectCharacter(false);
    }

    render() {
        let choices = new choiceTally();
        let name = "";
        const userPosition = this.props.sidebarState.position;
        if (this.props.sidebarState.selected instanceof Agent) {
            const them = this.props.sidebarState.selected as Agent;
            choices = this.props.tallyChoicesNeighbors(this.props.map, them);
            name = them.name;
        }
        return (
            <div className="selected-display">
                <div className="agent-type" id="selected-character">
                    <div>
                        selected: <span className="agent-name">{name}</span>
                    </div>
                    <div
                        className="deselect"
                        onClick={() => {
                            this.deselectCharacter(false);
                            this.props.sidebarState.selected =
                                this.props.map.getVertices()[userPosition];
                        }}
                    >
                        &#9746;
                    </div>
                </div>
                <Display
                    map={this.props.map}
                    agent={this.props.sidebarState.selected}
                    agentChoices={choices}
                    countTotalInfluence={this.props.countTotalInfluence}
                    turnCount={this.props.turnCount}
                />
            </div>
        );
    }
}

// 5/2023 - Removed Judgement as we didn't have time to update it. Keeping for future use.
interface JudgementProps {
    sidebarState: SidebarState;
}

class Judgement extends React.Component<JudgementProps> {
    render() {
        let judgement: string = "doesn't know you";
        if (
            this.props.sidebarState.player === this.props.sidebarState.selected
        ) {
            judgement = "that's you!";
        } else if (
            this.props.sidebarState.selectedToPlayer instanceof Relation &&
            this.props.sidebarState.playerToSelected instanceof Relation
        ) {
            judgement =
                this.props.sidebarState.selectedToPlayer.getDescriptiveOpinion() +
                "; " +
                this.props.sidebarState.playerToSelected.getDescriptiveInfluence();
        }

        return <div className="judgement">{judgement}</div>;
    }
}

interface StatsProps {
    sidebarState: SidebarState;
    neighbors: Map<Agent, Relation>;
    tallyChoicesNeighbors: (
        map: Graph<Agent, Relation>,
        agent: Agent
    ) => choiceTally;
}
class Stats extends React.Component<StatsProps, unknown> {
    render() {
        const theirChoices = new choiceTally();
        const yourChoices = new choiceTally();
        let theySpent = 0;
        let youSpent = 0;
        let isPlayerNeighbor = false;
        let selectedName = this.props.sidebarState.selected.name;

        // Check if players are neighbors:
        for (const entry of this.props.neighbors.entries()) {
            if(entry[0].id == this.props.sidebarState.player.id)
                isPlayerNeighbor = true;
        }

        if (isPlayerNeighbor == false) {
            return (
                <div className="stats-container">
                    <div className="stats">
                        <p>
                            You and {selectedName} haven't interacted yet!
                        </p>
                    </div>
                </div>
            );
        }
        if (this.props.sidebarState.selectedToPlayer) {
            theirChoices.tallyChoices(
                this.props.sidebarState.selectedToPlayer.history!
            );
            theySpent = this.props.sidebarState.selectedToPlayer.resourcesSpent;
        }
        if (this.props.sidebarState.playerToSelected) {
            yourChoices.tallyChoices(
                this.props.sidebarState.playerToSelected.history!
            );
            youSpent = this.props.sidebarState.playerToSelected.resourcesSpent;
        }
        return (
            <div className="stats-container">
                <div className="stats text-nowrap">
                    <p>
                        You worked together {yourChoices.together} times
                    </p>
                    <p>
                        {selectedName} worked together {theirChoices.together} times
                    </p>
                    <p>
                        you've cheated them {yourChoices.cheated} times
                    </p>
                    <p>
                        {selectedName} cheated you {theirChoices.cheated} times
                    </p>
                </div>
            </div>
        );
    }
}

interface HistoryProps {
    selected: Agent;
    map: Graph<Agent, Relation>;
    turnCount: number;
    tutorial: boolean;
}

export class History extends React.Component<HistoryProps> {
    private children: JSX.Element[] = [];

    renderNeighbors = () => {
        this.children = [];
        //Get the neighbors of the selected player from the graph
        const neighbors = this.props.map.getEdges(
            this.props.selected
        )!;
        //Loop through each entry (a neighbor) and append to the children array which wil be used to display the neighbors later
        for (const entry of neighbors.entries()) {
            this.children.push(
            <HistoryNeighbors 
                selected={this.props.selected}
                neighbor={entry[0]} 
                relation={entry[1]}
                turnCount={this.props.turnCount}
                map={this.props.map}
                tutorial={this.props.tutorial}
            />);
            
        };
    };

    render() {
        this.renderNeighbors();

        return (
            <div className="history-container">
                <div className="history-title">
                    <h3>See history with neighbors:</h3>
                </div>

                <div className="history-agent">{this.children}</div>
            </div>
        );
    }
}

interface HistoryNeighborsProps{
    selected: Agent;
    neighbor: Agent;
    relation: Relation;
    turnCount: number;
    map: Graph<Agent, Relation>;
    tutorial: boolean;
}

interface HistoryNeighborsState {
    show: boolean;
}

class HistoryNeighbors extends React.Component<
    HistoryNeighborsProps,
    HistoryNeighborsState
> {
    state = {
        show: false,
    };

    private stageRef = React.createRef<Konva.Stage>();
    private agentImageScale: number = 0.1;
    private canvasWidth = AGENT_IMAGE_WIDTH * this.agentImageScale;
    private canvasHeight = AGENT_IMAGE_HEIGHT * this.agentImageScale;

    //Whenever the view button is clicked or the close button of the pop up is clicked, the state will change, which will show
    //or hide the popup
    changeState = () => {
        this.setState({ show: !this.state.show });
    };

    render() {
        return (
            <div className="history-display">
                    <RK.Stage
                        ref={this.stageRef}
                        width={this.canvasWidth}
                        height={this.canvasHeight}
                    >
                        <RK.Layer>
                            <SidebarAgentImage
                                canvasWidth={this.canvasWidth}
                                agent={this.props.neighbor}
                                turnCount={this.props.turnCount}
                                tutorial={this.props.tutorial}
                            />
                        </RK.Layer>
                    </RK.Stage>
                    <div className="history-view">
                        <button onClick={this.changeState}>View</button>
                        {this.state.show && (<HistoryPopUp selected={this.props.selected} neighbor={this.props.neighbor} history={this.props.relation.history} changeState={this.changeState} turnCount={this.props.turnCount} map={this.props.map} tutorial={this.props.tutorial} />)}
                    </div>
            </div>
        );
    }
}


interface HistoryPopUpProps {
    selected: Agent;
    neighbor: Agent;
    history: TurnLog;
    turnCount: number;
    changeState: (show: boolean) => void;
    map: Graph<Agent, Relation>;
    tutorial: boolean;
}

class HistoryPopUp extends React.Component<HistoryPopUpProps> {
    //calls the passed in function to change the parent's state to hide the popup
    handleCloseClick = () => {
        this.props.changeState(false);
      };
    //history of selected -> neighbor
    private History: TurnLog = this.props.history;

    private stageRef = React.createRef<Konva.Stage>();
    private agentImageScale: number = .15;
    private canvasWidth = AGENT_IMAGE_WIDTH * this.agentImageScale;
    private canvasHeight = AGENT_IMAGE_HEIGHT * this.agentImageScale;
    
    private getComDotColor(commitment: Commitment): string {
        switch (commitment) {
          case Commitment.Compete:
            return '#f36252';
          case Commitment.Reciprocate:
            return '#e1e257';
          case Commitment.Cooperate:
            return '#51e658';
          default:
            return '#51e658';
        }
    }
    private getChoiceDotColor(choice: Choice): string {
        switch (choice) {
          case Choice.Compete:
            return '#f36252';
          case Choice.Cooperate:
            return '#51e658';
          default:
            return '#51e658';
        }
    }
    render() {
        //history of the neighbor -> selected
        const neighborToSelected = this.props.map.getEdge(this.props.neighbor, this.props.selected)!.history.getList();
        return ReactDom.createPortal(
            <div className="popup-container">
                <div className="overlay"></div>
                <div className="popup">
                    <div className="popup-close">
                        <button onClick={this.handleCloseClick}>X</button>
                    </div>
                    <div className="history-header">
                        <div className="selected-agent">        
                                <RK.Stage
                                    ref={this.stageRef}
                                    width={this.canvasWidth}
                                    height={this.canvasHeight}
                                >
                                    <RK.Layer>
                                        <SidebarAgentImage
                                            canvasWidth={this.canvasWidth}
                                            agent={this.props.selected}
                                            turnCount={this.props.turnCount}
                                            tutorial={this.props.tutorial}
                                        />
                                    
                                    </RK.Layer>
                                </RK.Stage>
                                <h5>{this.props.selected.name}</h5>
                            </div>
                            <div>
                                <h1>History:</h1>
                                <div className="arrow">
                                    <h4>{'<' + '—'.repeat(4) + '>'}</h4>
                                </div>
                            </div>
                            <div className="neighbor-agent">
    
                                <RK.Stage
                                    ref={this.stageRef}
                                    width={this.canvasWidth}
                                    height={this.canvasHeight}
                                >
                                    <RK.Layer>
                                        <SidebarAgentImage
                                            canvasWidth={this.canvasWidth}
                                            agent={this.props.neighbor}
                                            turnCount={this.props.turnCount}
                                            tutorial={this.props.tutorial}
                                        />
                                    
                                    </RK.Layer>
                                    
                                </RK.Stage>
                                <h5>{this.props.neighbor.name}</h5>
                            </div>
                    </div>
                    <div className="popup-content">
                        <table className="history-table">
                            <thead>
                                <tr>
                                <th>Promise {'->'}</th>
                                <th>Action {'->'}</th>
                                <th>Year</th>
                                <th>{'<-'} Promise</th>
                                <th>{'<-'} Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.History.actions.map((turn, i) => (
                                    <tr key={i}>
                                        <td>
                                            <span style={{backgroundColor: this.getComDotColor(turn.commitment)}} className="dot"></span>
                                        </td>
                                        <td>
                                            <span style={{backgroundColor: this.getChoiceDotColor(turn.choice)}} className="dot"></span>
                                        </td>
                                        <td>{i+1950}</td>
                                        <td>
                                            <span style={{backgroundColor: this.getComDotColor(neighborToSelected[i].commitment)}} className="dot"></span>
                                        </td>
                                        <td>
                                            <span style={{backgroundColor: this.getChoiceDotColor(neighborToSelected[i].choice)}} className="dot"></span>
                                        </td>
                                    </tr>
                                )).reverse()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>,
            //Used for React Portal Popup Modal
            document.getElementById("portal")!
        );
    }
}
