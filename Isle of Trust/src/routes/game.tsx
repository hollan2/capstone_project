import React from "react";
import GameView from "../App";
import { useLocation } from "react-router-dom";
export interface StartInfo {
    hat: string;
    face: string;
    ideologyColor: string;
    startingPoints: string;
    mapImage: string;
}

export default function Game() {
    const location = useLocation();
    const state = location.state as StartInfo;
    console.log("Game function for routing");
    console.log(state);
    return (
        <GameView
            hat={state.hat}
            face={state.face}
            ideologyColor={state.ideologyColor}
            startingPoints={state.startingPoints}
            mapImage={state.mapImage}
        />
    );
}
