import React from "react";

import { maxAttempts } from "./Game";
import styles from "./ProgressBar.module.css";

interface IProps {
    progress: number;
}

const colors = ["#fff", "#64bc61", "#d7ee8e", "#fedd8d", "#f16e43", "#a50026"];

function mapToColor(progress: number): string {
    return colors[progress];
}

export default function ProgressBar(props: IProps) {
    const progressRatio = props.progress / maxAttempts;
    return (
        <div
            className={styles.progress}
            style={{
                width: `${Math.min(progressRatio * 100, 100)}%`,
                backgroundColor: mapToColor(props.progress),
            }}
        ></div>
    );
}
