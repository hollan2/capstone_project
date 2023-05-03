import React from "react";
import "normalize.css";
import "./css/main.css";
import Game from "./routes/game";
import Test from "./routes/test";
import About from "./about";

import TutorialOLD from "./tutorialOLD";
import Tutorial from "./routes/tutorial";

import { Nav, Navbar } from "react-bootstrap";
import { Link, useNavigate, NavigateFunction } from "react-router-dom";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import * as RK from "react-konva";
import { Face, Hat, GeneratePawn } from "./generators/pawn";
import Konva from "konva";
import { RESIZE_TIMEOUT } from "./App";
import { TutorialDisplay } from "./routes/TutorialGameView";

const PAWN_SCALE = 0.8;
const PAWN_WIDTH = 400 * PAWN_SCALE;
const PAWN_HEIGHT = 594 * PAWN_SCALE;

export const Maps = [
    {
        name: "Choke",
        value: "Choke",
        location: "../Maps/mapChoke.png",
    },
    {
        name: "Crescent",
        value: "Crescent",
        location: "../Maps/mapCrescent.png",
    },
    {
        name: "Pronged",
        value: "Pronged",
        location: "../Maps/mapPronged.png",
    },
    {
        name: "Ring",
        value: "Ring",
        location: "../Maps/mapRing.png",
    },
    {
        name: "Spokes",
        value: "Spokes",
        location: "../Maps/mapSpokes.png",
    },
    {
        name: "Small",
        value: "Small",
        location: "../Maps/mapSmall.png",
    },
];

export const Hats = [
    {
        name: "Select a Hat",
        value: "",
    },
    {
        name: "None",
        value: "None",
        typeName: Hat.Bow,
        location: "pawns/pawn-hat-none.png",
    },
    {
        name: "Bow",
        value: "Bow",
        typeName: Hat.Bow,
        location: "pawns/pawn-hat-bow.png",
    },
    {
        name: "Cap",
        value: "Cap",
        typeName: Hat.Cap,
        location: "pawns/pawn-hat-cap.png",
    },
    {
        name: "Party",
        value: "Party",
        typeName: Hat.Party,
        location: "pawns/pawn-hat-party.png",
    },
    {
        name: "Sun",
        value: "Sun",
        typeName: Hat.Sun,
        location: "pawns/pawn-hat-sun.png",
    },
    {
        name: "Winter",
        value: "Winter",
        typeName: Hat.Winter,
        location: "pawns/pawn-hat-winter.png",
    },
    {
        name: "Propeller",
        value: "Propeller",
        typeName: Hat.Propeller,
        location: "pawns/pawn-hat-propeller.png",
    },
];

export const Faces = [
    {
        name: "Select a face",
        value: "",
    },
    {
        name: "Chill",
        value: "Chill",
        typeName: Face.Chill,
        location: "pawns/pawn-face-chill.png",
    },
    {
        name: "Glasses",
        value: "Glasses",
        typeName: Face.Glasses,
        location: "pawns/pawn-face-classes.png",
    },
    {
        name: "Joy",
        value: "Joy",
        typeName: Face.Joy,
        location: "pawns/pawn-face-joy.png",
    },
    {
        name: "Shifty",
        value: "Shifty",
        typeName: Face.Shifty,
        location: "pawns/pawn-face-shifty.png",
    },
    {
        name: "Smiley",
        value: "Smiley",
        typeName: Face.Smiley,
        location: "pawns/pawn-face-smiley.png",
    },
    {
        name: "U_U",
        value: "U_U",
        typeName: Face.U_U,
        location: "pawns/pawn-face-u_u.png",
    },
    {
        name: "owo",
        value: "owo",
        typeName: Face.owo,
        location: "pawns/pawn-face-owo.png",
    },
];

