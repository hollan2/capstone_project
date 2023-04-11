//This is the https://isleoftrust.org/tutorial page.

//It currently renders a screen giving a user selection of six different levels.
//Note that these links currently lead to nowhere!

//TODO: In future sprints, the levels need to be linked up to the levels and the levels of course
//need to be created.

import React from "react";              // Just used as a baseline to have React running.
import { Link } from "react-router-dom" // Used to get the buttons active with actual links to each level.

// The intial point of where each button is located.
export default function Levels() {
    return (
        //Separate the title from the levels by making them parent + child.
        //Note that the div "divider" is purely just a way to create whitespace betewen buttons.
        //The adjustment to the size can be found in main.css! Same for the "levels" article.
        <article id="splash">
            <h2>
                Tutorial
                <br />
                <span>Get Introduced To The Game Mechanics!</span>
            </h2>

        <span>
            <article id="levels">
                <Link className="link" to="/level1">
                    <button> 1 </button>
                </Link>
                <div className="divider"/>
                <Link className="link" to="/level2">
                    <button> 2 </button>
                </Link>
                <div className="divider"/>
                <Link className="link" to="/level3">
                    <button> 3 </button>
                </Link>
            </article>
        </span>
        <span>
            <article id="levels">
                <Link className="link" to="/level4">
                    <button> 4 </button>
                </Link>
                <div className="divider"/>
                <Link className="link" to="/level5">
                    <button> 5 </button>
                </Link>
                <div className="divider"/>
                <Link className="link" to="/level6">
                    <button> 6 </button>
                </Link>
            </article>
        </span>

        </article>
    );
}