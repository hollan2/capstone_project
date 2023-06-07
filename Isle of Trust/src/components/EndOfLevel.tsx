import React, { useEffect, useState } from "react";
import ReactDom from "react-dom";
import { Link } from "react-router-dom";
import "../css/EndOfLevel.css";
import Confetti from "react-confetti";
import { Agent } from "../models/agent";

interface EndOfLevelProps {
    level: number;
    success: boolean;
    mapAgents: Agent[];
}
export function EndOfLevel({ level, success, mapAgents }: EndOfLevelProps) {
    const width = 500;
    const height = 700;

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setTimeout(() => setMounted(true), 5000);
    });
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
                            <h2 className="success">
                                You finished Level {level}
                            </h2>
                            {level == 1 && <h2></h2>}
                            {level > 1 && (
                                <h2>
                                    {" "}
                                    Each player was able to make their mortgage
                                    payment!
                                </h2>
                            )}
                            {mapAgents.map((user) => (
                                <div className="user">
                                    {user.name} finished with {user.resources}{" "}
                                    tons of cherries
                                </div>
                            ))}
                            {level !== 7 ? (
                                <Link
                                    reloadDocument
                                    className="link"
                                    to={"/level" + (level + 1)}
                                >
                                    <button onClick={updateLevel}>
                                        {" "}
                                        Next Level
                                    </button>
                                </Link>
                            ) : (
                                <>
                                    <p>
                                        That was fun! In the standard game,
                                        everyone is grey to start out with so
                                        you'll have to learn your neighbors
                                        through their actions. Are you up for
                                        the challenge?
                                    </p>
                                    <Link
                                        reloadDocument
                                        className="link"
                                        to={"/start"}
                                    >
                                        <button className="m-2"> Yes</button>
                                    </Link>
                                    <Link
                                        reloadDocument
                                        className="link"
                                        to={"/"}
                                    >
                                        <button> No</button>
                                    </Link>
                                </>
                            )}
                            <Confetti width={width} height={height} />
                        </div>
                    ) : (
                        <div className="popup-content">
                            <h1 className="text-center">Oh No!</h1>
                            <h2 className="fail">Level {level} Failed</h2>
                            <h2 className="text-center">
                                {" "}
                                Some players were unable to pay their mortgage!
                            </h2>
                            {mapAgents.map((user) => (
                                <div className="user">
                                    {user.name} finished with {user.resources}{" "}
                                    tons of cherries
                                </div>
                            ))}
                            <Link
                                reloadDocument
                                className="link"
                                to={"/level" + level}
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

interface OutOfResourcesProps {
    level: number;
}
export function OutOfResources({ level }: OutOfResourcesProps) {
    return ReactDom.createPortal(
        <div className="popup-container">
            <div className="overlay"></div>
            <div className="popup">
                <div className="popup-content">
                    <h1 className="text-center">Oh No!</h1>
                    <h2 className="fail">Level {level} Failed</h2>
                    <h2 className="text-center"> You ran out of resources!</h2>
                    <Link reloadDocument className="link" to={"/level" + level}>
                        <button> Replay Level</button>
                    </Link>
                </div>
            </div>
        </div>,
        document.getElementById("portal")!
    );
}
