//This file contains components that render the textbox, professor pawn, and hint button for the tutorial.

//The TutorialGuide component is rendered from the GameView component in App.tsx.

//The two libraries used for the text animation and icons are:
//  yarn add react-icons
//  yarn add react-animated-text-content

import React from "react";
import { ImArrowRight } from "react-icons/im";
import AnimatedText from "react-animated-text-content";
import { BsExclamationCircleFill } from "react-icons/bs";
import Popover from "react-bootstrap/Popover";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";

//Decides which component to render: the Hint or the Professor/text box.
//The decision is made based on which stage of the tutorial the user is on.
interface TutorialGuideProps {
    turnCount: number;
    stageCount: number;
    onClick: () => void;
}
export function TutorialGuide({
    turnCount,
    stageCount,
    onClick,
}: TutorialGuideProps) {
    if (stageCount !== 3) {
        return (
            <Professor
                turnCount={turnCount}
                stageCount={stageCount}
                onClick={onClick}
            />
        );
    } else {
        return <Hint turnCount={turnCount} stageCount={stageCount} />;
    }
}

//Renders the professor image, the "next" button, the text box, and the animated text.

//With each click of the "next" button the stageCount is incremented by 1. The onClick method
//for the "next" button is implemented in the GameView component in App.tsx.
interface ProfessorProps {
    turnCount: number;
    stageCount: number;
    onClick: () => void;
}
class Professor extends React.Component<ProfessorProps> {
    getText(stage: number): string {
        let text = "";

        //TODO: This should be read from a .txt file, it's polluting the code.
        if (stage === 0) {
            text =
                "Welcome to Isle of Trust! Lorem ipsum dolor sit amet, consectetur adipisicing elit.";
        } else if (stage === 1) {
            text =
                "This is the player panel. Lorem ipsum dolor sit amet, consectetur adipisicing elit.";
        } else if (stage === 2) {
            text =
                "This is the spend resources panel. Blah Blah Blah. Now it's your turn, try to spend some resources.";
        }
        return text;
    }
    render() {
        return (
            <div className="tutorialGuide">
                <div className="textBox">
                    <AnimatedText
                        type="chars" // animate words or chars
                        animation={{
                            x: "200px",
                            y: "-20px",
                            scale: 1.1,
                            ease: "ease-in-out",
                        }}
                        animationType="wave"
                        interval={0.06} //controls the text speed
                        duration={0.5} //controls the text speed
                        tag="p"
                        className="animated-paragraph"
                        includeWhiteSpaces
                        threshold={0.1}
                        rootMargin="20%"
                    >
                        {this.getText(this.props.stageCount)}
                    </AnimatedText>
                    <button
                        className="btn arrowbtn"
                        onClick={this.props.onClick}
                    >
                        <ImArrowRight size={20} color={"green"} />
                    </button>
                </div>
                <img
                    src="public/images/professor.png"
                    alt="professor pawn"
                    width="96"
                    height="184"
                />
            </div>
        );
    }
}

//Renders the hint button and popover window that appears once the button is clicked.
//TODO: Add a method that will decide what the popover text will say based on the stageCount.
interface HintProps {
    turnCount: number;
    stageCount: number;
}
class Hint extends React.Component<HintProps> {
    render() {
        const popover = (
            <Popover id="popover-basic">
                <Popover.Header as="h3">Hint!</Popover.Header>
                <Popover.Body>
                    Something <strong>really</strong> helpful.
                </Popover.Body>
            </Popover>
        );

        return (
            <div>
                <OverlayTrigger
                    trigger="click"
                    placement="left"
                    overlay={popover}
                >
                    <button
                        type="button"
                        className="hintbtn btn btn-lg btn-light"
                        data-bs-toggle="modal"
                        data-bs-target="#exampleModal"
                    >
                        <BsExclamationCircleFill
                            size={25}
                            color="MidnightBlue"
                        />{" "}
                        Hint
                    </button>
                </OverlayTrigger>
            </div>
        );
    }
}
