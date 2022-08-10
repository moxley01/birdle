import React, { useEffect } from "react";

import cn from "classnames";
import { CharCompletion, IGameState, maxAttempts } from "./Game";

import styles from "./Game.module.css";

interface IProps {
    setSolutionFits: (fits: boolean) => void;
    setInteractive: (interactive: boolean) => void;
    solutionFits: boolean;
    blocksLength: number;
    state: IGameState;
    scrollIndex: number;
    easyMode: boolean;
}

const flipOutAnimationTime = 100;

function mapToCompletionBlocks(state: IGameState, scrollIndex: 0 | 1 | 2 | 3) {
    if (!state.submissions.length) {
        return [];
    }
    return [0, 1, 2, 3].reduce((acc: (React.ReactElement | null)[], curr) => {
        const _word = state[curr as 0 | 1 | 2 | 3];
        const isComplete = _word.isComplete;
        if (isComplete) {
            return acc
                .concat(
                    Array(_word.text.length)
                        .fill(true)
                        .map((_, index) => {
                            return (
                                <span
                                    key={`completion-${curr}-${index}`}
                                    data-hint={true}
                                    data-complete={true}
                                    className={cn(
                                        styles[CharCompletion.Correct],
                                        curr === scrollIndex &&
                                            styles.highlighted
                                    )}
                                >
                                    ✔
                                </span>
                            );
                        })
                )
                .concat(
                    curr === 3 ? null : (
                        <span key={`space-${curr}`} className={styles.space}>
                            {" "}
                        </span>
                    )
                );
        }
        const attempt = state.submissions[state.submissions.length - 1][curr];
        const solution = _word.text;
        const attemptChars = attempt.split("");
        const solutionChars = solution.split("");
        return acc
            .concat(
                new Array(_word.text.length).fill(true).map((_, index) => {
                    if (
                        attemptChars[index].toUpperCase() ===
                        solutionChars[index].toUpperCase()
                    ) {
                        return (
                            <span
                                key={`completion-${curr}-${index}`}
                                data-hint={true}
                                className={cn(
                                    styles[CharCompletion.Correct],
                                    curr === scrollIndex && styles.highlighted
                                )}
                            >
                                {attemptChars[index].toUpperCase()}
                            </span>
                        );
                    }
                    if (
                        _word.text
                            .toUpperCase()
                            .includes(attemptChars[index].toUpperCase())
                    ) {
                        return (
                            <span
                                key={`completion-${curr}-${index}`}
                                data-hint={true}
                                className={cn(
                                    styles[CharCompletion.Present],
                                    curr === scrollIndex && styles.highlighted
                                )}
                            >
                                {attemptChars[index].toUpperCase()}
                            </span>
                        );
                    }
                    return (
                        <span
                            key={`completion-${curr}-${index}`}
                            data-hint={true}
                            className={cn(
                                styles[CharCompletion.Incorrect],
                                curr === scrollIndex && styles.highlighted
                            )}
                        >
                            {attemptChars[index].toUpperCase()}
                        </span>
                    );
                })
            )
            .concat(
                curr === 3 ? null : (
                    <span key={`space-${curr}`} className={styles.space}>
                        {" "}
                    </span>
                )
            );
    }, []);
}

const Solution = React.forwardRef(
    (props: IProps, ref: React.ForwardedRef<HTMLDivElement>) => {
        const solutionRef = React.useRef<HTMLDivElement>(null);
        const {
            setSolutionFits,
            solutionFits,
            blocksLength,
            scrollIndex,
            state,
            easyMode,
            setInteractive,
        } = props;

        useEffect(() => {
            // I did this because I wanted two references to the same element and I didn't want to use mergeRefs
            const myRef = solutionRef.current?.childNodes[0];

            const gridHasTwoRows =
                easyMode && Boolean(state.submissions.length);

            const solutionWidth =
                Number(myRef?.childNodes.length) *
                    (gridHasTwoRows ? 0.5 : 1) *
                    (myRef?.firstChild as HTMLElement)?.getBoundingClientRect()
                        .width +
                20;

            if (solutionWidth > window.innerWidth) {
                setSolutionFits(false);
            }
        }, [setSolutionFits, easyMode, state.submissions]);

        // transition animations
        useEffect(() => {
            const hints = document.querySelectorAll("[data-hint=true]");
            if (
                easyMode &&
                hints.length &&
                state.submissions.length > 0 &&
                state.submissions.length !== maxAttempts
            ) {
                // after each submission, disable interactivity whilst the completion blocks animate in
                hints.forEach((hint, index) => {
                    hint.setAttribute(
                        "style",
                        `animation-delay: ${index * flipOutAnimationTime}ms`
                    );
                    hint.setAttribute("data-animation", "flip-out");
                    hint.addEventListener("animationend", () => {
                        hint.removeAttribute("data-animation");
                        if (hint.hasAttribute("data-complete")) {
                            hint.removeAttribute("data-hint");
                        }
                        if (index === hints.length - 1) {
                            setInteractive(true);
                        }
                    });
                });
            } else {
                setInteractive(true);
            }
        }, [state.submissions, easyMode, setInteractive]);

        return (
            <>
                <div className={styles.solutionWrapper} ref={solutionRef}>
                    <div
                        ref={ref}
                        className={styles.solution}
                        style={{
                            gridTemplateColumns: `repeat(${blocksLength}, auto)`,
                            justifyContent: solutionFits
                                ? "center"
                                : "flex-start",
                        }}
                    >
                        {state[0].state.split("").map((letter, index) => (
                            <span
                                key={index}
                                data-index={0}
                                className={cn(
                                    scrollIndex === 0 && styles.highlighted,
                                    state[0].isComplete && styles.complete,
                                    letter === "_" && styles.unfilled
                                )}
                                role="cell"
                            >
                                {letter}
                            </span>
                        ))}
                        <span className={styles.space}></span>
                        {state[1].state.split("").map((letter, index) => (
                            <span
                                key={index}
                                data-index={1}
                                className={cn(
                                    scrollIndex === 1 && styles.highlighted,
                                    state[1].isComplete && styles.complete,
                                    letter === "_" && styles.unfilled
                                )}
                                role="cell"
                            >
                                {letter}
                            </span>
                        ))}
                        <span className={styles.space}></span>
                        {state[2].state.split("").map((letter, index) => (
                            <span
                                key={index}
                                data-index={2}
                                className={cn(
                                    scrollIndex === 2 && styles.highlighted,
                                    state[2].isComplete && styles.complete,
                                    letter === "_" && styles.unfilled
                                )}
                                role="cell"
                            >
                                {letter}
                            </span>
                        ))}
                        <span className={styles.space}></span>
                        {state[3].state.split("").map((letter, index) => (
                            <span
                                key={index}
                                data-index={3}
                                className={cn(
                                    scrollIndex === 3 && styles.highlighted,
                                    state[3].isComplete && styles.complete,
                                    letter === "_" && styles.unfilled
                                )}
                                role="cell"
                            >
                                {letter}
                            </span>
                        ))}
                        {easyMode
                            ? mapToCompletionBlocks(
                                  state,
                                  scrollIndex as 0 | 1 | 2 | 3
                              )
                            : null}
                    </div>
                </div>
            </>
        );
    }
);

export default Solution;
