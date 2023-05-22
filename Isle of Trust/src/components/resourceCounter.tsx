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
            <div className="sidebar resourceCounter">
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
            <div className={"resourceCounterDisplay"}>
                Total Resources: <span className="resources">{this.props.totalResources}</span>
            </div>
        );
    }
}