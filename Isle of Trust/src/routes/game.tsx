import React from "react";
import GameView from "../App";
import { useLocation } from "react-router-dom";
//information selected at the start of the game
export interface StartInfo {
    name: string;
    hat: string;
    face: string;
    startingPoints: string;
    mapImage: string;
}

export default function Game() {
    const location = useLocation();
    const state = location.state as StartInfo;

    //logs the values chosen for the player character 
    console.log("Game function for routing");
    console.log(state);
    return (
        <GameView
            name={state.name}
            hat={state.hat}
            face={state.face}
            startingPoints={state.startingPoints}
            mapImage={state.mapImage}
        />
    );
}
