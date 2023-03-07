//This is the https://isleoftrust.org/tutorial page.

//It currently renders the actual game located in App.tsx with a fixed hat, face,
//ideology, starting points, and map.

//TODO: In future sprints, the GameView component should be replaced with a tutorial
//version of the game instead of the actual game.

import React from "react";
import GameView from "../App";

export default function Tutorial() {
    return (
        <GameView
            hat={"Propeller"}
            face={"Smiley"}
            ideologyColor={"9ec4ea"}
            startingPoints={"easy"}
            // TODO: Change the mapImage from Choke to the small island, once that branch is merged into main.
            mapImage={"Choke"}
        />
    );
}
