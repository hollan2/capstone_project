import React from "react";
import * as RK from "react-konva";
import "../css/App.css";
import Konva from "konva";
import { SidebarState } from "./sidebarState";
import { SidebarAgentImage } from "../App";
import { Display } from "../App";
import {
    MetaAgent,
    Agent,
    Relation,
    SpendingContainer
} from "../models/agent";
import { Graph } from "../models/graph";
import { choiceTally } from "../models/strategy";
export const RESIZE_TIMEOUT = 500;

export const SCENE_WIDTH = 800;
export const SCENE_HEIGHT = 600;
export const MAX_SIDEBAR_AGENT_WIDTH = 150;
export const MAX_SIDEBAR_AGENT_HEIGHT = 225;
const AGENT_IMAGE_WIDTH = 400;
const AGENT_IMAGE_HEIGHT = 594;

interface PlayerSidebarProps {
    sidebarState: SidebarState;
    map: Graph<MetaAgent, Relation>;
    tallyChoicesNeighbors: (
        map: Graph<MetaAgent, Relation>,
        agent: Agent
    ) => choiceTally;
    countTotalInfluence(map: Graph<MetaAgent, Relation>, agent: Agent): String;
    round: () => void;
}

export class PlayerSidebar extends React.Component<PlayerSidebarProps, unknown> {
    render() {
        return (
            <div className="sidebar playerSidebar">
                <PlayerDisplay
                    map={this.props.map}
                    sidebarState={this.props.sidebarState}
                    tallyChoicesNeighbors={this.props.tallyChoicesNeighbors}
                    countTotalInfluence={this.props.countTotalInfluence}
                />
                <InfluenceMenu
                    round={this.props.round}
                    sidebarState={this.props.sidebarState}
                    map={this.props.map}
                />
            </div>
        );
    }
}

interface PlayerDisplayProps {
    sidebarState: SidebarState;
    map: Graph<MetaAgent, Relation>;
    tallyChoicesNeighbors: (
        map: Graph<MetaAgent, Relation>,
        agent: Agent
    ) => choiceTally;
    countTotalInfluence(map: Graph<MetaAgent, Relation>, agent: Agent): String;
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
            <div className="player-display">
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
    map: Graph<MetaAgent, Relation>;
}

class InfluenceMenu extends React.Component<InfluenceMenuProps> {
    public spendingMap = new SpendingContainer();

    render() {
        const neighbors = this.props.map.getEdges(
            this.props.sidebarState.player
        )!;

        if (this.props.sidebarState.player instanceof Agent) {
            return (
                <div className="influence-menu">
                    <div className="influence-title">
                        spend resources,
                        <br /> influence your neighbors:
                    </div>
                    <InfluenceOptions
                        selected={this.props.sidebarState.selected}
                        player={this.props.sidebarState.player as Agent}
                        neighbors={neighbors}
                        spendingMap={this.props.sidebarState.influenceChoices}
                    />
                    <button onClick={this.props.round}>Confirm Choices</button>
                </div>
            );
        } else {
            return (
                <div className="influence-menu">
                    <div className="influence-title">
                        choose how to influence your neighbors:
                    </div>
                    <div>You are dead and cannot influence your neighbors!</div>
                    <button onClick={this.props.round}>Next Round</button>
                </div>
            );
        }
    }
}

interface InfluenceOptionsProps {
    selected: MetaAgent;
    player: Agent;
    neighbors: Map<MetaAgent, Relation>;
    spendingMap: SpendingContainer;
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
                        spendingMap={this.props.spendingMap}
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
    agent: MetaAgent;
    spendingMap: SpendingContainer;
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
        this.state = { given: 0 };
    }

    updateGiven(increment: number) {
        if (this.props.agent instanceof Agent) {
            const newGiven = this.props.allowResources(
                this.state.given,
                increment
            );
            this.setState({ given: newGiven });
            this.props.spendingMap.data.set(this.props.agent, newGiven);
        }
    }

    render() {
        const sMaybe = this.state.given === 1 ? "" : "s";
        const givenString = String(this.state.given) + " resource" + sMaybe;
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
                                alive={this.props.agent.isAlive()}
                                data={this.props.agent}
                            />
                        </RK.Layer>
                    </RK.Stage>
                </div>
                <div className="sidebar-agent-info">
                    <button
                        className="more-resource"
                        onClick={() => {
                            this.updateGiven(1);
                        }}
                    >
                        +
                    </button>
                    <button
                        className="less-resource"
                        onClick={() => {
                            this.updateGiven(-1);
                        }}
                    >
                        -
                    </button>
                    <div>{givenString}</div>
                </div>
            </div>
        );
    }
}