import React from "react";

import Close from "../public/close.svg";

import styles from "./Modal.module.css";

interface IProps {
    children?: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
}

export default function Modal(props: IProps) {
    return props.isOpen ? (
        <div className={styles.wrap} onClick={props.onClose}>
            <div
                className={styles.content}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className={styles.closeIcon}
                    title="close dialog"
                    onClick={props.onClose}
                >
                    <Close />
                </button>
                {props.children}
            </div>
        </div>
    ) : null;
}
