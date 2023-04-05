import { Graph } from "../models/graph";
import * as util from "../utilities";
import {
    Agent,
    Ideology,
    Personality,
    Relation,
} from "../models/agent";
import ProngedJson from "../data/mapPronged.json";
import ChokeJson from "../data/mapChoke.json";
import CrescentJson from "../data/mapCrescent.json";
import RingJson from "../data/mapRing.json";
import SpokesJson from "../data/mapSpokes.json";
import SmallJson from "../data/mapSmall.json";
import * as genA from "./agent";

//import { MAP_INDEX } from "../App";

// The maximum distance that players can be from one another to connect.
export const CONNECTION_RADIUS: number = 210;

interface mapJson {
    points: [
        {
            x: number;
            y: number;
        }
    ];
    edges: [
        {
            v1: number;
            v2: number;
        }
    ];
}

export class Map {
    protected graph: Graph<Agent, Relation>;
    protected vRadius: number;
    protected jsonData: mapJson | undefined;

    constructor(select: string, scalar: number = 5) {
        this.graph = new Graph();
        this.vRadius = scalar ** 1.6;
        var json;
        switch (select) {
            case "Pronged":
                json = ProngedJson;
                break;
            case "Choke":
                json = ChokeJson;
                break;
            case "Ring":
                json = RingJson;
                break;
            case "Spokes":
                json = SpokesJson;
                break;
            case "Crescent":
                json = CrescentJson;
                break;
            case "Small":
                json = SmallJson;
                break;
        }
        this.jsonData = JSON.parse(JSON.stringify(json));
    }

    getGraph(): Graph<Agent, Relation> {
        return this.graph;
    }
}

export class Grid extends Map {
    startingResources: number;
    constructor(select: string, resource: number = 10) {
        super(select);

        this.startingResources = resource;
        this.generateVertices();
        this.generateEdges();
    }

    generateVertices() {
        let vID = 1;

        // Generates agent vertices and inserts them to graph
        if (this.jsonData) {
            this.jsonData.points.forEach((point) => {
                const v = genA.genRandomAgent(
                    vID,
                    [point.x, point.y],
                    this.startingResources
                );
                ++vID;
                this.graph.insertVertex(v);
            });
        }
    }

    generateEdges() {
        const all = this.graph.getVertices();
        if (this.jsonData) {
            this.jsonData.edges.forEach((edge) => {
                this.graph.insertEdge(
                    all[edge.v1],
                    all[edge.v2],
                    new Relation(10, 10)
                );
                this.graph.insertEdge(
                    all[edge.v2],
                    all[edge.v1],
                    new Relation(10, 10)
                );
            });
        }
    }
}
