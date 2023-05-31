import React from "react";
import { Agent } from "../models/agent";
import { TurnLog, Strategy } from "../models/strategy";
import { Graph } from "../models/graph";
import { Relation } from "../models/agent";
import { PlayerSidebar } from "./playerSideBar";

interface ResetGameProps{
    map: Graph<Agent,Relation>;
    resetState:  () => void;
    intialResources: number;
}
//Resets the game to intial values, resetting the investments will not be done here
export class ResetGame extends React.Component<ResetGameProps>
{
    resetAll = () => 
    {
        let agents = this.props.map.getVertices();
        agents.forEach((agent) => {
            agent.resetResources(this.props.intialResources);
            //reset the ideologies of all agents to their initial ones
            agent.ideology.setStrategy(agent.initialStrategy);
        });
        let relations = this.props.map.getAllEdges();
        relations.forEach(([v1, v2, e1]) => {
           e1.history.resetTurns();
        });
        this.props.resetState();
    }
    render() {
        return (
            <div className="reset">
                <button onClick={this.resetAll}>Reset Game</button>
            </div>
        );
    }


}