import React from "react";
import * as RK from "react-konva";
import "./css/App.css";
import Konva from "konva";
import useImage from "use-image";

import { Face, Hat, GeneratePawn } from "./generators/pawn";
import { PlayerSidebar } from "./components/playerSideBar";
import { SelectedSidebar } from "./components/selectedSideBar";
import { Board } from "./components/board";
import { Grid } from "./generators/map";
import {
    MetaAgent,
    Agent,
    DeadAgent,
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
};
//export let MAP_INDEX = 0;
let currentMap = "Pronged";

const DIFFICULTY_VALUES: { [key: string]: number } = {
    easy: 20,
    medium: 15,
    hard: 10,
    extreme: 5,
};

class SidebarState {
    player: MetaAgent;
    selected: MetaAgent;
    playerToSelected: Relation | undefined;
    selectedToPlayer: Relation | undefined;
    influenceChoices: SpendingContainer;

    constructor(
        map: Graph<MetaAgent, Relation>,
        player: MetaAgent,
        selected: MetaAgent
    ) {
        this.player = player;
        this.selected = selected;
        this.playerToSelected = map.getEdge(player, selected)!;
        this.selectedToPlayer = map.getEdge(selected, player)!;
        this.influenceChoices = new SpendingContainer();
    }
}

interface GameViewState {
    map: Graph<MetaAgent, Relation>;
    sidebarState: SidebarState;
    select: (agent: MetaAgent) => void;
    turnCount: number;
}

export interface StartInfo {
    //Using strings until it's connected up
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

        currentMap = props.mapImage;

        // TODO: put this in the JSON
        //A random agent in the graph is selected to be the player
        const player =
            map.getVertices()[
                Math.floor(Math.random() * map.getVertices().length)
            ];
        if (player instanceof Agent) {
            player.face = Face[props.face as keyof typeof Face];
            player.hat = Hat[props.hat as keyof typeof Hat];

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

        let select = (agent: MetaAgent) => {
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
        };
        //checking to see if props are coming in
        console.log("GameView");
        console.log(props);
    }

