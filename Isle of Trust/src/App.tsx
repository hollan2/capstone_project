import React from "react";
import * as RK from "react-konva";
import "./css/App.css";
import Konva from "konva";

//CP-49
//yarn add react-icons
//yarn add react-animated-text-content
import { ImArrowRight } from "react-icons/im";
import AnimatedText from "react-animated-text-content";
import { BsExclamationCircleFill } from "react-icons/bs";

import Popover from "react-bootstrap/Popover";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";

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

//CP-49
interface TutorialGuideProps {
    turnCount: number;
    stageCount: number;
    onClick: () => void;
}
interface TutorialGuideState {
    hint: boolean;
}
class TutorialGuide extends React.Component<
    TutorialGuideProps,
    TutorialGuideState
> {
    constructor(props: TutorialGuideProps) {
        super(props);
        this.state = {
            hint: true,
        };
    }

    getText(stage: number): string {
        let text = "";

        //TODO: This should be read from a .txt file, it's polluting the code.
        if (stage === 0) {
            text =
                "Welcome to Isle of Trust! Lorem ipsum dolor sit amet, consectetur adipisicing elit.";
        } else if (stage === 1) {
            text =
                "This is the player panel. Lorem ipsum dolor sit amet, consectetur adipisicing elit.";
        } else if (stage === 2) {
            text =
                "This is the spend resources panel. Blah Blah Blah. Now it's your turn, try to spend some resources.";
        }
        if (stage === 3) {
            this.setState((state) => {
                return { hint: false };
            });
        }
        return text;
    }

    //TODO: This render() should be split up into two different components: Professor and Hint
    //Then it will get simplified to:

    //  if(this.state.hint){
    //      < Professor/>
    //  } else {
    //      < Hint/>
    //  }

    render() {
        const popover = (
            <Popover id="popover-basic">
                <Popover.Header as="h3">Hint!</Popover.Header>
                <Popover.Body>
                    Something <strong>really</strong> helpful.
                </Popover.Body>
            </Popover>
        );
        if (this.state.hint) {
            return (
                <div className="tutorialGuide disable">
                    <div className="textBox">
                        <AnimatedText
                            type="chars" // animate words or chars
                            animation={{
                                x: "200px",
                                y: "-20px",
                                scale: 1.1,
                                ease: "ease-in-out",
                            }}
                            animationType="wave"
                            interval={0.06} //controls the text speed
                            duration={0.5} //controls the text speed
                            tag="p"
                            className="animated-paragraph"
                            includeWhiteSpaces
                            threshold={0.1}
                            rootMargin="20%"
                        >
                            {this.getText(this.props.stageCount)}
                        </AnimatedText>
                        <button
                            className="btn arrowbtn"
                            onClick={this.props.onClick}
                        >
                            <ImArrowRight size={20} color={"green"} />
                        </button>
                    </div>
                    <img
                        src="public/images/professor.png"
                        alt="professor pawn"
                        width="96"
                        height="184"
                    />
                </div>
            );
        } else {
            return (
                <div>
                    <OverlayTrigger
                        trigger="click"
                        placement="left"
                        overlay={popover}
                    >
                        <button
                            type="button"
                            className="hintbtn btn btn-lg btn-light"
                            data-bs-toggle="modal"
                            data-bs-target="#exampleModal"
                        >
                            <BsExclamationCircleFill
                                size={25}
                                color="MidnightBlue"
                            />{" "}
                            Hint
                        </button>
                    </OverlayTrigger>
                </div>
            );
        }
    }
}

//END CP-49
interface GameViewState {
    map: Graph<Agent, Relation>;
    sidebarState: SidebarState;
    select: (agent: Agent) => void;
    turnCount: number;
    selectCharacterDisplay: boolean;
    //CP-49
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
}
class GameView extends React.Component<StartInfo, GameViewState> {
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
        //CP-49
        const stageCount = 0;

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
            player.name = props.name;

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
            //CP-49
            stageCount: stageCount,
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
                BASE_INFLUENCE_LOST_PER_TURN * v2Agent.getInfluenceability();
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
                const v1Choice = generateChoice(v1Strat, v1.mood, e2.history);
                const v2Choice = generateChoice(v2Strat, v2.mood, e1.history);

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
        this.setState({ selectCharacterDisplay: value });
    }

    //CP-49
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
                    <Board
                        map={this.state.map}
                        turnCount={this.state.turnCount}
                        selected={this.state.sidebarState.selected}
                        select={this.state.select.bind(this)}
                        player={this.state.sidebarState.player}
                        deselectCharacter={this.deselectCharacter}
                        current={currentMap}
                    />
                    <PlayerSidebar
                        map={this.state.map}
                        round={this.tempTurn.bind(this)}
                        sidebarState={this.state.sidebarState}
                        tallyChoicesNeighbors={this.tallyChoicesForAllNeighbors}
                        countTotalInfluence={this.countTotalInfluence}
                        // CP-49
                        stageCount={this.state.stageCount}
                    />
                    <SelectedSidebar
                        map={this.state.map}
                        round={this.tempTurn.bind(this)}
                        sidebarState={this.state.sidebarState}
                        tallyChoicesNeighbors={this.tallyChoicesForAllNeighbors}
                        countTotalInfluence={this.countTotalInfluence}
                        deselectCharacter={this.deselectCharacter}
                    />
                    {/* CP-49 */}
                    <TutorialGuide
                        turnCount={this.state.turnCount}
                        stageCount={this.state.stageCount}
                        onClick={this.handleClick}
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
                        player={this.state.sidebarState.player}
                        deselectCharacter={this.deselectCharacter}
                        current={currentMap}
                    />
                    <PlayerSidebar
                        map={this.state.map}
                        round={this.tempTurn.bind(this)}
                        sidebarState={this.state.sidebarState}
                        tallyChoicesNeighbors={this.tallyChoicesForAllNeighbors}
                        countTotalInfluence={this.countTotalInfluence}
                        // CP-49
                        stageCount={this.state.stageCount}
                    />
                    {/* CP-49 */}
                    <TutorialGuide
                        turnCount={this.state.turnCount}
                        stageCount={this.state.stageCount}
                        onClick={this.handleClick}
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
        "images/mood-" + moodDesc.split(" ").join("-").toLowerCase() + ".png";

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