class Main extends React.Component {
    render() {
        return (
            <main className="main">
                <BrowserRouter>
                    <Header />
                    <Routes>
                        <Route path="/" element={<Splash />} />
                        <Route path="start" element={<UseStart />} />
                        <Route path="game" element={<Game />} />
                        <Route path="test" element={<Test />} />
                        <Route path="tutorial" element={<Tutorial />} />
                        <Route path="level1" element={<TutorialDisplay/>}/>
                    </Routes>
                    <Footer />
                </BrowserRouter>
            </main>
        );
    }
}

class Header extends React.Component {
    render() {
        return (
            <header className="header fixed-top">
                <NavBar />
            </header>
        );
    }
}

function NavBar() {
    return (
        <Navbar collapseOnSelect expand="none" variant="dark" className="">
            <Navbar.Brand href="/">
                <Logo />
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="responsive-navbar-nav" />
            <Navbar.Collapse className="responsive-navbar-nav position-absolute px-3">
                <Nav className="">
                    <Nav.Link eventKey="1" href="/">
                        Home
                    </Nav.Link>
                    <Nav.Link eventKey="2" href="">
                        <TutorialOLD text="How To Play" />
                    </Nav.Link>
                    <Nav.Link eventKey="3" href="">
                        <About />
                    </Nav.Link>
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    );
}

class Footer extends React.Component {
    render() {
        return (
            <footer className="footer fixed-bottom">
                Copyright 2022 - PSU Capstone Team
            </footer>
        );
    }
}

class Logo extends React.Component {
    render() {
        return (
            <div className="logo">
                {/* place image here */}
                Isle of Trust
            </div>
        );
    }
}

function Splash() {
    return (
        <article id="splash">
            <h1>
                Isle of Trust
                <br />
                <span>how to spread an idea</span>
            </h1>
            <img src="images/splash_screen.png" alt="" />

            <Link className="link" to="/start">
                <button>Setup Your Game</button>
            </Link>

            <Link className="link" to="/tutorial">
                <button>Tutorial</button>
            </Link>

            <section></section>
        </article>
    );
}

function UseStart() {
    let navigate = useNavigate();
    return <Start navigate={navigate} />;
}

interface StartState {
    selectedName: string;
    selectedHat: string;
    selectedFace: string;
    selectedIdeology: string;
    selectedPoints: string;
    selectedMap: string;
}
interface StartProps {
    navigate: NavigateFunction;
}

class Start extends React.Component<StartProps, StartState> {
    constructor(props: StartProps) {
        super(props);
        //the starting values on the select menu
        this.state = {
            selectedName: "",
            selectedHat: "",
            selectedFace: "",
            selectedIdeology: "",
            selectedPoints: "Easy",
            selectedMap: "Choke",
        };
    }
    handleSelectedName = (selection: string) => {
        this.setState({ selectedName: selection });
    };

    handleSelectedHat = (selection: string) => {
        this.setState({ selectedHat: selection });
    };

    handleSelectedFace = (selection: string) => {
        this.setState({ selectedFace: selection });
    };

    handleSelectedIdeology = (selection: string) => {
        this.setState({ selectedIdeology: selection });
    };

    handleSelectedPoints = (selection: string) => {
        this.setState({ selectedPoints: selection });
    };

    handleSelectedMap = (selection: string) => {
        this.setState({ selectedMap: selection });
    };

