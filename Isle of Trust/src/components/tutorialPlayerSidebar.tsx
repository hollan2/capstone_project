import React from "react";
import * as RK from "react-konva";
import "../css/App.css";
import Konva from "konva";
import { Display } from "../App";
import { SidebarState } from "./sideBarState";
import { SidebarAgentImage } from "../App";
import { Agent, Relation, SpendingContainer } from "../models/agent";
import { Graph } from "../models/graph";
import { choiceTally, Commitment, Choice } from "../models/strategy";
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

interface TutorialPlayerSidebarProps {
    sidebarState: SidebarState;
    map: Graph<Agent, Relation>;
    tallyChoicesNeighbors: (
        map: Graph<Agent, Relation>,
        agent: Agent
    ) => choiceTally;
    countTotalInfluence(map: Graph<Agent, Relation>, agent: Agent): String;
    round: () => void;
    turnCount: number;
    stageCount: number;
    promiseRelation: any;
}

export class TutorialPlayerSidebar extends React.Component<
    TutorialPlayerSidebarProps,
    unknown
> {
    render() {
        return (
            <div className="sidebar playerSidebar">
                <PlayerDisplay
                    map={this.props.map}
                    sidebarState={this.props.sidebarState}
                    tallyChoicesNeighbors={this.props.tallyChoicesNeighbors}
                    countTotalInfluence={this.props.countTotalInfluence}
                    stageCount={this.props.stageCount}
                />
                <InfluenceMenu
                    round={this.props.round}
                    sidebarState={this.props.sidebarState}
                    map={this.props.map}
                    turnCount={this.props.turnCount}
                    promiseRelation={this.props.promiseRelation}
                    stageCount={this.props.stageCount}
                />
            </div>
        );
    }
}

interface PlayerDisplayProps {
    sidebarState: SidebarState;
    map: Graph<Agent, Relation>;
    tallyChoicesNeighbors: (
        map: Graph<Agent, Relation>,
        agent: Agent
    ) => choiceTally;
    countTotalInfluence(map: Graph<Agent, Relation>, agent: Agent): String;
    stageCount: number;
}

class PlayerDisplay extends React.Component<PlayerDisplayProps> {
    render() {
        let choices = new choiceTally();
        let name: string = "";
        if (this.props.sidebarState.player instanceof Agent) {
            const you = this.props.sidebarState.player as Agent;
            choices = this.props.tallyChoicesNeighbors(this.props.map, you);
            name = you.name;
        }
        return (
            <div
                className={
                    this.props.stageCount === 1
                        ? "player-display spotlight"
                        : "player-display"
                }
            >
                <div className="agent-type">
                    Player: <span className="agent-name">{name}</span>
                </div>
                <Display
                    map={this.props.map}
                    agent={this.props.sidebarState.player}
                    agentChoices={choices}
                    countTotalInfluence={this.props.countTotalInfluence}
                />
            </div>
        );
    }
}

interface InfluenceMenuProps {
    round: () => void;
    sidebarState: SidebarState;
    map: Graph<Agent, Relation>;
    turnCount: number;
    stageCount: number;
    promiseRelation: any;
}

class InfluenceMenu extends React.Component<InfluenceMenuProps> {
    public spendingMap = new SpendingContainer();

    render() {
        const neighbors = this.props.map.getEdges(
            this.props.sidebarState.player
        )!;

        if (this.props.sidebarState.player instanceof Agent) {
            if (this.props.turnCount % 1 === 0) {
                return (
                    <div
                        className={
                            this.props.stageCount === 2
                                ? "influence-menu spotlight"
                                : "influence-menu"
                        }
                        style={
                            this.props.stageCount !== 3
                                ? { pointerEvents: "none" }
                                : {}
                        }
                    >
                        <div className="influence-title">
                            Promise Phase
                            <br /> Declare your intent with neighbors:
                        </div>
                        <InfluenceOptions
                            selected={this.props.sidebarState.selected}
                            player={this.props.sidebarState.player as Agent}
                            neighbors={neighbors}
                            spendingMap={
                                this.props.sidebarState.influenceChoices
                            }
                            turnCount={this.props.turnCount}
                            promiseRelation={this.props.promiseRelation}
                        />
                        <button onClick={this.props.round}>
                            Confirm Choices
                        </button>
                    </div>
                );
            } else {
                return (
                    <div className="influence-menu">
                        <div className="influence-title">
                            Action Phase
                            <br /> Deliver on your promises! (Or Not):
                        </div>
                        <InfluenceOptions
                            selected={this.props.sidebarState.selected}
                            player={this.props.sidebarState.player as Agent}
                            neighbors={neighbors}
                            spendingMap={
                                this.props.sidebarState.influenceChoices
                            }
                            turnCount={this.props.turnCount}
                            promiseRelation={this.props.promiseRelation}
                        />
                        <button onClick={this.props.round}>
                            Confirm Choices
                        </button>
                    </div>
                );
            }
        }
    }
}

interface InfluenceOptionsProps {
    selected: Agent;
    player: Agent;
    neighbors: Map<Agent, Relation>;
    spendingMap: SpendingContainer;
    turnCount: number;
    promiseRelation: any;
}

class InfluenceOptions extends React.Component<InfluenceOptionsProps> {
    // this is an array of React components with a long and complicated type signature
    private children: JSX.Element[] = [];
    private resourcesGiveable: number;

    constructor(props: any) {
        super(props);

        this.resourcesGiveable = this.props.player.resources;
        this.allowResources = this.allowResources.bind(this);
        this.redoChildren();
    }

