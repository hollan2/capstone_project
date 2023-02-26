import { it, expect } from "vitest";

import { Graph } from "./graph";

it("works", () => {
    const graph = new Graph<number, number>();

    // create a basic graph with two vertices and one directed edge
    graph.insertVertex(1);
    graph.insertVertex(2);
    graph.insertEdge(1, 2, 300);

    expect(graph.getSize()).toBe(2);
    expect(graph.getEdge(1, 2)).toBe(300);
    expect(graph.getEdge(2, 1)).toBeUndefined();

    // check various other non-existences
    expect(graph.getEdge(1, 3)).toBeUndefined();
    expect(graph.getEdge(0, 2)).toBeUndefined();
    expect(graph.getEdge(0, 0)).toBeUndefined();

    // insert an edge in the other direction with different data
    graph.insertEdge(2, 1, 500);
    expect(graph.getEdge(1, 2)).toBe(300);
    expect(graph.getEdge(2, 1)).toBe(500);

    // add another vertex and connect it
    graph.insertVertex(3);
    graph.insertEdge(1, 3, 700);
    expect(graph.getSize()).toBe(3);
    expect(graph.getEdge(1, 2)).toBe(300);
    expect(graph.getEdge(1, 3)).toBe(700);
    expect(graph.getEdges(1)?.size).toBe(2);

    // remove an edge
    expect(graph.removeEdge(1, 3)).toBe(true);
    expect(graph.getEdge(1, 3)).toBeUndefined();
    expect(graph.getEdge(1, 2)).toBe(300);

    // remove a vertex
    expect(graph.removeVertex(2)).toBe(true);
    expect(graph.hasVertex(2)).toBe(false);
    expect(graph.getSize()).toBe(2);
    expect(graph.getEdge(1, 2)).toBeUndefined();
    expect(graph.getEdge(2, 1)).toBeUndefined();
});

class FooBar {
    a: number;
    b: number;

    constructor(a: number, b: number) {
        this.a = a;
        this.b = b;
    }
}

it("works with classes", () => {
    const graph = new Graph<FooBar, FooBar>();

    const a = new FooBar(1, 2);
    const b = new FooBar(3, 4);
    const c = new FooBar(5, 6);

    graph.insertVertex(a);
    graph.insertVertex(b);

    graph.insertEdge(a, b, c);

    expect(graph.getEdge(a, b)).toBe(c);
    expect(graph.getEdge(b, a)).toBeUndefined();
});
