import React from "react";
import * as RK from "react-konva";
import "../css/App.css";
import Konva from "konva";
import { Display } from "../App";
import { SidebarState } from "./sideBarState";
import { SidebarAgentImage } from "../App";
import { Agent, Relation, SpendingContainer } from "../models/agent";
import { Graph } from "../models/graph";
import { choiceTally, Commitment, Choice, Strategy } from "../models/strategy";
import { History } from "./selectedSideBar";

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
    Cruz: "url(../Maps/mapCruz.png)",
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
    libraryrolechange: () => void;
    universityrolechange: () => void;
    turnCount: number;
    stageCount: number;
    promiseRelation: any;
    level: number;
}

export class TutorialPlayerSidebar extends React.Component<
    TutorialPlayerSidebarProps,
    unknown
> {
    render() {
        return (
            <div className="sidebar playerSidebar">
                <PlayerDisplay
                    libraryrolechange={this.props.libraryrolechange}
                    universityrolechange={this.props.universityrolechange}
                    map={this.props.map}
                    sidebarState={this.props.sidebarState}
                    tallyChoicesNeighbors={this.props.tallyChoicesNeighbors}
                    countTotalInfluence={this.props.countTotalInfluence}
                    stageCount={this.props.stageCount}
                    turnCount={this.props.turnCount}
                    level={this.props.level}
                />
                <InfluenceMenu
                    round={this.props.round}
                    sidebarState={this.props.sidebarState}
                    map={this.props.map}
                    turnCount={this.props.turnCount}
                    promiseRelation={this.props.promiseRelation}
                    stageCount={this.props.stageCount}
                    level={this.props.level}
                />
                <History
                    selected={this.props.sidebarState.player}
                    map={this.props.map}
                    turnCount={this.props.turnCount}
                    tutorial={true}
                />
            </div>
        );
    }
}

interface PlayerDisplayProps {
    libraryrolechange: () => void;
    universityrolechange: () => void;
    sidebarState: SidebarState;
    map: Graph<Agent, Relation>;
    tallyChoicesNeighbors: (
        map: Graph<Agent, Relation>,
        agent: Agent
    ) => choiceTally;
    countTotalInfluence(map: Graph<Agent, Relation>, agent: Agent): String;
    stageCount: number;
    turnCount: number;
    level: number;
}

class PlayerDisplay extends React.Component<PlayerDisplayProps> {
    //Decides wheter or not to apply the spotlight CSS class based on level and stageCount
    displaySpotlight(): boolean {
        //Tutorial Level 1, 5, and 7.
        if (this.props.level === 1 && this.props.stageCount === 2) {
            return true;
        } else if (this.props.level === 7 && this.props.stageCount === 2) {
            return true;
        } else if (this.props.level === 5 && this.props.stageCount === 12) {
            return true;
        }
        return false;
    }
    //Decides whether or not to apply the highlightText CSS class based on level and stageCount
    displayTextHighlight(): boolean {
        //Tutorial Level 1.
        if (
            (this.props.level === 1 &&
                this.props.stageCount >= 5 &&
                this.props.stageCount <= 6) ||
            (this.props.level === 1 &&
                this.props.stageCount >= 10 &&
                this.props.stageCount <= 11)
        ) {
            return true;
        }
        return false;
    }

    private library_count = 0;
    private university_count = 0;

    componentDidUpdate(): void {
        if (this.props.level === 5 && this.props.stageCount === 10) {
            this.library_count = 12;
        }
    }

    hintText = (
        <div className="hint-empty">{"Invest in Public Services"}</div>
    );

    //set the text to the hint if the players hover over the invest button
    setText(newText: string) {
        this.hintText = <div className="hint-text">{newText}</div>;
        this.setState({ PlayerDisplay: this });
    }

    //resets the hint
    setEmpty() {
        this.hintText = (
            <div className="hint-empty">{"Invest in Public Services"}</div>
        );
        this.setState({ PlayerDisplay: this });
    }

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
                    this.displaySpotlight()
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
                    turnCount={this.props.turnCount}
                    tutorial={true}
                />

                <div
                    className={
                        this.displaySpotlight()
                            ? "player-display spotlight"
                            : "investmentSidebar"
                    }
                >
                    <div className="investmentSidebar">
                        <div className="influence-title">{this.hintText}</div>
                        <button
                            id="library"
                            className="investmentButton"
                            onMouseEnter={() =>
                                this.setText(
                                    "Hint: Invest 15 to change Suspicous to Students"
                                )
                            }
                            onMouseLeave={() => this.setEmpty()}
                            onClick={() => {
                                //if the invested amount is less than 14 keep adding to the count
                                if (
                                    this.library_count < 14 &&
                                    this.props.sidebarState.player.resources > 0
                                ) {
                                    this.library_count += 1;
                                    this.props.sidebarState.player.resources -= 1;
                                    this.setState({ PlayerDisplay: this });
                                }
                                //if the count is equal to 14, add to the count and change the personas
                                else if (
                                    this.library_count == 14 &&
                                    this.props.sidebarState.player.resources > 0
                                ) {
                                    this.library_count += 1;
                                    this.props.sidebarState.player.resources -= 1;
                                    this.props.libraryrolechange();
                                    //reapply the university changes in case the university was invested first
                                    if (this.university_count == 15)
                                        this.props.universityrolechange();
                                }
                            }}
                        >
                            {" "}
                            Library: {this.library_count}
                        </button>

