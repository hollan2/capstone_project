import React, { useEffect, useState } from "react";
import ReactDom from "react-dom";
import { Link } from "react-router-dom";
import "../css/EndOfLevel.css"
import Confetti from 'react-confetti'
import { Agent } from "../models/agent";

//Renders the pop up window that appears after the level has been completed
//TODO: This is a basic set up of the pop up using the logic from the "History" pop up, it still needs content
//TODO: Maybe add confetti in the background using https://www.npmjs.com/package/react-confetti
interface EndOfLevelProps {
    level: number;
    success: boolean;
    mapAgents: Agent[];
}
export function EndOfLevel({ level, success, mapAgents }: EndOfLevelProps) {
    const width = 500;
    const height = 600;
    
    const [mounted, setMounted] = useState(false);

    useEffect(()=> {
        setTimeout(()=> setMounted(true), 3000);
    })
    function updateLevel() {
        level++;
    }

    return ReactDom.createPortal(
        mounted && (
        <div className="popup-container">
            <div className="overlay"></div>
            <div className="popup">
                {success ? (
                    <div className="popup-content">
                        <h1 className="text-center">Congratulations!</h1>
                        <h2 className="success">You finished Level {level}</h2>
                        {level == 0 &&
                            <h2></h2>
                        }
                        {level > 0 &&
                            <h2> Each player was able to make their mortgage payment!</h2>
                        }
                        {mapAgents.map((user) => (
                            <div className="user">{user.name} finished with {user.resources} tons of cherries</div>
                        ))}
                        <Link
                            reloadDocument
                            className="link"
                            to={"/level" + (level + 1)}
                        >
                            <button onClick={updateLevel}> Next Level</button>
                        </Link>
                        <Confetti width={width} height={height} />
                    </div>

                ) : (
                    <div className="popup-content">
                        <h1 className="text-center">Oh No!</h1>
                        <h2 className="fail">Level {level} Failed</h2>
                        <h2 className="text-center"> Some players were unable to pay their mortgage!</h2>
                        {mapAgents.map((user) => (
                            <div className="user">{user.name} finished with {user.resources} tons of cherries</div>
                        ))}
                        <Link
                            reloadDocument
                            className="link"
                            to={"/level" + (level)}
                        >
                            <button> Replay Level</button>
                        </Link>
                    </div>

                )}

            </div>
        </div>
        ),
        //Used for React Portal Popup Modal
        document.getElementById("portal")!
    );
}



