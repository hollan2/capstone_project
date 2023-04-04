import "./css/App.css";
import {
    MetaAgent,
    Relation,
    SpendingContainer,
} from "../models/agent";
import { Graph } from "../models/graph";

export class SidebarState {
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