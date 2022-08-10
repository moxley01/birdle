import React from "react";
import { TwitterTweetEmbed } from "react-twitter-embed";
import ClientOnly from "./ClientOnly";
import Verified from "../public/verified.svg";

import styles from "./TweetBox.module.css";

interface IProps {
    id: string;
    matching_word: string;
    text: string;
    author_full: string;
    author_profile_url: string;
    author: string;
    is_game_complete: boolean;
    is_complete: boolean;
}

export default function TweetBox(props: IProps) {
    return (
        <ClientOnly>
            {props.is_game_complete ? (
                <div className={styles.tweetWrapper}>
                    <TwitterTweetEmbed tweetId={props.id} />
                </div>
            ) : (
                <article
                    className={
                        "twitter-tweet " +
                        styles.revealed
                    }
                >
                    <div className={styles.header}>
                        {props.author_profile_url ? (
                            <img
                                className={styles.logo}
                                src={props.author_profile_url}
                                alt="logo"
                            ></img>
                        ) : (
                            <div className={styles.logo}>?</div>
                        )}
                        <div className={styles.handles}>
                            <div className={styles.fullName}>
                                {props.author_full}{" "}
                                <div className={styles.verified}>
                                    <Verified />
                                </div>
                            </div>
                            <div className={styles.handle}>
                                {"@" + props.author}
                            </div>
                        </div>
                    </div>
                    <p
                        lang="en"
                        dir="ltr"
                        dangerouslySetInnerHTML={{
                            __html: props.text
                                .split("\n")
                                .map(
                                    (text) =>
                                        `<div>${text.replace(
                                            new RegExp(
                                                "( " +
                                                    props.matching_word +
                                                    " )",
                                                "gi"
                                            ),
                                            (match) =>
                                                `<span class="red ${
                                                    props.is_complete
                                                        ? "bold"
                                                        : null
                                                }"> ${
                                                    props.is_complete
                                                        ? match
                                                        : Array(match.length)
                                                              .fill(true)
                                                              .map(() => "_")
                                                              .join("")
                                                } </span>`
                                        )}</div>`
                                )
                                .join(""),
                        }}
                    ></p>
                </article>
            )}
        </ClientOnly>
    );
}
