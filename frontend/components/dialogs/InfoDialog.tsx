import React from "react";

import styles from "./styles.module.css";

export default function InfoDialog() {
    return (
        <div className={styles.info}>
            <h4>About Birdle</h4>
            <p>Birdle is a simple and fun text-based game.</p>
            <p>
                You will be shown four viral tweets from the last 24 hours. The
                challenge is to identify the missing word from each of them,
                such that they spell out a wholesome message.
            </p>
            <p>
                With "easy mode" switched on (default), you will be given a hint
                for each failed guess:
            </p>
            <ul className={styles.list}>
                <li>
                    a green letter means that it was the right letter in the
                    right place
                </li>
                <li>
                    a brown letter means that whilst it can be found somewhere
                    in the missing word, it is not in the right place
                </li>
                <li>
                    a gray letter cannot be found anywhere in the missing word
                </li>
            </ul>
            <p>
                <b>
                    A new BIRDLE is generated daily, based on the day's top
                    tweets!
                </b>
            </p>
        </div>
    );
}
