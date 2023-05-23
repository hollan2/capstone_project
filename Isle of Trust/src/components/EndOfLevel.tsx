import React from "react";
import ReactDom from "react-dom";
import { Link } from "react-router-dom";

//Renders the pop up window that appears after the level has been completed
//TODO: This is a basic set up of the pop up using the logic from the "History" pop up, it still needs content
//TODO: Maybe add confetti in the background using https://www.npmjs.com/package/react-confetti
interface EndOfLevelProps {
    level: number;
}
export function EndOfLevel({ level }: EndOfLevelProps) {
    function updateLevel() {
        level++;
    }
    return ReactDom.createPortal(
        <div className="popup-container">
            <div className="overlay"></div>
            <div className="popup">
                <div className="popup-content">
                    <h1 className="text-center">Congratulations!</h1>
                    <h2 className="text-center">You finished Level {level}</h2>
                    <Link
                        reloadDocument
                        className="link"
                        to={"/level" + (level + 1)}
                    >
                        <button onClick={updateLevel}> Next Level</button>
                    </Link>
                </div>
            </div>
        </div>,
        //Used for React Portal Popup Modal
        document.getElementById("portal")!
    );
}
