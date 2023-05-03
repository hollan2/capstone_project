import React from "react";
import ReactDom from "react-dom";
import * as RK from "react-konva";
import "../css/App.css";
import Konva from "konva";
import { SidebarState } from "./sideBarState";
import { Display } from "../App";
import { SidebarAgentImage } from "../App";
import { Agent, Relation } from "../models/agent";
import { Graph } from "../models/graph";
import { TurnLog, choiceTally } from "../models/strategy";
export const RESIZE_TIMEOUT = 500;
export const SCENE_WIDTH = 800;
export const SCENE_HEIGHT = 600;
export const MAX_SIDEBAR_AGENT_WIDTH = 150;
export const MAX_SIDEBAR_AGENT_HEIGHT = 225;
const AGENT_IMAGE_WIDTH = 400;
const AGENT_IMAGE_HEIGHT = 594;

export const MAP_URL: { [key: string]: string } = {
    Pronged: "url(../Maps/mapPronged.png)",
    Choke: "url(../Maps/mapChoke.png)",
    Ring: "url(../Maps/mapRing.png)",
    Spokes: "url(../Maps/mapSpokes.png)",
    Crescent: "url(../Maps/mapCrescent.png)",
    Small: "url(../Maps/mapSmall.png)",
};

interface TutorialSelectedSidebarProps {
    sidebarState: SidebarState;
    map: Graph<Agent, Relation>;
    tallyChoicesNeighbors: (
        map: Graph<Agent, Relation>,
        agent: Agent
    ) => choiceTally;
    countTotalInfluence(map: Graph<Agent, Relation>, agent: Agent): String;
    round: () => void;
    deselectCharacter: (value: boolean) => void;
}

export class TutorialSelectedSidebar extends React.Component<
    TutorialSelectedSidebarProps,
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
                />
                <Stats
                    sidebarState={this.props.sidebarState}
                    tallyChoicesNeighbors={this.props.tallyChoicesNeighbors}
                />
                <History
                    sidebarState={this.props.sidebarState}
                    map={this.props.map}
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
}

class SelectedDisplay extends React.Component<SelectedDisplayProps> {
    deselectCharacter(value: boolean) {
        this.props.deselectCharacter(false);
    }
    render() {
        let choices = new choiceTally();
        let name = "";
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
                />
                <Judgement sidebarState={this.props.sidebarState} />
            </div>
        );
    }
}

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
                <div className="stats">
                    <p>
                        They've spent {theySpent} resources trying to influence
                        you, while you've spent {youSpent} resources trying to
                        influence them.
                    </p>
                    <p>
                        They've given to you {theirChoices.gave} times, while
                        you've given to them {yourChoices.gave} times.
                    </p>
                    <p>
                        They've cheated you {theirChoices.cheated} times, while
                        you've cheated them {yourChoices.cheated} times.
                    </p>
                </div>
            </div>
        );
    }
}

interface HistoryProps {
    sidebarState: SidebarState;
    map: Graph<Agent, Relation>;
}

class History extends React.Component<HistoryProps> {
    private children: JSX.Element[] = [];

    renderNeighbors = () => {
        this.children = [];
        //Get the neighbors of the selected player from the graph
        const neighbors = this.props.map.getEdges(
            this.props.sidebarState.selected
        )!;
        //Loop through each entry (a neighbor) and append to the children array which wil be used to display the neighbors later
        for (const entry of neighbors.entries()) {
            this.children.push(
                <HistoryNeighbors agent={entry[0]} relation={entry[1]} />
            );
        }
    };

    render() {
        this.renderNeighbors();

        return (
            <div className="history-container">
                <div className="history-title">
                    <h3>See history of neighbors:</h3>
                </div>

                <div className="history-agent">{this.children}</div>
            </div>
        );
    }
}

interface HistoryNeighborsProps {
    agent: Agent;
    relation: Relation;
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
                            data={this.props.agent}
                        />
                    </RK.Layer>
                </RK.Stage>
                <div className="history-view">
                    <button onClick={this.changeState}>View</button>
                    {this.state.show && (
                        <HistoryPopUp
                            history={this.props.relation.history}
                            changeState={this.changeState}
                        />
                    )}
                </div>
            </div>
        );
    }
}

interface HistoryPopUpProps {
    history: TurnLog;
    changeState: (show: boolean) => void;
}

class HistoryPopUp extends React.Component<HistoryPopUpProps> {
    //calls the passed in function to change the parent's state to hide the popup
    handleCloseClick = () => {
        this.props.changeState(false);
    };

    private History: TurnLog = this.props.history;

    render() {
        return ReactDom.createPortal(
            <div className="popup-container">
                <div className="overlay"></div>
                <div className="popup">
                    <div className="popup-close">
                        <button onClick={this.handleCloseClick}>X</button>
                    </div>
                    <div className="popup-content">
                        <h1>History:</h1>
                        <ul>
                            {[...Array(100)].map((_, i) => (
                                <li key={i}>
                                    Round: {100 - i} | Promise: Unknown |
                                    Action: Unknown
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>,
            //Used for React Portal Popup Modal
            document.getElementById("portal")!
        );
    }
}
