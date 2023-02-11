import React, { MutableRefObject } from "react";
import { TurnLog, Choice } from "./strategy";
import * as util from "../utilities";
import * as RK from "react-konva";
import { AGENT_RADIUS, Ideology } from "./agent";
import useImage from "use-image";

const clr = {
    grn: "#2ccd98",
    dgrn: "#007a52",
    red: "#f67893",
    dred: "#d13f5f",
};

interface AnimChoiceProps {
    turnCount: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    history: TurnLog | undefined;
}

export function AnimChoice(props: AnimChoiceProps) {
    const delay = 500;
    let arcNode = React.useRef<any>(null);
    const centerX: number = util.midpoint(props.x1, props.x2);
    const centerY: number = util.midpoint(props.y1, props.y2);

    React.useEffect(() => {
        // Shrinks half circle to invisibility
        if (props.turnCount > 0) {
            setTimeout(() => {
                arcNode.current.to({
                    outerRadius: 0,
                    x: centerX,
                    y: centerY,
                    duration: 0.2,
                    fill: "white",
                    stroke: "gray",
                });
            }, 50 + delay);

            // Resets half circle position at agent's location (not visible)
            setTimeout(() => {
                arcNode.current.to({
                    x: props.x1,
                    y: props.y1,
                    strokeWidth: 0,
                    opacity: 0,
                    duration: 0,
                });
            }, 300 + delay);

            // Half circle grows and moves toward center
            setTimeout(() => {
                arcNode.current.to({
                    outerRadius: 12,
                    x: centerX,
                    y: centerY,
                    duration: 0.5,
                    strokeWidth: 2,
                    opacity: 1,
                    fill: "white",
                });
            }, 400 + delay);

            // Fades in color after half circles in correct place
            setTimeout(() => {
                arcNode.current.to({
                    fill:
                        props.history?.lastAction() === Choice.Give
                            ? clr.grn
                            : clr.red,
                    stroke:
                        props.history?.lastAction() === Choice.Give
                            ? clr.dgrn
                            : clr.dred,
                    duration: 0.2,
                });
            }, 1000 + delay);

            setTimeout(() => {
                arcNode.current.to({
                    outerRadius: 9,
                    duration: 0.15,
                });
            }, 1350 + delay);
        }
    }, [props.history?.length()]);

    return (
        <RK.Arc
            ref={arcNode}
            x={centerX}
            y={centerY}
            innerRadius={0}
            outerRadius={0}
            angle={180}
            strokeWidth={2}
            rotation={
                (util.angle(props.x1, props.y1, props.x2, props.y2) -
                    (3 * Math.PI) / 2) *
                (180 / Math.PI)
            }
            opacity={0}
        />
    );
}
interface AnimMoodProps {
    turnCount: number;
    x: number;
    y: number;
    mood: number | undefined;
}

export function AnimMood(props: AnimMoodProps) {
    const [moodUp] = useImage("images/anim-mood-positive.png");
    const [moodDown] = useImage("images/anim-mood-negative.png");
    const [moodNeutral] = useImage("");
    const delay = 0;
    let imageNode = React.useRef<any>(null);
    let moodChange: number = 0;
    const previousMood: MutableRefObject<number | undefined> = React.useRef(
        props.mood
    );

    React.useEffect(() => {
        previousMood.current = props.mood;
    });

    if (previousMood.current && props.mood) {
        moodChange = props.mood - previousMood.current;
    }

    // Only animate if props.mood changes and not on startup
    React.useEffect(() => {
        // Reset to starting position (nearer agent's head)
        if (props.turnCount > 0) {
            setTimeout(() => {
                imageNode.current.to({
                    y: props.y - AGENT_RADIUS / 2,
                    duration: 0,
                    opacity: 0,
                });
            }, 1050 + delay);
            // Pop up and wait for about a second
            setTimeout(() => {
                imageNode.current.to({
                    y: props.y - 40,
                    duration: 0.2,
                    opacity: 1,
                });
            }, 2100 + delay);
            // Move up and fade out
            setTimeout(() => {
                imageNode.current.to({
                    y: props.y - 50,
                    duration: 0.6,
                    opacity: 0,
                });
            }, 4000 + delay);
        }
    }, [props.mood]);

    return (
        <RK.Image
            ref={imageNode}
            image={
                moodChange > 0
                    ? moodUp
                    : moodChange < 0
                    ? moodDown
                    : moodNeutral
            }
            x={props.x}
            y={props.y - 50}
            width={AGENT_RADIUS * 2}
            height={AGENT_RADIUS * 2}
            offsetY={AGENT_RADIUS * 3}
            offsetX={AGENT_RADIUS}
            opacity={0}
        />
    );
}

