import React, { useEffect } from "react";
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
import { SelectedSidebar } from "../components/selectedSideBar";
import { SidebarState } from "../components/sideBarState";
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

interface BoardProps {
    map: Graph<Agent, Relation>;
    turnCount: number;
    selected: Agent;
    select: (agent: Agent) => void;
    player: Agent;
    deselectCharacter: (value: boolean) => void;
    current: string;
}

export class Board extends React.Component<BoardProps> {
    private containerRef = React.createRef<HTMLDivElement>();
    private stageRef = React.createRef<Konva.Stage>();

    private resizeTimeout?: NodeJS.Timeout;

    componentDidMount() {
        this.resizeEvent = this.resizeEvent.bind(this);
        this.resizeEvent();
        window.addEventListener("resize", this.resizeEvent);
        this.select(this.props.selected);
        this.deselectCharacter(true); 
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

            let scale = container.offsetWidth / SCENE_WIDTH;

            stage.width(SCENE_WIDTH * scale);
            stage.height(SCENE_HEIGHT * scale);
            stage.scale({ x: scale, y: scale });
        }, RESIZE_TIMEOUT);
    }

    select(pawn: Agent) {
        this.props.select(pawn);
    }

    deselectCharacter(value: boolean) {
        this.props.deselectCharacter(value);
    }

    render() {

        return (
            <div className="board">
                <div
                    className="map"
                    ref={this.containerRef}
                    style={{
                        backgroundImage: MAP_URL[this.props.current],
                        backgroundSize: "100%",
                    }}
                >
                    {/* <img src={require("./assets/Maps/prongedMap.png")} /> //not working  */}

                    <RK.Stage ref={this.stageRef}>
                        <RK.Layer>
                            {this.props.map.getAllEdges().map(([v1, v2, e]) => (
                                <RK.Line
                                    key={v1.id + "->" + v2.id}
                                    points={util.edgeLinePoints(
                                        v1.coords[0],
                                        v1.coords[1],
                                        v2.coords[0],
                                        v2.coords[1]
                                    )}
                                    strokeLinearGradientStartPointX={
                                        v1.coords[0]
                                    }
                                    strokeLinearGradientStartPointY={
                                        v1.coords[1]
                                    }
                                    strokeLinearGradientEndPointX={v2.coords[0]}
                                    strokeLinearGradientEndPointY={v2.coords[1]}
                                    strokeLinearGradientColorStops={[
                                        0,
                                        "white",
                                        1,
                                        util.colorFromWeight(e.influence),
                                    ]}
                                    opacity={0.6}
                                    strokeWidth={4}
                                    fillAfterStrokeEnabled={true}
                                    pointerLength={AGENT_RADIUS / 3}
                                    pointerWidth={AGENT_RADIUS / 3}
                                    lineJoin="round"
                                    lineCap="round"
                                />
                            ))}

                            {this.props.map.getVertices().map((v) => (
                                <RK.Group
                                    key={v.id}
                                    onClick={(
                                        event: KonvaEventObject<MouseEvent>
                                    ) => {
                                        {
                                            this.select(v);
                                            this.deselectCharacter(true);
                                        }
                                    }}
                                >
                                    <AgentImage
                                        x={v.coords[0]}
                                        y={v.coords[1]}
                                        selected={this.props.selected === v}
                                        data={v}
                                        player={this.props.player}
                                    />

                                    {/* Debug text: */}

                                    {/* <RK.Text
                                        text={
                                            v instanceof Agent
                                                ? v.resources.toString()
                                                : v instanceof DeadAgent
                                                ? v.deadCount.toString()
                                                : v.id.toString()
                                        }
                                        x={v.coords[0] - AGENT_RADIUS / 2}
                                        y={v.coords[1] - AGENT_RADIUS / 2}
                                        width={AGENT_RADIUS * 3}
                                        height={AGENT_RADIUS * 3}
                                        offsetX={AGENT_RADIUS * 3}
                                        offsetY={AGENT_RADIUS}
                                        fontSize={AGENT_RADIUS}
                                        fill={v.isAlive() ? "black" : "red"}
                                        shadowOffsetX={1}
                                        shadowOffsetY={1}
                                        align="center"
                                        verticalAlign="middle"
                                    /> */}
                                </RK.Group>
                            ))}
                        </RK.Layer>

                        <RK.Layer>
                            {this.props.map.getVertices().map((v) => (
                                <RK.Group key={v.id + " vertex-anim"}>
                                    {v instanceof Agent && (
                                        <AnimMood
                                            turnCount={this.props.turnCount}
                                            x={v.coords[0]}
                                            y={v.coords[1]}
                                            mood={
                                                v instanceof Agent
                                                    ? v.mood
                                                    : undefined
                                            }
                                        />
                                    )}
                                    {v instanceof Agent && (
                                        <AnimResources
                                            turnCount={this.props.turnCount}
                                            x={v.coords[0]}
                                            y={v.coords[1]}
                                            resources={
                                                v instanceof Agent
                                                    ? v.resources
                                                    : undefined
                                            }
                                        />
                                    )}
                                    {v instanceof Agent && (
                                        <AnimChangeIdeology
                                            turnCount={this.props.turnCount}
                                            x={v.coords[0]}
                                            y={v.coords[1]}
                                            ideology={
                                                v instanceof Agent
                                                    ? v.ideology
                                                    : undefined
                                            }
                                        />
                                    )}
                                </RK.Group>
                            ))}
                        </RK.Layer>

                        <RK.Layer>
                            {this.props.map.getAllEdges().map(([v1, v2, e]) => (
                                <RK.Group key={v1.id + " edge-anim " + v2.id}>
                                    {v1 instanceof Agent &&
                                        v2 instanceof Agent && (
                                            <AnimChoice
                                                turnCount={this.props.turnCount}
                                                x1={v1.coords[0]}
                                                y1={v1.coords[1]}
                                                x2={v2.coords[0]}
                                                y2={v2.coords[1]}
                                                history={e.history}
                                            />
                                        )}
                                    {v1 instanceof Agent &&
                                        v2 instanceof Agent && (
                                            <AnimInfluence
                                                turnCount={this.props.turnCount}
                                                x1={v1.coords[0]}
                                                y1={v1.coords[1]}
                                                x2={v2.coords[0]}
                                                y2={v2.coords[1]}
                                                influence={e.influence}
                                            />
                                        )}
                                </RK.Group>
                            ))}
                        </RK.Layer>
                    </RK.Stage>
                </div>
            </div>
        );
    }
}

interface AgentImageProps {
    x: number;
    y: number;
    selected: boolean;
    data: Agent;
    player: Agent;
}

function AgentImage(props: AgentImageProps) {
    let imageNode = React.useRef<any>(null);

    let defaultScale = 0.12;
    let selectedScale = 0.18;
    let hoverScale = 0.14;

    // Make the user's player larger in size
    if (props.data.id == props.player.id) {
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
