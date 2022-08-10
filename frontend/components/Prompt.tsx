import React, { useEffect } from "react";
import { IGameState } from "./Game";
import styles from "./Game.module.css";

interface IProps {
    state: IGameState;
    scrollIndex: number;
    setPromptLoaded: (loaded: boolean) => void;
}

export default function Prompt(props: IProps) {
    const { state, scrollIndex, setPromptLoaded } = props;
    useEffect(() => {
        setPromptLoaded(true);
    }, [setPromptLoaded]);
    return (
        <div className={styles.prompt}>
            {state[scrollIndex as 0 | 1 | 2 | 3].state}
        </div>
    );
}
