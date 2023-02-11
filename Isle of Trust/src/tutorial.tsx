import React from "react";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import Modal from "react-bootstrap/Modal";

export default function About(props: { text: string }) {
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <>
            <div className="tutorial" onClick={handleShow}>
                {props.text}
            </div>
            <Modal fullscreen show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>How to Play Isle of Trust</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <TutorialComponent />
                </Modal.Body>
                <Modal.Footer>
                    <button className="modal-btn" onClick={handleClose}>
                        Close
                    </button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

const TutorialComponent = () => {
    const [content, setContent] = useState("");

    useEffect(() => {
        fetch("./markdown/tutorial.md")
            .then((res) => res.text())
            .then((text) => setContent(text));
    }, []);

    return (
        <div className="post tutorial">
            <ReactMarkdown children={content} />
        </div>
    );
};
