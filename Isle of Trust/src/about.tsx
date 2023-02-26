import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import Modal from "react-bootstrap/Modal";
import { ModalHeader } from "react-bootstrap";

export default function About() {
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <>
            <div onClick={handleShow}>Credits</div>
            <Modal show={show} onHide={handleClose}>
                <ModalHeader closeButton>
                    <Modal.Title>About Isle of Trust</Modal.Title>
                </ModalHeader>
                <Modal.Body>
                    <AboutComponent />
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

const AboutComponent = () => {
    const [content, setContent] = useState("");

    useEffect(() => {
        fetch("./markdown/about.md")
            .then((res) => res.text())
            .then((text) => setContent(text));
    }, []);

    return (
        <div className="post">
            <ReactMarkdown children={content} />
        </div>
    );
};
