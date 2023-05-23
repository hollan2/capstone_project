import React from "react";
import * as RK from "react-konva";
import "../css/App.css";
import Konva from "konva";

const MAX_SIDEBAR_AGENT_WIDTH = 30;
const MAX_SIDEBAR_AGENT_HEIGHT = 60;

interface ResourceCounterProps {
    totalResources: number;
}

export class ResourceCounter extends React.Component<
    ResourceCounterProps,
    unknown
> {
    render() {
        return (
            <div className="resourceCounter">
                <ResourceCounterDisplay
                    totalResources={this.props.totalResources}
                />
            </div>
        );
    }
}

interface ResourceCounterDisplayProps {
    totalResources: number;
}

class ResourceCounterDisplay extends React.Component<ResourceCounterDisplayProps> {
    render() {
        return (
            <div className={"resourceCounterDisplay text-center"}>
                <h5 className="text-nowrap">Total Resources:</h5>
                <p className="resources mb-1">{this.props.totalResources}</p>
            </div>
        );
    }
}