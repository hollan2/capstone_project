import React from "react";
import * as RK from "react-konva";
import "../css/App.css";
import Konva from "konva";
import { SidebarState } from "./sidebarState";
import { Display } from "../App";
import {
    MetaAgent,
    Agent,
    Relation,
} from "../models/agent";
import { Graph } from "../models/graph";
import { choiceTally } from "../models/strategy";
export const RESIZE_TIMEOUT = 500;

export const SCENE_WIDTH = 800;
export const SCENE_HEIGHT = 600;
export const MAX_SIDEBAR_AGENT_WIDTH = 150;
export const MAX_SIDEBAR_AGENT_HEIGHT = 225;

interface SelectedSidebarProps {
    sidebarState: SidebarState;
    map: Graph<MetaAgent, Relation>;
    tallyChoicesNeighbors: (
        map: Graph<MetaAgent, Relation>,
        agent: Agent
    ) => choiceTally;
    countTotalInfluence(map: Graph<MetaAgent, Relation>, agent: Agent): String;
    round: () => void;
}

export class SelectedSidebar extends React.Component<SelectedSidebarProps, unknown> {
    render() {
        return (
            <div className="sidebar selectedSidebar">
                <SelectedDisplay
                    map={this.props.map}
                    sidebarState={this.props.sidebarState}
                    tallyChoicesNeighbors={this.props.tallyChoicesNeighbors}
                    countTotalInfluence={this.props.countTotalInfluence}
                />
                <Stats
                    sidebarState={this.props.sidebarState}
                    tallyChoicesNeighbors={this.props.tallyChoicesNeighbors}
                />
            </div>
        );
    }
}

interface SelectedDisplayProps {
    sidebarState: SidebarState;
    map: Graph<MetaAgent, Relation>;
    tallyChoicesNeighbors: (
        map: Graph<MetaAgent, Relation>,
        agent: Agent
    ) => choiceTally;
    countTotalInfluence(map: Graph<MetaAgent, Relation>, agent: Agent): String;
    countTotalInfluence(map: Graph<MetaAgent, Relation>, agent: Agent): String;
}

// Display Component located in App.tsx
class SelectedDisplay extends React.Component<SelectedDisplayProps> {
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
                <div className="agent-type">
                    Selected: <span className="agent-name">{name}</span>
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
        map: Graph<MetaAgent, Relation>,
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