    handleSubmit = (event: { preventDefault: () => void }) => {
        event.preventDefault();

        this.props.navigate("/game", {
            state: {
                name: this.state.selectedName,
                hat: this.state.selectedHat,
                face: this.state.selectedFace,
                ideologyColor: this.state.selectedIdeology,
                startingPoints: this.state.selectedPoints,
                mapImage: this.state.selectedMap,
            },
        });
    };
    render() {
        return (
            <form id="start" onSubmit={this.handleSubmit}>
                <h1>Game Setup</h1>
                <div className="selection-container">
                    <PlayerSelection
                        handleSelectedName={this.handleSelectedName}
                        selectedName={this.state.selectedName}
                        handleSelectedHat={this.handleSelectedHat}
                        selectedHat={this.state.selectedHat}
                        handleSelectedFace={this.handleSelectedFace}
                        selectedFace={this.state.selectedFace}
                        handleSelectedIdeology={this.handleSelectedIdeology}
                        selectedIdeology={this.state.selectedIdeology}
                        handleSelectedPoints={this.handleSelectedPoints}
                        selectedPoints={this.state.selectedPoints}
                    />

                    <MapSelection
                        handleSelectedMap={this.handleSelectedMap}
                        selectedMap={this.state.selectedMap}
                    />
                </div>
                <StartInformation />
            </form>
        );
    }
}

interface PlayerSelectionProps {
    selectedName: string;
    handleSelectedName: (value: string) => void;    
    selectedHat: string;
    handleSelectedHat: (value: string) => void;
    selectedFace: string;
    handleSelectedFace: (value: string) => void;
    selectedIdeology: string;
    handleSelectedIdeology: (value: string) => void;
    selectedPoints: string;
    handleSelectedPoints: (value: string) => void;
}

class PlayerSelection extends React.Component<PlayerSelectionProps, {}> {
    constructor(props: PlayerSelectionProps) {
        super(props);
        this.state = {
            startRdy: false,
        };
    }

