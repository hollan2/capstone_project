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
            <div className="sidebar yearCounter">
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
        return (
            <div className={"yearCounterDisplay"}>
                <span className="year">{this.props.turnCount}</span>
            </div>
        );
    }
}