import React, { Component } from "react";
import { useLocation } from "react-router-dom";
interface GameState {
    hat: string;
    face: string;
    ideology: string;
    map: string;
}
interface GameProps {
    hat: string;
    face: string;
    ideology: string;
    map: string;
}

function Test() {
    const location = useLocation();
    console.log(location);
    const state = location.state as GameState;
    console.log(state);
    return (
        <TestView
            hat={state.hat}
            face={state.face}
            ideology={state.ideology}
            map={state.map}
        />
    );
}

class TestView extends React.Component<GameProps, {}> {
    render() {
        return (
            <div className="game">
                <div>Start Data</div>
                <div>Player Hat: {this.props.hat}</div>
                <div>Player Face: {this.props.face}</div>
                <div>Player Ideology: {this.props.ideology}</div>
                <div>Map: {this.props.map}</div>
            </div>
        );
    }
}
export default Test;