    tallyChoicesForAllNeighbors(
        map: Graph<MetaAgent, Relation>,
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

    countTotalInfluence(map: Graph<MetaAgent, Relation>, agent: Agent): String {
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

        this.handleDead(vertices);
        this.forceUpdate();
    }

    drainResources(vertices: MetaAgent[]) {
        vertices.forEach((v1) => {
            if (v1 instanceof Agent) {
                v1.resources -= RESOURCE_LOST_PER_TURN;
            }
        });
    }

    drainInfluence(edges: [MetaAgent, MetaAgent, Relation][]) {
        edges.forEach(([v1, v2, e]) => {
            if (v2 instanceof Agent) {
                const v2Agent = v2 as Agent;
                const maxInfluenceChange =
                    BASE_INFLUENCE_LOST_PER_TURN *
                    v2Agent.getInfluenceability();
                e.influence = e.incrementAttributeBy(
                    -maxInfluenceChange,
                    e.influence
                );
            }
        });
    }

    handleInfluenceChanges(vertices: MetaAgent[]) {
        vertices.forEach((v1) => {
            if (v1 instanceof Agent) {
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
            }
        });
    }

    generateRound(edges: [MetaAgent, MetaAgent, Relation][]) {
        const turnsToSample: number = 10;
        edges.forEach(([v1, v2, e1]) => {
            if (v1 instanceof Agent) {
                if (v2 instanceof Agent) {
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
                }
            }
        });

        this.setState((state) => {
            return { turnCount: this.state.turnCount + 1 };
        });
    }

    handleDead(vertices: MetaAgent[]) {
        vertices.forEach((v1) => {
            // If agent has recently hit 0 resources, replace with dead agent. Keep relations but
            // set influence to 0. Update graph with dead agent and modified relations
            if (v1 instanceof Agent && v1.resources < 0) {
                const vDead = new DeadAgent(v1.coords, v1.id);
                let v1Edges = this.state.map.getEdges(v1);
                if (v1Edges) {
                    v1Edges.forEach((e1, v2) => {
                        e1.influence = 0;
                        this.state.map.getEdges(v2)?.forEach((e2, v3) => {
                            if (v3 === v1) {
                                this.state.map.getEdges(v2)?.delete(v1);
                                this.state.map.getEdges(v2)?.set(vDead, e2);
                            }
                        });
                    });

                    this.state.map.updateVertex(v1, vDead, v1Edges);
                }
            }
            // If dead agent has been dead long enough, generate new agent with modified
            // relations and update graph.
            else if (v1 instanceof DeadAgent && v1.deadCount === 3) {
                // Make new random agent but keep meta data.
                const vNew = new Agent(
                    v1.id.toString(),
                    new Ideology(10, 10),
                    new Personality(10, 10),
                    // TODO: these should be lower
                    100,
                    100,
                    v1.id,
                    v1.coords
                );
                // Maintain edge history but reset influence for new agent
                let vEdges = this.state.map.getEdges(v1);
                if (vEdges) {
                    vEdges.forEach((e1, v2) => {
                        e1.influence = 0;
                        this.state.map.getEdges(v2)?.forEach((e2, v3) => {
                            if (v3 === v1) {
                                this.state.map.getEdges(v2)?.delete(v1);
                                this.state.map.getEdges(v2)?.set(vNew, e2);
                            }
                        });
                    });

                    this.state.map.updateVertex(v1, vNew, vEdges);
                }
            }
            // If dead agent has not met maximum dead count, increment dead count
            else if (v1 instanceof DeadAgent && v1.deadCount < 3) {
                v1.deadCount += 1;
            }
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
        neighbors.forEach((relation: Relation, neighbor: MetaAgent) => {
            if (neighbor instanceof Agent) {
                const theirInfluence = this.state.map.getEdge(
                    neighbor,
                    agent
                )!.influence;
                ideologyAppeal.set(neighbor.ideology, theirInfluence);
                totalInfluence += theirInfluence;
            }
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

    render() {
        return (
            <div className="game">
                <Board
                    map={this.state.map}
                    turnCount={this.state.turnCount}
                    selected={this.state.sidebarState.selected}
                    select={this.state.select.bind(this)}
                    player = {this.state.sidebarState.player}
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
                />
            </div>
        );
    }
}

interface DisplayState {
    scale: number;
}

interface DisplayProps {
    map: Graph<MetaAgent, Relation>;
    agent: MetaAgent;
    agentChoices: choiceTally;
    countTotalInfluence(map: Graph<MetaAgent, Relation>, agent: Agent): String;
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
                                alive={this.props.agent.isAlive()}
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
    agent: MetaAgent;
}

function Mood(props: MoodProps) {
    const imgScale: number = 0.1;

    let moodDesc: String;
    let moodImgPath: string;

    if (props.agent instanceof Agent) {
        const agent = props.agent as Agent;
        moodDesc = agent.getMoodDescription();
        moodImgPath =
            "images/mood-" +
            moodDesc.split(" ").join("-").toLowerCase() +
            ".png";
    } else {
        moodDesc = "dead";
        moodImgPath = "images/mood-dead.png";
    }

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

interface AliveAgentImageProps {
    x: number;
    y: number;
    selected: boolean;
    data: Agent;
    player: MetaAgent;
}

export function AliveAgentImage(props: AliveAgentImageProps) {
    let imageNode = React.useRef<any>(null);

    let defaultScale = 0.12;
    let selectedScale = 0.18;
    let hoverScale = 0.14;

    // Make the user's player larger in size 
    if (props.data.id == props.player.id){
        defaultScale = 0.2;
        selectedScale = 0.2;
        hoverScale = 0.2;

    }

    let scale = props.selected ? selectedScale : defaultScale;

    let face = Face.Glasses;
    let hat = Hat.Cap;
    let ideology = { red: 0, green: 150, blue: 200 };
    face = props.data.face;
    hat = props.data.hat;

    const handleHover = (
        event: KonvaEventObject<MouseEvent>,
        isOver: boolean
    ) => {
        event.target = imageNode.current;
        if (!props.selected) {
            event.target.to({
                scaleX: isOver ? hoverScale : defaultScale,
                scaleY: isOver ? hoverScale : defaultScale,
                x:
                    props.x -
                    (AGENT_IMAGE_WIDTH / 2) *
                        (isOver ? hoverScale : defaultScale),
                y:
                    props.y -
                    (AGENT_IMAGE_HEIGHT / 2) *
                        (isOver ? hoverScale : defaultScale) -
                    20,
                duration: 0.1,
            });
        }
    };

    const handleClick = (event: KonvaEventObject<MouseEvent>) => {
        event.target = imageNode.current;
        event.target.to({
            scaleX: selectedScale,
            scaleY: selectedScale,
            x: props.x - (AGENT_IMAGE_WIDTH / 2) * selectedScale,
            y: props.y - (AGENT_IMAGE_HEIGHT / 2) * selectedScale - 20,
            duration: 0.15,
        });
    };

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

    return (
        <RK.Group
            ref={imageNode}
            scaleX={scale}
            scaleY={scale}
            x={props.x - (AGENT_IMAGE_WIDTH / 2) * scale}
            y={props.y - (AGENT_IMAGE_HEIGHT / 2) * scale - 20}
            onMouseOver={(event: KonvaEventObject<MouseEvent>) => {
                handleHover(event, true);
            }}
            onMouseOut={(event: KonvaEventObject<MouseEvent>) => {
                handleHover(event, false);
            }}
            onClick={(event: KonvaEventObject<MouseEvent>) => {
                handleClick(event);
            }}
        >
            {GeneratePawn(hat, face, ideology)}
        </RK.Group>
    );
}

interface DeadAgentImageProps {
    x: number;
    y: number;
}

export function DeadAgentImage(props: DeadAgentImageProps) {
    let imageNode: any = null;
    const [deadImage] = useImage("pawns/gravestone.png");

    const scale = 0.12;

    return (
        <RK.Image
            ref={(node) => {
                imageNode = node;
            }}
            image={deadImage}
            x={props.x - (AGENT_IMAGE_WIDTH / 2) * scale}
            y={props.y - (AGENT_IMAGE_HEIGHT / 2) * scale - 20}
            scaleX={scale}
            scaleY={scale}
            offsetX={130 * scale * 2}
            offsetY={145 * scale * 2}
        />
    );
}

interface SidebarAgentImageType {
    canvasWidth: number;
    alive: boolean;
    data: MetaAgent;
}

export function SidebarAgentImage(props: SidebarAgentImageType) {
    const [deadImage] = useImage("pawns/gravestone.png");
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

    if (props.alive) {
        return (
            <RK.Group scaleX={scale} scaleY={scale}>
                {GeneratePawn(hat, face, ideology)}
            </RK.Group>
        );
    } else {
        return <RK.Image image={deadImage} scaleX={scale} scaleY={scale} />;
    }
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