    render() {
        return (
            <div className="player-selection">
                <h2>Player Selection:</h2>
                <div className="player-selection-section">
                    <PawnDisplay
                        selectedHat={this.props.selectedHat}
                        selectedFace={this.props.selectedFace}
                        selectedIdeology={this.props.selectedIdeology}
                    />
                    <div className="selector-stack">
                        <fieldset>
                            <legend>Appearance:</legend>
                            <NameSelector
                                handleSelectedName={this.props.handleSelectedName}
                                selectedName={this.props.selectedName}
                            />
                            <HatSelector
                                handleSelectedHat={this.props.handleSelectedHat}
                                selectedHat={this.props.selectedHat}
                            />
                            <FaceSelector
                                handleSelectedFace={
                                    this.props.handleSelectedFace
                                }
                                selectedFace={this.props.selectedFace}
                            />
                        </fieldset>

                        <fieldset>
                            <legend>Game Play:</legend>
                            <PointsSelector
                                handleSelectedPoints={
                                    this.props.handleSelectedPoints
                                }
                                selectedPoints={this.props.selectedPoints}
                            />
                        </fieldset>
                        <button className="start-btn" type="submit">
                            Start
                        </button>
                        <div className="tutorial-btn">
                            <TutorialOLD text="Tutorial (Recommended)" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

interface PawnDisplayProps {
    selectedHat: string;
    selectedFace: string;
    selectedIdeology: string;
}

class PawnDisplay extends React.Component<PawnDisplayProps, {}> {
    private containerRef = React.createRef<HTMLDivElement>();
    private stageRef = React.createRef<Konva.Stage>();

    private resizeTimeout?: NodeJS.Timeout;
    componentDidMount() {
        this.resizeEvent = this.resizeEvent.bind(this);
        this.resizeEvent();
        window.addEventListener("resize", this.resizeEvent);
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.resizeEvent);
    }

    resizeEvent() {
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);

        this.resizeTimeout = setTimeout(() => {
            if (
                this.containerRef === undefined ||
                this.containerRef.current == null ||
                this.stageRef.current == null
            )
                return;

            const container = this.containerRef.current;
            const stage = this.stageRef.current;

            let scale = container.offsetWidth / PAWN_WIDTH;

            stage.width(PAWN_WIDTH * scale);
            stage.height(PAWN_HEIGHT * scale);
            stage.scale({ x: scale, y: scale });
        }, RESIZE_TIMEOUT);
    }

    render() {
        const { selectedHat, selectedFace, selectedIdeology } = this.props;

        return (
            <div className="selector-pawn" ref={this.containerRef}>
                <RK.Stage ref={this.stageRef}>
                    <RK.Layer>
                        <PawnImageGroup
                            face={selectedFace}
                            hat={selectedHat}
                            ideologyColor={HexToRGBObject(selectedIdeology)}
                        />
                    </RK.Layer>
                </RK.Stage>
            </div>
        );
    }
}

export type RGB = { red: number; green: number; blue: number };

//converts Hex values to RGB
export function HexToRGBObject(hex: string): RGB {
    if (hex.length !== 6 || !hex) {
        hex = "ffffff";
    }
    const aRgb: RGB = {
        red: 255,
        green: 255,
        blue: 255,
    };
    const aRgbHex = hex.match(/.{1,2}/g);
    if (aRgbHex) {
        aRgb.red = parseInt(aRgbHex[0], 16);
        aRgb.green = parseInt(aRgbHex[1], 16);
        aRgb.blue = parseInt(aRgbHex[2], 16);
    }
    return aRgb;
}


const PawnImageGroup = ({
    face,
    hat,
    ideologyColor,
    scale,
}: {
    face: string;
    hat: string;
    ideologyColor: RGB;
    scale?: number;
}): JSX.Element => {
    const s = PAWN_SCALE;
    return (
        <RK.Group scaleX={s} scaleY={s}>
            {GeneratePawn(
                Hat[hat as keyof typeof Hat],
                Face[face as keyof typeof Face],
                ideologyColor
            )}
        </RK.Group>
    );
};

//the code to implement the name input field
interface NameSelectorProps {
    selectedName: string;
    handleSelectedName: (value: string) => void;
}

class NameSelector extends React.Component<NameSelectorProps, {}> {
    render() {
        return (
            <div className="name-selector selector">
                <label htmlFor="name-select">Your Name:</label>
                <input
                    required
                    name="names"
                    id="name-select"
                    type="text" 
                    placeholder="Enter name"
                    value={this.props.selectedName}
                    onChange={(e) => {this.props.handleSelectedName(e.target.value);
                    }}
                    />
            </div>
        );
    }
}

interface HatSelectorProps {
    selectedHat: string;
    handleSelectedHat: (value: string) => void;
}

class HatSelector extends React.Component<HatSelectorProps, {}> {
    render() {
        return (
            <div className="hat-selector selector">
                <label htmlFor="hat-select">Your Hat:</label>
                <select
                    required
                    name="hats"
                    id="hat-select"
                    value={this.props.selectedHat}
                    onChange={(e) => {
                        this.props.handleSelectedHat(e.target.value);
                    }}
                >
                    {Hats.map((hat, index) => {
                        return (
                            <option key={index} value={hat.value}>
                                {hat.name}
                            </option>
                        );
                    })}
                </select>
            </div>
        );
    }
}

interface FaceSelectorProps {
    selectedFace: string;
    handleSelectedFace: (value: string) => void;
}

class FaceSelector extends React.Component<FaceSelectorProps, {}> {
    render() {
        return (
            <div className="face-selector selector">
                <label htmlFor="face-select">Your Face:</label>
                <select
                    required
                    name="faces"
                    id="face-select"
                    value={this.props.selectedFace}
                    onChange={(e) => {
                        this.props.handleSelectedFace(e.target.value);
                    }}
                >
                    {Faces.map((face, index) => {
                        return (
                            <option key={index} value={face.value}>
                                {face.name}
                            </option>
                        );
                    })}
                </select>
            </div>
        );
    }
}

interface PointsSelectorProps {
    selectedPoints: string;
    handleSelectedPoints: (value: string) => void;
}

class PointsSelector extends React.Component<PointsSelectorProps, {}> {
    render() {
        return (
            <div className="start-points-entry selector">
                <label htmlFor="difficulty-select">Difficulty:</label>
                <select
                    name="difficulty"
                    id="difficulty-select"
                    value={this.props.selectedPoints}
                    onChange={(e) => {
                        this.props.handleSelectedPoints(e.target.value);
                    }}
                >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="extreme">Extreme</option>
                </select>
            </div>
        );
    }
}

interface MapSelectionProps {
    selectedMap: string;
    handleSelectedMap: (value: string) => void;
}

class MapSelection extends React.Component<MapSelectionProps, {}> {
    constructor(props: MapSelectionProps) {
        super(props);
        this.state = {
            startRdy: false,
        };
    }

