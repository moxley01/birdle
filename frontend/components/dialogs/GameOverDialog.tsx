import React from "react";
import { IGameState } from "../Game";

import styles from "./styles.module.css";

interface IProps {
    state: IGameState;
}

export default function GameOverDialog(props: IProps) {
    return (
        <div aria-modal={true}>
            <h3>Bad luck!</h3>
            <p>The answer was:</p>
            <article className={styles.solution}>
                <p>{props.state[0].text}</p>
                <p>{props.state[1].text}</p>
                <p>{props.state[2].text}</p>
                <p>{props.state[3].text}</p>
            </article>
            <p>
                <b>Try again tomorrow!</b>
            </p>
        </div>
    );
}