interface AnimResourcesProps {
    turnCount: number;
    x: number;
    y: number;
    resources: number | undefined;
}

export function AnimResources(props: AnimResourcesProps) {
    // let textNode: any = null;
    // let circleNode: any = null;
    const textNode = React.useRef<any>(null);
    const circleNode = React.useRef<any>(null);
    const delay = 2000;
    const prevResources: MutableRefObject<number | undefined> = React.useRef(
        props.resources
    );
    let resourceDiff: number = 0;

    React.useEffect(() => {
        prevResources.current = props.resources;
    });

    if (prevResources.current && props.resources) {
        resourceDiff = props.resources - prevResources.current;
    }

    React.useEffect(() => {
        // Grow and move circle and text up
        if (props.turnCount > 0) {
            setTimeout(() => {
                textNode.current.to({
                    duration: 0.2,
                    y: props.y - AGENT_RADIUS / 2,
                });
                circleNode.current.to({
                    duration: 0.2,
                    radius: AGENT_RADIUS,
                    opacity: 1,
                    y: props.y,
                    strokeWidth: 3,
                });
            }, 1000 + delay);

            // Shrink circle slightly, fade in points
            setTimeout(() => {
                textNode.current.to({
                    duration: 0.3,
                    opacity: 1,
                    y: props.y - AGENT_RADIUS / 2,
                });
                circleNode.current.to({
                    duration: 0.1,
                    radius: AGENT_RADIUS / 1.2,
                });
            }, 1250 + delay);

            // Shrink circle and text to invisible after a couple seconds
            setTimeout(() => {
                textNode.current.to({
                    duration: 0,
                    opacity: 0,
                    y: props.y + AGENT_RADIUS,
                });
                circleNode.current.to({
                    duration: 0.2,
                    radius: 0,
                    y: props.y + AGENT_RADIUS,
                    strokeWidth: 0,
                });
            }, 4000 + delay);
        }
    }, [props.resources]);

    return (
        <RK.Group>
            <RK.Circle
                ref={circleNode}
                x={props.x}
                y={props.y + AGENT_RADIUS}
                radius={0}
                fill={
                    resourceDiff < 0
                        ? clr.dred
                        : resourceDiff > 0
                        ? clr.dgrn
                        : "gray"
                }
                stroke={
                    resourceDiff < 0
                        ? clr.red
                        : resourceDiff > 0
                        ? clr.grn
                        : "#cccccc"
                }
                strokeWidth={0}
            />
            <RK.Text
                ref={textNode}
                text={
                    resourceDiff < 0
                        ? resourceDiff.toString()
                        : resourceDiff > 0
                        ? "+" + resourceDiff.toString()
                        : "~"
                }
                x={props.x - AGENT_RADIUS / 1.5}
                y={props.y + AGENT_RADIUS}
                width={AGENT_RADIUS * 1.3}
                height={AGENT_RADIUS}
                fontSize={AGENT_RADIUS}
                fill="white"
                align="center"
                verticalAlign="middle"
                opacity={0}
            />
        </RK.Group>
    );
}

interface AnimInfluenceProps {
    turnCount: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    influence: number | undefined;
}