    render() {
        return (
            <div className="map-selection">
                <div className="heading-area">
                    <h2>Map Selection:</h2>
                    <MapSelector
                        handleSelectedMap={this.props.handleSelectedMap}
                        selectedMap={this.props.selectedMap}
                    />
                </div>
                <MapDisplay selectedMap={this.props.selectedMap} />
            </div>
        );
    }
}

interface MapDisplayProps {
    selectedMap: string;
}

class MapDisplay extends React.Component<MapDisplayProps, {}> {
    render() {
        const { selectedMap } = this.props;
        const altText = selectedMap + " Map";
        let mapSource = "";
        for (let index in Maps) {
            if (Maps[index].name === selectedMap)
                mapSource = Maps[index].location;
        }
        return (
            <div className="">
                <img
                    className="d-block w-100"
                    src={require(mapSource)}
                    alt={altText}
                />
            </div>
        );
    }
}

interface MapSelectorProps {
    selectedMap: string;
    handleSelectedMap: (value: string) => void;
}

class MapSelector extends React.Component<MapSelectorProps, {}> {
    render() {
        return (
            <div className="map-selector selector">
                <label htmlFor="map-select">Your Map:</label>
                <select
                    required
                    name="maps"
                    id="map-select"
                    value={this.props.selectedMap}
                    onChange={(e) => {
                        this.props.handleSelectedMap(e.target.value);
                    }}
                >
                    {Maps.map((map, index) => {
                        return (
                            <option key={index} value={map.value}>
                                {map.name}
                            </option>
                        );
                    })}
                </select>
            </div>
        );
    }
}

function StartInformation() {
    return (
        <div className="start-information">
            <h2>Start Information:</h2>
            <div>
                How Ideology affects play:
                <ul>
                    <li>Hawk is selfish and always cheats.</li>
                    <li>Dove is altruistic and always gives.</li>
                    <li>
                        Grim is altruistic, but responds poorly to selfishness.
                    </li>
                    <li>
                        Anti-Grim is selfish, but responds well to altruism.
                    </li>
                    <li>Tit-for-Tat copies the behavior shown to them.</li>
                    <li>
                        Tweedle-Dum is selfish, but switches strategies every
                        three times it's been cheated.
                    </li>
                    <li>
                        Tweedle-Dee is altruistic, but switches strategies every
                        three times it's been cheated.
                    </li>
                </ul>
            </div>
        </div>
    );
}

/* 
// Old Carousel code. 
// Left this in case someone can make it work with the form later
function MapSelection() {
    return (
        <div className="map-selection">
            <h2>Map Selection:</h2>
            <MapCarousel />
        </div>
    );
}

function MapCarousel() {
    const [index, setIndex] = useState(0);
    const handleSelectedMap = (
        selectedMap: SetStateAction<number>,
        e: unknown
    ) => {
        setIndex(selectedMap);
    };

    return (
        <div className="map-selector">
            <Carousel
                interval={null}
                variant="dark"
                activeIndex={index}
                onSelect={handleSelectedMap}
            >
                {Maps.map((image, index) => {
                    const altText = image.name + " Map";
                    const mapSource = image.location;
                    return (
                        <CarouselItem key={index}>
                            <img
                                className="d-block w-100"
                                src={require(mapSource)}
                                alt={altText}
                            />
                        </CarouselItem>
                    );
                })}
            </Carousel>
        </div>
    );
}
*/

export default Main;
