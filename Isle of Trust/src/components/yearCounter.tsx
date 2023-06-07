import React from "react";
import * as RK from "react-konva";
import "../css/App.css";
import Konva from "konva";

const MAX_SIDEBAR_AGENT_WIDTH = 30;
const MAX_SIDEBAR_AGENT_HEIGHT = 60;

interface YearCounterProps {
    turnCount: number;
}

export class YearCounter extends React.Component<
    YearCounterProps,
    unknown
> {
    render() {
        return (
            <div className="yearCounter">
                <YearCounterDisplay
                    turnCount={this.props.turnCount}
                />
            </div>
        );
    }
}

interface YearCounterDisplayProps {
    turnCount: number;
}

class YearCounterDisplay extends React.Component<YearCounterDisplayProps> {
    render() {
        let year = this.props.turnCount
        year = Math.trunc(year)

        return (
            <div className={"yearCounterDisplay text-center"} >
                <h5>Year:</h5>
                <p className="year mb-1">{year}</p>
            </div>
        );
    }
}