export function AnimInfluence(props: AnimInfluenceProps) {
    let arc1Node = React.useRef<any>(null);
    let arc2Node = React.useRef<any>(null);
    let arc3Node = React.useRef<any>(null);
    const iRad: number = 42;
    const oRad: number = 50;
    const delay: number = 6200;

    React.useEffect(() => {
        // Reset both arcs to invisible by shrinking
        if (props.turnCount > 0) {
            setTimeout(() => {
                arc1Node.current.to({
                    innerRadius: 0,
                    outerRadius: 0,
                    duration: 0,
                    opacity: 1,
                });
                arc2Node.current.to({
                    innerRadius: 0,
                    outerRadius: 0,
                    duration: 0,
                    opacity: 1,
                });
                arc3Node.current.to({
                    innerRadius: 0,
                    outerRadius: 0,
                    duration: 0,
                    opacity: 1,
                });
            }, 0 + delay);

            // Grow "voice" and fade out
            setTimeout(() => {
                arc1Node.current.to({
                    innerRadius: iRad,
                    outerRadius: oRad,
                    duration: 1,
                    opacity: 0,
                });
            }, 50 + delay);

            setTimeout(() => {
                arc2Node.current.to({
                    innerRadius: iRad,
                    outerRadius: oRad,
                    duration: 1,
                    opacity: 0,
                });
            }, 250 + delay);

            setTimeout(() => {
                arc3Node.current.to({
                    innerRadius: iRad,
                    outerRadius: oRad,
                    duration: 1,
                    opacity: 0,
                });
            }, 450 + delay);
        }
    }, [props.influence]);

    return (
        <RK.Group>
            <RK.Arc
                ref={arc1Node}
                innerRadius={0}
                outerRadius={0}
                x={props.x1}
                y={props.y1}
                angle={45}
                fill="indigo"
                rotation={
                    (util.angle(props.x1, props.y1, props.x2, props.y2) -
                        Math.PI / 8) *
                    (180 / Math.PI)
                }
            />

            <RK.Arc
                ref={arc2Node}
                innerRadius={0}
                outerRadius={0}
                x={props.x1}
                y={props.y1}
                angle={45}
                fill="indigo"
                rotation={
                    (util.angle(props.x1, props.y1, props.x2, props.y2) -
                        Math.PI / 8) *
                    (180 / Math.PI)
                }
            />

            <RK.Arc
                ref={arc3Node}
                innerRadius={0}
                outerRadius={0}
                x={props.x1}
                y={props.y1}
                angle={45}
                fill="indigo"
                rotation={
                    (util.angle(props.x1, props.y1, props.x2, props.y2) -
                        Math.PI / 8) *
                    (180 / Math.PI)
                }
            />
        </RK.Group>
    );
}

interface AnimChangeIdeologyProps {
    turnCount: number;
    x: number;
    y: number;
    ideology: Ideology | undefined;
}

export function AnimChangeIdeology(props: AnimChangeIdeologyProps) {
    let line1Node = React.useRef<any>(null);
    let line2Node = React.useRef<any>(null);
    let line3Node = React.useRef<any>(null);
    const iRad: number = 8;
    const oRad: number = 20;
    const delay: number = 8000;

    React.useEffect(() => {
        // Reset lines
        if (props.turnCount > 0) {
            console.log("HERE");
            setTimeout(() => {
                line1Node.current.to({
                    duration: 0,
                    x: props.x - 10,
                    y: props.y - 35,
                });
                line2Node.current.to({
                    duration: 0,
                    y: props.y - 40,
                });
                line3Node.current.to({
                    duration: 0,
                    x: props.x + 12,
                    y: props.y - 35,
                });
            }, 0 + delay);

            // Fade in lines and move slightly
            setTimeout(() => {
                line1Node.current.to({
                    x: props.x - 15,
                    y: props.y - 40,
                    innerRadius: iRad,
                    outerRadius: oRad,
                    opacity: 1,
                    duration: 0.1,
                });
            }, 50 + delay);

            setTimeout(() => {
                line2Node.current.to({
                    y: props.y - 45,
                    innerRadius: iRad,
                    outerRadius: oRad,
                    opacity: 1,
                    duration: 0.1,
                });
            }, 125 + delay);

            setTimeout(() => {
                line3Node.current.to({
                    x: props.x + 15,
                    y: props.y - 40,
                    innerRadius: iRad,
                    outerRadius: oRad,
                    opacity: 1,
                    duration: 0.1,
                });
            }, 200 + delay);

            // Delay before fading lines out
            setTimeout(() => {
                line1Node.current.to({ opacity: 0, duration: 0.3 });
                line2Node.current.to({ opacity: 0, duration: 0.3 });
                line3Node.current.to({ opacity: 0, duration: 0.3 });
            }, 1000 + delay);
        }
    }, [props.ideology?.toStrategy()]);

    return (
        <RK.Group>
            <RK.Arc
                ref={line1Node}
                innerRadius={2}
                outerRadius={8}
                x={props.x - 10}
                y={props.y - 35}
                angle={15}
                fill="orange"
                rotation={-130}
                opacity={0}
            />
            <RK.Arc
                ref={line2Node}
                innerRadius={2}
                outerRadius={8}
                x={props.x + 1}
                y={props.y - 40}
                angle={15}
                fill="orange"
                rotation={-98}
                opacity={0}
            />
            <RK.Arc
                ref={line3Node}
                innerRadius={2}
                outerRadius={8}
                x={props.x + 12}
                y={props.y - 35}
                angle={15}
                fill="orange"
                rotation={-66}
                opacity={0}
            />
        </RK.Group>
    );
}
