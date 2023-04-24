import "../css/App.css";
import {
    Agent,
    Relation,
    SpendingContainer,
} from "../models/agent";
import { Graph } from "../models/graph";

export class SidebarState {
    player: Agent;
    selected: Agent;
    playerToSelected: Relation | undefined;
    selectedToPlayer: Relation | undefined;
    influenceChoices: SpendingContainer;
    position: number;

    constructor(
        map: Graph<Agent, Relation>,
        player: Agent,
        selected: Agent,
        position: number
    ) {
        this.player = player;
        this.selected = selected;
        this.position = position;
        this.playerToSelected = map.getEdge(player, selected)!;
        this.selectedToPlayer = map.getEdge(selected, player)!;
        this.influenceChoices = new SpendingContainer();
    }
}