    // a terrible workaround to force resourcesGiveable to update for all children every round
    private redoChildren() {
        this.children = [];
        let key = 0;
        if (this.props.neighbors) {
            for (const entry of this.props.neighbors.entries()) {
                const newChild = (
                    <InfluenceEntry
                        key={key}
                        allowResources={this.allowResources}
                        resourcesGiveable={this.props.player.resources}
                        agent={entry[0]}
                        player={this.props.player}
                        spendingMap={this.props.spendingMap}
                        turnCount={this.props.turnCount}
                        promiseRelation={this.props.promiseRelation}
                    />
                );
                this.children.push(newChild);
                key += 1;
            }
        }
    }

    componentDidUpdate(
        prevProps: Readonly<InfluenceOptionsProps>,
        prevState: Readonly<{}>,
        snapshot?: any
    ): void {
        this.resourcesGiveable = this.props.player.resources;
    }

    // Called by `InfluenceEntry`s.
    // An entry may call this function to ask to increase its `initial` number of resources by `increment`.
    // The function considers this and returns the new number of resources the entry can have.
    allowResources(initial: number, increment: number): number {
        const total = increment + initial;
        // trying to give what you don't have
        if (
            (increment > 0 && total > this.props.player.resources) ||
            (increment > 0 && this.resourcesGiveable <= 0)
        ) {
            return initial;
        }
        // trying to give a negative number
        else if (
            (increment < 0 &&
                this.resourcesGiveable >= this.props.player.resources) ||
            (increment < 0 && initial <= 0)
        ) {
            return 0;
        } else {
            this.resourcesGiveable -= increment;
            return total;
        }
    }

    render() {
        this.redoChildren();
        return <div className="influence-options">{this.children}</div>;
    }
}

interface InfluenceEntryProps {
    allowResources: (giving: number, increment: number) => number;
    resourcesGiveable: number;
    agent: Agent;
    player: Agent;
    spendingMap: SpendingContainer;
    turnCount: number;
    promiseRelation: any;
}

interface InfluenceEntryState {
    given: number;
}

class InfluenceEntry extends React.Component<
    InfluenceEntryProps,
    InfluenceEntryState
> {
    private containerRef = React.createRef<HTMLDivElement>();
    private stageRef = React.createRef<Konva.Stage>();
    private agentImageScale: number = 0.1;
    private canvasWidth = AGENT_IMAGE_WIDTH * this.agentImageScale;
    private canvasHeight = AGENT_IMAGE_HEIGHT * this.agentImageScale;

    constructor(props: any) {
        super(props);
        this.state = {
            given: 0,
        };
    }

    //gets src promise to dest
    getPromiseBetween(src: Agent, dest: Agent) {
        const promise = src.promises.find((e) => e.promiseTo === dest);
        const commitment = promise?.promise;
        switch (commitment) {
            case 0:
                return "compete";
            case 1:
                return "cooperate";
            case 2:
                return "reciprocate";
        }
    }

    isTruth(
        commitment: string,
        playerCommitment: string | undefined,
        neighborCommitment: string | undefined
    ) {
        if (commitment === playerCommitment) return "honest";
        //if both agents are reciprocate, then their commmitments are cooperate
        else if (
            playerCommitment === "reciprocate" &&
            neighborCommitment === "reciprocate" &&
            commitment === "cooperate"
        )
            return "honest";
        else if (
            playerCommitment === "reciprocate" &&
            commitment === neighborCommitment
        )
            return "honest";
        else return "lie";
    }
    render() {
        const player = this.props.player;
        const agent = this.props.agent;

        const aiCommitment = this.getPromiseBetween(agent, player);
        const playerCommitment = this.getPromiseBetween(player, agent);

        // const sMaybe = this.state.given === 1 ? "" : "s";
        // const givenString = String(this.state.given) + " resource" + sMaybe;
        if (this.props.turnCount % 1 === 0) {
            //promise phase
            return (
                <div className="influence-entry" ref={this.containerRef}>
                    <div className="influence-agent">
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
                    </div>
                    <div className="sidebar-agent-info">
                        <button
                            id="cooperate"
                            onClick={() => {
                                player.updatePromise(
                                    Commitment.Cooperate,
                                    agent
                                );
                            }}
                        >
                            {" "}
                            Cooperate
                        </button>
                        <button
                            id="reciprocate"
                            onClick={() => {
                                player.updatePromise(
                                    Commitment.Reciprocate,
                                    agent
                                );
                            }}
                        >
                            {" "}
                            Reciprocate
                        </button>
                        <button
                            id="compete"
                            onClick={() => {
                                player.updatePromise(Commitment.Compete, agent);
                            }}
                        >
                            {" "}
                            Compete
                        </button>
                    </div>
                </div>
            );
        }

        //action phase
        else {
            return (
                <div className="container" ref={this.containerRef}>
                    <div>{agent.name + " promised to " + aiCommitment}</div>
                    <div className="influence-entry">
                        <div className="influence-agent">
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
                        </div>
                        <div className="sidebar-agent-info">
                            <button
                                id="cooperate"
                                onClick={() => {
                                    //determine if give or cheat then update choice
                                    console.log("Select cooperate");
                                    player.updateChoice(Choice.Give, agent);
                                }}
                            >
                                <div className="action-container">
                                    <div>Cooperate</div>
                                    <div>
                                        {this.isTruth(
                                            "cooperate",
                                            playerCommitment,
                                            aiCommitment
                                        )}
                                    </div>
                                </div>
                            </button>
                            <button
                                id="compete"
                                onClick={() => {
                                    console.log("Select compete");
                                    player.updateChoice(Choice.Cheat, agent);
                                }}
                            >
                                <div className="action-container">
                                    <div>Compete</div>
                                    <div>
                                        {this.isTruth(
                                            "compete",
                                            playerCommitment,
                                            aiCommitment
                                        )}
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
    }
}