                        <button
                            id="university"
                            className="investmentButton"
                            onMouseEnter={() =>
                                this.setText(
                                    "Hint: Invest 15 to change Students to Reciprocators"
                                )
                            }
                            onMouseLeave={() => this.setEmpty()}
                            onClick={() => {
                                //if the invested amount is less than 14 keep adding to the count
                                if (
                                    this.university_count < 14 &&
                                    this.props.sidebarState.player.resources > 0
                                ) {
                                    this.university_count += 1;
                                    this.props.sidebarState.player.resources -= 1;
                                    this.setState({ PlayerDisplay: this });
                                }

                                //if the count is equal to 14, add to the count and change the personas
                                else if (
                                    this.university_count === 14 &&
                                    this.props.sidebarState.player.resources > 0
                                ) {
                                    this.university_count += 1;
                                    this.props.sidebarState.player.resources -= 1;
                                    this.props.universityrolechange();
                                }
                            }}
                        >
                            {" "}
                            University: {this.university_count}
                        </button>
                    </div>
                </div>
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
    level: number;
}

class InfluenceMenu extends React.Component<InfluenceMenuProps> {
    public spendingMap = new SpendingContainer();
    //Decides wheter or not to apply the spotlight CSS class based on level and stageCount
    displaySpotlight(): boolean {
        //Tutorial Level 1
        if (
            (this.props.level === 1 &&
                this.props.stageCount >= 3 &&
                this.props.stageCount <= 6) ||
            (this.props.level === 1 &&
                this.props.stageCount >= 9 &&
                this.props.stageCount <= 10)
        ) {
            return true;
        }
        return false;
    }

    //Decides wheter or not to apply the highlightText CSS class based on level and stageCount
    displayTextHighlight(): boolean {
        //Tutorial Level 1
        if (
            (this.props.level === 1 &&
                this.props.stageCount >= 4 &&
                this.props.stageCount <= 5) ||
            (this.props.level === 1 &&
                this.props.stageCount >= 9 &&
                this.props.stageCount <= 10)
        ) {
            return true;
        }
        return false;
    }

