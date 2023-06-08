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
    level: number;
}
export function TutorialGuide({
    turnCount,
    stageCount,
    onClick,
    level,
}: TutorialGuideProps) {
    function displayProfessor(): boolean {
        console.log("Tutorial Stage: " + stageCount);
        //Tutorial Level 1
        if (
            level === 1 &&
            stageCount !== 7 &&
            stageCount !== 11 &&
            stageCount !== 14 &&
            stageCount < 20
        ) {
            return true;
        }
        //Tutorial Level 2
        if (level === 2 && stageCount < 5) {
            return true;
        }
        //Tutorial Level 3
        if (level === 3 && stageCount < 5) {
            return true;
        }
        //Tutorial Level 4
        if (level === 4 && stageCount < 4) {
            return true;
        }
        //Tutorial Level 5
        if (
            (level === 5 && stageCount < 3) ||
            (level === 5 && stageCount >= 11 && stageCount <= 12)
        ) {
            return true;
        }
        //Tutorial Level 6
        if (
            (level === 6 && stageCount < 4) ||
            (level === 6 && stageCount === 16)
        ) {
            return true;
        }
        //Tutorial Level 7
        if (level === 7 && stageCount < 4) {
            return true;
        }

        return false;
    }
    if (displayProfessor()) {
        return (
            <Professor
                turnCount={turnCount}
                stageCount={stageCount}
                onClick={onClick}
                level={level}
            />
        );
    } else {
        return (
            <Hint turnCount={turnCount} stageCount={stageCount} level={level} />
        );
    }
}

//Renders the professor image, the "next" button, the text box, and the animated text.

//With each click of the "next" button the stageCount is incremented by 1. The onClick method
//for the "next" button is implemented in the GameView component in App.tsx.
interface ProfessorProps {
    turnCount: number;
    stageCount: number;
    onClick: () => void;
    level: number;
}

interface ProfessorState {
    text: string[];
}
class Professor extends React.Component<ProfessorProps, ProfessorState> {
    constructor(props: ProfessorProps) {
        super(props);
        this.state = {
            text: [],
        };
    }
    componentDidMount(): void {
        fetch(`../markdown/level${this.props.level}.md`)
            .then((res) => res.text())
            .then((res) => {
                const response = res.split("~");
                this.setState({
                    text: response,
                });
            });
    }

    render() {
        return (
            <div className="tutorialGuide">
                <div className="textbox" id="textbox">
                    <AnimatedText
                        type="chars" // animate words or chars
                        animation={{
                            x: "200px",
                            y: "-20px",
                            scale: 1.1,
                            ease: "ease-in-out",
                        }}
                        animationType="wave"
                        interval={0.04} //controls the text speed
                        duration={0.4} //controls the text speed
                        tag="p"
                        className="animated-paragraph"
                        includeWhiteSpaces
                        threshold={0.1}
                        rootMargin="20%"
                    >
                        {this.state.text[this.props.stageCount]}
                    </AnimatedText>
                    <button
                        className="btn arrowbtn"
                        onClick={this.props.onClick}
                    >
                        <ImArrowRight size={20} color={"green"} />
                    </button>
                </div>
                <img
                    src="/images/professor.png"
                    alt="professor pawn"
                    width="96"
                    height="184"
                />
            </div>
        );
    }
}

//Renders the hint button and popover window that appears once the button is clicked.
interface HintProps {
    turnCount: number;
    stageCount: number;
    level: number;
}

interface HintState {
    text: string[];
}
class Hint extends React.Component<HintProps, HintState> {
    constructor(props: HintProps) {
        super(props);
        this.state = {
            text: [],
        };
    }

    componentDidMount(): void {
        fetch(`../markdown/hintLevel${this.props.level}.md`)
            .then((res) => res.text())
            .then((res) => {
                const response = res.split("~");
                this.setState({
                    text: response,
                });
            });
    }
    render() {
        const popover = (
            <Popover id="popover-basic">
                <Popover.Header as="h3">Hint!</Popover.Header>
                <Popover.Body>
                    {this.state.text[this.props.stageCount]}
                </Popover.Body>
            </Popover>
        );

        return (
            <div className="hint-container">
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
