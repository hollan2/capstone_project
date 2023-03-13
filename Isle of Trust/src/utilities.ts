import { Agent, AGENT_RADIUS } from "./models/agent";

export function randomIntRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min) + min);
}

export function angle(x1: number, y1: number, x2: number, y2: number): number {
    return Math.atan2(y2 - y1, x2 - x1);
}

// Length of line between two vertices (may not need)
export function distance(v1: Agent, v2: Agent): number {
    return Math.sqrt(
        Math.abs(v2.coords[0] - v1.coords[0]) ** 2 +
            Math.abs(v2.coords[1] - v1.coords[1]) ** 2
    );
}

export function midpoint(a: number, b: number) {
    return (a + b) / 2;
}

export function xOnCircum(
    radius: number,
    angle: number,
    transform: number
): number {
    return radius * Math.cos(angle) + transform;
}

export function yOnCircum(
    radius: number,
    angle: number,
    transform: number
): number {
    return radius * Math.sin(angle) + transform;
}

export function edgeLinePoints(
    x1: number,
    y1: number,
    x2: number,
    y2: number
): Array<number> {
    const ang = angle(x1, y1, x2, y2);
    const fromRadius = AGENT_RADIUS + AGENT_RADIUS / 2;
    const toRadius = -AGENT_RADIUS - AGENT_RADIUS / 2;
    return [
        // From vertex
        xOnCircum(fromRadius, ang, x1),
        yOnCircum(fromRadius, ang, y1),
        // To vertex
        xOnCircum(toRadius, ang, x2),
        yOnCircum(toRadius, ang, y2),
    ];
}

// Produces a color string for konva line property using edge weight
export function colorFromWeight(weight: number): string {
    // weight *= 10;
    // Generates random hex color (useful?)
    //return "#" + (Math.floor(weight) * 16777215).toString(16);
    if (weight > 15) {
        return "orange";
    } else if (weight > 5 && weight <= 15) {
        return "gray";
    }
    return "blue";
}

// Temporary; for demonstration only
export function colorFromIdeology(ideology: number): string {
    if (ideology === 0) {
        return "blue";
    } else if (ideology === 1) {
        return "indigo";
    }
    return "purple";
}