    //Decides wheter or not to disable the InfluenceMenu based on level and stageCount
    disableScreen(): boolean {
        //Tutorial Level 1
        if (
            this.props.level === 1 &&
            this.props.stageCount !== 7 &&
            this.props.stageCount !== 11 &&
            this.props.stageCount < 20
        ) {
            return true;
        }
        //Tutorial Level 2
        if (this.props.level === 2 && this.props.stageCount < 5) {
            return true;
        }
        //Tutorial Level 3
        if (this.props.level === 3 && this.props.stageCount < 5) {
            return true;
        }
        //Tutorial Level 4
        if (this.props.level === 4 && this.props.stageCount < 4) {
            return true;
        }
        //Tutorial Level 5
        if (
            (this.props.level === 5 && this.props.stageCount < 3) ||
            (this.props.level === 5 &&
                this.props.stageCount >= 11 &&
                this.props.stageCount <= 12)
        ) {
            return true;
        }
        //Tutorial Level 6
        if (this.props.level === 6 && this.props.stageCount < 4) {
            return true;
        }
        //Tutorial Level 7
        if (this.props.level === 7 && this.props.stageCount < 5) {
            return true;
        }

        return false;
    }
    render() {
        const neighbors = this.props.map.getEdges(
            this.props.sidebarState.player
        )!;

        if (this.props.sidebarState.player instanceof Agent) {
            if (this.props.turnCount % 1 === 0) {
                return (
                    <div
                        className={
                            this.displaySpotlight()
                                ? "influence-menu spotlight"
                                : "influence-menu"
                        }
                        style={
                            this.disableScreen()
                                ? { pointerEvents: "none" }
                                : {}
                        }
                    >
                        <div
                            className={
                                this.displayTextHighlight()
                                    ? "influence-title highlightText"
                                    : "influence-title"
                            }
                        >
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
                    <div
                        className={
                            this.displaySpotlight()
                                ? "influence-menu spotlight"
                                : "influence-menu"
                        }
                        style={
                            this.disableScreen()
                                ? { pointerEvents: "none" }
                                : {}
                        }
                    >
                        <div
                            className={
                                this.displayTextHighlight()
                                    ? "influence-title highlightText"
                                    : "influence-title"
                            }
                        >
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
                        entryNumber={key}
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
    entryNumber: Number;
    allowResources: (giving: number, increment: number) => number;
    resourcesGiveable: number;
    agent: Agent;
    player: Agent;
    spendingMap: SpendingContainer;
    turnCount: number;
    promiseRelation: any;
}

interface InfluenceEntryState {
    buttonClicked: string | null;
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
            buttonClicked: null,
        };
    }

    componentDidUpdate(prevProps: InfluenceEntryProps) {
        if (prevProps.turnCount !== this.props.turnCount) {
            // Reset buttonClicked state when turnCount changes
            this.setState({ buttonClicked: null });
        }
    }

    //gets src promise to dest
    getPromiseBetween(src: Agent, dest: Agent) {
        const promise = src.promises.find((e) => e.promiseTo === dest);
        const commitment = promise?.promise;
        switch (commitment) {
            case 0:
                return "solo";
            case 1:
                return "together";
            case 2:
                return "match";
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
            playerCommitment === "match" &&
            neighborCommitment === "match" &&
            commitment === "together"
        )
            return "honest";
        else if (
            playerCommitment === "match" &&
            commitment === neighborCommitment
        )
            return "honest";
        else return "lie";
    }

    handleButtonChange = (commitment: string) => {
        this.setState((prevState) => {
            if (prevState.buttonClicked === commitment) {
                // Deselect the currently selected button
                return { buttonClicked: null };
            } else {
                // Select the clicked button and reset the other buttons
                return { buttonClicked: commitment };
            }
        });
    };

    render() {
        const { buttonClicked } = this.state;
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
                                    agent={this.props.agent}
                                    turnCount={this.props.turnCount}
                                    tutorial={true}
                                />
                            </RK.Layer>
                        </RK.Stage>
                    </div>
                    <div className="sidebar-agent-info">
                        <button
                            className={`phase-buttons ${
                                buttonClicked === "cooperate"
                                    ? "selected-buttons"
                                    : ""
                            }`}
                            id="cooperate"
                            onClick={() => {
                                player.updatePromise(
                                    Commitment.Cooperate,
                                    agent
                                );
                                this.handleButtonChange("cooperate"); // update buttonClicked state
                            }}
                        >
                            {" "}
                            Together
                        </button>
                        <button
                            className={`phase-buttons ${
                                buttonClicked === "reciprocate"
                                    ? "selected-buttons"
                                    : ""
                            }`}
                            id="reciprocate"
                            onClick={() => {
                                player.updatePromise(
                                    Commitment.Reciprocate,
                                    agent
                                );
                                this.handleButtonChange("reciprocate");
                            }}
                        >
                            {" "}
                            Match
                        </button>
                        <button
                            className={`phase-buttons ${
                                buttonClicked === "compete"
                                    ? "selected-buttons"
                                    : ""
                            }`}
                            id="compete"
                            onClick={() => {
                                player.updatePromise(Commitment.Compete, agent);
                                this.handleButtonChange("compete");
                            }}
                        >
                            {" "}
                            Solo
                        </button>
                    </div>
                </div>
            );
        }

        //action phase
        else {
            return (
                <div className="choices-container">
                    <div className="neighbor-promise">
                        {agent.name + " promised " + aiCommitment}
                    </div>
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
                                        agent={this.props.agent}
                                        turnCount={this.props.turnCount}
                                        tutorial={true}
                                    />
                                </RK.Layer>
                            </RK.Stage>
                        </div>
                        <div className="sidebar-agent-info">
                            <button
                                className={`phase-buttons ${
                                    buttonClicked === "cooperate"
                                        ? "selected-buttons"
                                        : ""
                                }`}
                                id="cooperate"
                                onClick={() => {
                                    //determine if give or cheat then update choice
                                    console.log("Select cooperate");
                                    player.updateChoice(
                                        Choice.Cooperate,
                                        agent
                                    );
                                    this.handleButtonChange("cooperate");
                                }}
                            >
                                <div className="action-container">
                                    <div>Together</div>
                                    <div>
                                        {this.isTruth(
                                            "together",
                                            playerCommitment,
                                            aiCommitment
                                        )}
                                    </div>
                                </div>
                            </button>
                            <button
                                className={`phase-buttons ${
                                    buttonClicked === "compete"
                                        ? "selected-buttons"
                                        : ""
                                }`}
                                id="compete"
                                onClick={() => {
                                    player.updateChoice(Choice.Compete, agent);
                                    this.handleButtonChange("compete");
                                }}
                            >
                                <div className="action-container">
                                    <div>Solo</div>
                                    <div>
                                        {this.isTruth(
                                            "solo",
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
