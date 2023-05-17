import React from "react";
import * as RK from "react-konva";
import "../css/App.css";
import Konva from "konva";

interface YearCounterProps {
    round: () => void;
    turnCount: number;
}

export class YearCounter extends React.Component<
    YearCounterProps,
    unknown
> {
    render() {
        return (
            <div className="turnCounter">
                <YearCounter
                    round={this.props.round}
                    turnCount={this.props.turnCount}
                />
            </div>
        );
    }
}