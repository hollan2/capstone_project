import React from "react";
import * as RK from "react-konva";
import "../css/App.css";
import Konva from "konva";
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

interface SelectedSidebarProps {
    sidebarState: SidebarState;
    map: Graph<Agent, Relation>;
    tallyChoicesNeighbors: (
        map: Graph<Agent, Relation>,
        agent: Agent
    ) => choiceTally;
    countTotalInfluence(map: Graph<Agent, Relation>, agent: Agent): String;
    round: () => void;
}

interface SelectedSidebarProps {
    sidebarState: SidebarState;
    map: Graph<Agent, Relation>;
    tallyChoicesNeighbors: (
        map: Graph<Agent, Relation>,
        agent: Agent
    ) => choiceTally;
    countTotalInfluence(map: Graph<Agent, Relation>, agent: Agent): String;
    round: () => void;
    deselectCharacter:(value: boolean) => void;
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
                    deselectCharacter={this.props.deselectCharacter}
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
    map: Graph<Agent, Relation>;
    tallyChoicesNeighbors: (
        map: Graph<Agent, Relation>,
        agent: Agent
    ) => choiceTally;
    
    countTotalInfluence(map: Graph<Agent, Relation>, agent: Agent): String;
    countTotalInfluence(map: Graph<Agent, Relation>, agent: Agent): String;
    deselectCharacter:(value: boolean) => void;
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
                        }}>
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