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
import { AliveAgentImage } from "../App";
import { DeadAgentImage } from "../App";
import {
    MetaAgent,
    Agent,
    DeadAgent,
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
};


const DIFFICULTY_VALUES: { [key: string]: number } = {
    easy: 20,
    medium: 15,
    hard: 10,
    extreme: 5,
};



interface BoardProps {

    map: Graph<MetaAgent, Relation>;
    turnCount: number;
    selected: MetaAgent;
    select: (agent: MetaAgent) => void;
    player: MetaAgent;
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

    select(pawn: MetaAgent) {
        this.props.select(pawn);
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
                                        if (v.isAlive()) {
                                            this.select(v);
                                        }
                                    }}
                                >
                                    {v instanceof Agent ? (
                                        <AliveAgentImage
                                            x={v.coords[0]}
                                            y={v.coords[1]}
                                            selected={this.props.selected === v}
                                            data={v}
                                            player={this.props.player}
                                        />
                                    ) : (
                                        <DeadAgentImage
                                            x={v.coords[0]}
                                            y={v.coords[1]}
                                        />
                                    )}

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