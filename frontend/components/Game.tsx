import React, { useCallback, useEffect, useRef, useState } from "react";
import { createAction, getType, ActionType } from "typesafe-actions";
import produce from "immer";
import { ToastContainer, toast } from "react-toastify";
import { persist, redux } from "zustand/middleware";

import "react-toastify/dist/ReactToastify.css";

import TweetBox from "./TweetBox";
import KeyboardButton from "./KeyboardButton";
import { WritableDraft } from "immer/dist/internal";
import Modal from "./Modal";
import Header from "./Header";
import InfoDialog from "./dialogs/InfoDialog";
import SettingsDialog, { useSettingsStore } from "./dialogs/SettingsDialog";

import styles from "./Game.module.css";

import ReactCanvasConfetti from "react-canvas-confetti";
import GameOverDialog from "./dialogs/GameOverDialog";
import create from "zustand";
import Solution from "./Solution";
import Prompt from "./Prompt";
import ClientOnly from "./ClientOnly";
import ShareLink from "./ShareLink";
import amplitude from "amplitude-js";

export const maxAttempts = 5;
export interface IGameState {
    isComplete: boolean;
    gameOver: boolean;
    cursorPosition: { wordIndex: number; charIndex: number };
    submissions: Array<[string, string, string, string]>;
    solution: [IRow, IRow, IRow, IRow];
    0: {
        isComplete: boolean;
        text: string;
        state: string;
    };
    1: {
        isComplete: boolean;
        text: string;
        state: string;
    };
    2: {
        isComplete: boolean;
        text: string;
        state: string;
    };
    3: {
        isComplete: boolean;
        text: string;
        state: string;
    };
}

function verify(draft: WritableDraft<IGameState>): WritableDraft<IGameState> {
    const attempts: string[] = [];
    const solutions: string[] = [];

    for (const wordIndex of [0, 1, 2, 3]) {
        const word = draft[wordIndex as 0 | 1 | 2 | 3];
        attempts.push(word.state);
        solutions.push(word.text);
    }

    draft.submissions.push(attempts as [string, string, string, string]);

    attempts.forEach((attempt: string, wordIndex) => {
        const solution = solutions[wordIndex];
        if (attempt.toUpperCase() === solution.toUpperCase()) {
            draft[wordIndex as 0 | 1 | 2 | 3].isComplete = true;
        } else {
            draft[wordIndex as 0 | 1 | 2 | 3].state = draft[
                wordIndex as 0 | 1 | 2 | 3
            ].text
                .split("")
                .map(() => "_")
                .join("");
        }
    });
    const firstIncompleteIndex = attempts.findIndex(
        (_, wordIndex) => !draft[wordIndex as 0 | 1 | 2 | 3].isComplete
    );

    if (firstIncompleteIndex < 0) {
        draft.isComplete = true;
        draft.cursorPosition.wordIndex = 0;
        draft.cursorPosition.charIndex = 0;
    } else {
        draft.cursorPosition.wordIndex = firstIncompleteIndex;
        draft.cursorPosition.charIndex = 0;
        if (draft.submissions.length >= maxAttempts) {
            draft.gameOver = true;
        }
    }
    return draft;
}

const Actions = {
    setLetter: createAction("SET_LETTER")<string>(),
    delete: createAction("DELETE")(),
};

interface IAppState {
    history: { [challengeIndex: string]: IGameState };
    currentChallenge: string | null;
}

export const RootActions = {
    loadChallenge: createAction("LOAD_CHALLENGE")<IGameState, string>(),
};

type AllActions = ActionType<typeof Actions & typeof RootActions>;

// this reducer will have an action type that includes all those in Actions, plus one more
function rootReducer(state: IAppState, action: AllActions) {
    switch (action.type) {
        case getType(RootActions.loadChallenge): {
            if (state.history[action.meta]) {
                // if we've already loaded this challenge, don't bother
                return state;
            }
            return {
                ...state,
                history: {
                    ...state.history,
                    [action.meta]: action.payload,
                },
                currentChallenge: action.meta,
            };
        }
        default: {
            if (
                state.currentChallenge &&
                state.history[state.currentChallenge]
            ) {
                return {
                    ...state,
                    history: {
                        ...state.history,
                        [state.currentChallenge]: reducer(
                            state.history[state.currentChallenge],
                            action
                        ),
                    },
                };
            } else {
                return state;
            }
        }
    }
}

export const useStore = create(
    persist(redux(rootReducer, { currentChallenge: null, history: {} }), {
        name: "birdle-game-storage", // unique name
    })
);

function reducer(
    state: IGameState,
    action: ActionType<typeof Actions>
): IGameState {
    switch (action.type) {
        case getType(Actions.setLetter): {
            return produce(state, (draft) => {
                if (draft.gameOver) {
                    return;
                }
                const { wordIndex, charIndex } = draft.cursorPosition;
                // first, enter the typed letter at the cursor position
                draft[wordIndex as 0 | 1 | 2 | 3]["state"] = draft[
                    wordIndex as 0 | 1 | 2 | 3
                ]["state"]
                    .split("")
                    .map((letter, index) => {
                        if (index === charIndex && letter === "_") {
                            return action.payload;
                        }
                        return letter;
                    })
                    .join("");

                // next, we need to decide whether to increment the charIndex or the wordIndex
                // if the cursor is at the end of the word, we need to increment the wordIndex
                const isCursorAtEndOfWord =
                    charIndex ===
                    draft[wordIndex as 0 | 1 | 2 | 3]["text"].length - 1;
                const isCursorOnLastWord = getNextWordIndex(draft) === 0;
                if (isCursorAtEndOfWord) {
                    if (isCursorOnLastWord) {
                        // this means we are at the end of the last word. we need to verify the results
                        verify(draft);
                        return;
                    } else {
                        draft.cursorPosition.wordIndex =
                            getNextWordIndex(draft);
                        draft.cursorPosition.charIndex = 0;
                    }
                }
                // otherwise, we need to increment the charIndex
                else {
                    draft.cursorPosition.charIndex = charIndex + 1;
                }
            });
        }
        case getType(Actions.delete): {
            return produce(state, (draft) => {
                if (draft.gameOver) {
                    return;
                }
                const { charIndex: oldCharIndex } = draft.cursorPosition;
                // first, decrement the cursor
                if (oldCharIndex === 0) {
                    // this next check ensures that we don't just keep looping around the word at index 0
                    if (
                        !(
                            getPreviousWordIndex(draft) === 0 &&
                            draft.cursorPosition.wordIndex === 0
                        ) &&
                        !(
                            getPreviousWordIndex(draft) === 0 &&
                            draft[0].isComplete
                        )
                    ) {
                        // if at start of a non-first word, we need to decrement the wordIndex
                        draft.cursorPosition.wordIndex =
                            getPreviousWordIndex(state);
                        draft.cursorPosition.charIndex =
                            draft[
                                draft.cursorPosition.wordIndex as 0 | 1 | 2 | 3
                            ]["text"].length - 1;
                    }
                } else {
                    // otherwise just decrement the charIndex
                    draft.cursorPosition.charIndex = oldCharIndex - 1;
                }

                const { wordIndex, charIndex } = draft.cursorPosition;

                draft[wordIndex as 0 | 1 | 2 | 3]["state"] = draft[
                    wordIndex as 0 | 1 | 2 | 3
                ]["state"]
                    .split("")
                    .map((letter, index) => {
                        if (index === charIndex) {
                            return "_";
                        }
                        return letter;
                    })
                    .join("");
            });
        }
        default:
            return state;
    }
}

function getNextWordIndex(state: IGameState) {
    // this needs to get the next incomplete word index
    const { wordIndex } = state.cursorPosition;
    if (wordIndex < 3) {
        for (let i = wordIndex + 1; i < 4; i++) {
            const nextWord = state[i as 0 | 1 | 2 | 3];
            if (nextWord.isComplete) {
                continue;
            } else {
                return i;
            }
        }
    }
    return 0;
}

function getPreviousWordIndex(state: IGameState) {
    // this needs to get the last incomplete word index
    const { wordIndex } = state.cursorPosition;
    if (wordIndex > 0) {
        for (let i = wordIndex - 1; i >= 0; i--) {
            const nextWord = state[i as 0 | 1 | 2 | 3];
            if (nextWord.isComplete) {
                continue;
            } else {
                return i;
            }
        }
    }
    return 0;
}

export enum CharCompletion {
    Correct = "correct",
    Incorrect = "incorrect",
    Present = "present",
}

export enum DialogState {
    // Complete = "complete",
    Info = "info",
    Settings = "settings",
    GameOver = "gameOver",
}

function getDialogContent(
    dialogState: DialogState | null,
    gameState: IGameState
): React.ReactNode {
    if (!dialogState) {
        return null;
    }
    switch (dialogState) {
        case DialogState.Info:
            return <InfoDialog />;
        case DialogState.Settings:
            return <SettingsDialog />;
        case DialogState.GameOver:
            return <GameOverDialog state={gameState} />;
        default:
            return null;
    }
}

function getShareText(state: IGameState, challengeId: string): string {
    let start = `Birdle (www.birdle.art) 🐦 #${challengeId} ${state.submissions.length}/${maxAttempts}:\n\n`;
    start += state.submissions
        .map((submission) => {
            return submission
                .map((word, index) => {
                    const wasCorrect =
                        word.toUpperCase() ===
                        state[index as 0 | 1 | 2 | 3].text.toUpperCase();
                    return wasCorrect ? `🟩` : `🟥`;
                })
                .join(" ");
        })
        .join("\n");
    start += "\n\n";
    return start;
}

interface IProps {
    state: IGameState;
    dispatch: (a: AllActions) => AllActions;
    challengeIndex: string;
    firstTime: boolean;
}

export default function Game(props: IProps) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const footerRef = useRef<HTMLDivElement>(null);
    const solutionRef = useRef<HTMLDivElement>(null);
    const stickyRef = useRef<HTMLDivElement>(null);
    const [scrollIndex, setScrollIndex] = useState(0);
    const [dialogState, setDialogState] = useState<DialogState | null>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [promptLoaded, setPromptLoaded] = useState(false);
    const [solutionFits, setSolutionFits] = useState(true);
    const { easyMode, darkMode, noConfetti } = useSettingsStore();
    const [interactive, setInteractive] = useState(false);
    const { dispatch, state } = props;

    const confettiRef = useRef<any>(null);

    // a "failure popup"
    useEffect(() => {
        if (state.gameOver) {
            setDialogState(DialogState.GameOver);
        }
    }, [state.gameOver]);

    // new users will see the info dialog on first load
    useEffect(() => {
        if (props.firstTime) {
            setDialogState(DialogState.Info);
        }
    }, [props.firstTime]);

    const onShareClick = useCallback(() => {
        navigator.clipboard
            .writeText(getShareText(state, props.challengeIndex))
            .then(
                function () {
                    /* clipboard successfully set */
                    toast("Copied to clipboard.", { type: "success" });
                },
                function () {
                    /* clipboard write failed */
                    toast("Could not copy to clipboard.", { type: "error" });
                }
            );
    }, [state, props.challengeIndex]);

    const onDialogClose = useCallback(() => {
        setDialogState(null);
    }, []);

    const handleScroll = useCallback(() => {
        if (wrapRef.current && footerRef.current) {
            const { height: footerHeight } =
                footerRef.current.getBoundingClientRect();
            const { scrollTop, scrollHeight, clientHeight } = wrapRef.current;
            const scrollableHeight = scrollHeight - clientHeight;
            const scrollPercent = (scrollTop - footerHeight) / scrollableHeight;
            const scrollIndex = Math.ceil(
                scrollPercent * (state.solution.length - 1)
            );
            setScrollIndex(scrollIndex);
        }
    }, [state.solution]);

    // this useEffect ensures that the spans corresponding to the current letters are always in view
    // TODO: there is an issue in which this is currently dependent on the transitioning of the solution
    useEffect(() => {
        if (solutionFits) {
            return;
        }
        const matches: Element[] = [];
        document
            .querySelectorAll(`span[data-index='${scrollIndex}']`)
            .forEach((span, index) => {
                matches.push(span);
            });

        if (!matches.length || !solutionRef.current) {
            return;
        }

        // first, find midpoint of first and last span
        const firstSpan = matches[0];
        const lastSpan = matches[matches.length - 1];
        const midpoint =
            (firstSpan.getBoundingClientRect().left +
                lastSpan.getBoundingClientRect().right) /
            2;

        // then, determine what it would take to place the midpoint in the center of the screen
        const midpointOffset = midpoint - window.innerWidth / 2;

        const solution = solutionRef.current;
        const existing = Number(
            solution.style.transform
                .replace("translateX(", "")
                .replace("px)", "")
        );
        const newLeft = existing - midpointOffset;
        if (newLeft <= 0) {
            solution.style.transform = `translateX(${newLeft}px)`;
        } else {
            solution.style.transform = `translateX(${0}px)`;
        }
    }, [scrollIndex, solutionFits]);

    const scrollToIndex = useCallback(
        (index: number) => {
            if (wrapRef.current) {
                const { scrollHeight, clientHeight } = wrapRef.current;
                const scrollableHeight = scrollHeight - clientHeight;
                const scrollPercent = index / (state.solution.length - 1);
                const scrollTop = scrollableHeight * scrollPercent;
                wrapRef.current.scroll({ top: scrollTop, behavior: "smooth" });
            }
        },
        [state.solution]
    );

    // keep scroll position in sync with the wordIndex
    // Note: including "state" in the dependency list will cause a re-scroll on every letter change
    useEffect(() => {
        if (interactive) {
            scrollToIndex(state.cursorPosition.wordIndex);
        }
    }, [state.cursorPosition.wordIndex, scrollToIndex, state, interactive]);

    useEffect(() => {
        // when game finishes, launch confetti
        if (interactive && state.isComplete) {
            if (!noConfetti) {
                confettiRef.current.confetti({
                    angle: -90,
                    origin: { x: 0.5, y: 0.5 },
                    colors: [
                        "#26ccff",
                        "#a25afd",
                        "#ff5e7e",
                        "#88ff5a",
                        "#fcff42",
                        "#ffa62d",
                        "#ff36ff",
                    ],
                    startVelocity: 40,
                    spread: 360,
                    particleCount: 180,
                    gravity: 0.4,
                    ticks: 1000,
                });
            }
        }
    }, [state.isComplete, noConfetti, interactive]);

    const handleButtonClick = useCallback(
        (letter: string) => {
            if (!interactive) {
                console.log("not interactive");
                return;
            }
            const current =
                state[0].state +
                state[1].state +
                state[2].state +
                state[3].state;
            const blanks = current.split("").filter((l) => l === "_");
            if (blanks.length <= 1) {
                // if as submission is about to happen, set interactive to false until "solution" is loaded
                setInteractive(false);
            }
            console.log("setting letter");
            dispatch(Actions.setLetter(letter));
        },
        [state, dispatch, interactive]
    );

    const handleDelete = useCallback(() => {
        if (!interactive) {
            return;
        }
        const { wordIndex, charIndex } = state.cursorPosition;
        // I put this check in to prevent a deletion at the end of the last word
        if (state[wordIndex as 0 | 1 | 2 | 3].state[charIndex] !== "_") {
            return;
        }
        dispatch(Actions.delete());
    }, [state, dispatch, interactive]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            // check if the key is a letter
            if (
                !e.altKey &&
                !e.shiftKey &&
                !e.metaKey &&
                e.key.length === 1 &&
                e.key.match(/[a-z]/i)
            ) {
                handleButtonClick(e.key);
            }
            // check if the key is a delete
            else if (e.key === "Backspace") {
                handleDelete();
            }
        },
        [handleButtonClick, handleDelete]
    );

    useEffect(() => {
        const wrapRefInstance = wrapRef.current;
        wrapRefInstance?.addEventListener("scroll", handleScroll);
        return () => {
            wrapRefInstance?.removeEventListener("scroll", handleScroll);
        };
    }, [handleScroll]);

    // this is nasty, but I want to set the keyboard height on mount so that the other components can use it
    useEffect(() => {
        setKeyboardHeight(
            footerRef.current?.getBoundingClientRect().height || 0
        );
    }, [promptLoaded]);

    // setup keyboard handlers for typing on desktop
    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // i have to hide the keyboard here because otherwise it will cause a hydration error
    useEffect(() => {
        if ((state.isComplete || state.gameOver) && footerRef.current) {
            footerRef.current.style.zIndex = "-1";
            footerRef.current.style.opacity = "0";
        }
    }, [state.isComplete, state.gameOver]);

    useEffect(() => {
        if (process.env.NODE_ENV === "production") {
            if (state.gameOver) {
                amplitude.getInstance().logEvent("GAME_FAIL");
            }
            if (state.isComplete) {
                amplitude.getInstance().logEvent("GAME_SUCCESS");
            }
        }
    }, [state.gameOver, state.isComplete]);

    const blocksLength =
        state[0].state.length +
        1 +
        state[1].state.length +
        1 +
        state[2].state.length +
        1 +
        state[3].state.length;

    return (
        <div className={styles.wrap} ref={wrapRef} role="main">
            <ReactCanvasConfetti ref={confettiRef} className="canvas" />
            <ToastContainer
                hideProgressBar={true}
                limit={1}
                theme={darkMode ? "dark" : "light"}
            />
            <Modal isOpen={Boolean(dialogState)} onClose={onDialogClose}>
                {getDialogContent(dialogState, state)}
            </Modal>
            <div
                className={styles.sticky}
                ref={stickyRef}
                role="heading"
                aria-level={1}
            >
                <Header
                    openDialog={setDialogState}
                    progress={state.submissions.length}
                    showProgress={!state.isComplete}
                />
                <ClientOnly>
                    <Solution
                        easyMode={easyMode}
                        ref={solutionRef}
                        setSolutionFits={setSolutionFits}
                        solutionFits={solutionFits}
                        blocksLength={blocksLength}
                        state={state}
                        scrollIndex={scrollIndex}
                        setInteractive={setInteractive}
                    />
                </ClientOnly>
                <ClientOnly>
                    <ShareLink
                        onShareClick={onShareClick}
                        stickyRef={stickyRef}
                        isComplete={state.isComplete}
                    />
                </ClientOnly>
            </div>
            <div className={styles.grid}>
                {state.solution.map((row, index) => (
                    <div
                        className={styles.tweetBox}
                        key={row.id}
                        style={{ paddingBottom: keyboardHeight }}
                    >
                        <TweetBox
                            id={row.id}
                            author_profile_url={row.author_profile_url}
                            matching_word={state[index as 0 | 1 | 2 | 3].text}
                            text={row.text}
                            author={row.author}
                            author_full={row.author_full}
                            is_complete={
                                state[index as 0 | 1 | 2 | 3].isComplete
                            }
                            is_game_complete={state.isComplete}
                        />
                    </div>
                ))}
            </div>
            <div className={styles.footer} ref={footerRef} role="region">
                <ClientOnly>
                    <Prompt
                        state={state}
                        scrollIndex={scrollIndex}
                        setPromptLoaded={setPromptLoaded}
                    />
                </ClientOnly>
                <div className={styles.keyboard}>
                    <div className={styles.keyboardRow}>
                        <KeyboardButton
                            letter={"Q"}
                            onClick={handleButtonClick}
                        />
                        <KeyboardButton
                            letter={"W"}
                            onClick={handleButtonClick}
                        />
                        <KeyboardButton
                            letter={"E"}
                            onClick={handleButtonClick}
                        />
                        <KeyboardButton
                            letter={"R"}
                            onClick={handleButtonClick}
                        />
                        <KeyboardButton
                            letter={"T"}
                            onClick={handleButtonClick}
                        />
                        <KeyboardButton
                            letter={"Y"}
                            onClick={handleButtonClick}
                        />
                        <KeyboardButton
                            letter={"U"}
                            onClick={handleButtonClick}
                        />
                        <KeyboardButton
                            letter={"I"}
                            onClick={handleButtonClick}
                        />
                        <KeyboardButton
                            letter={"O"}
                            onClick={handleButtonClick}
                        />
                        <KeyboardButton
                            letter={"P"}
                            onClick={handleButtonClick}
                        />
                    </div>
                    <div className={styles.keyboardRow}>
                        <KeyboardButton
                            letter={"A"}
                            onClick={handleButtonClick}
                        />
                        <KeyboardButton
                            letter={"S"}
                            onClick={handleButtonClick}
                        />
                        <KeyboardButton
                            letter={"D"}
                            onClick={handleButtonClick}
                        />
                        <KeyboardButton
                            letter={"F"}
                            onClick={handleButtonClick}
                        />
                        <KeyboardButton
                            letter={"G"}
                            onClick={handleButtonClick}
                        />
                        <KeyboardButton
                            letter={"H"}
                            onClick={handleButtonClick}
                        />
                        <KeyboardButton
                            letter={"J"}
                            onClick={handleButtonClick}
                        />
                        <KeyboardButton
                            letter={"K"}
                            onClick={handleButtonClick}
                        />
                        <KeyboardButton
                            letter={"L"}
                            onClick={handleButtonClick}
                        />
                    </div>
                    <div className={styles.keyboardRow}>
                        {/* <KeyboardButton
                            letter={"ENTER"}
                            onClick={handleButtonClick}
                        /> */}
                        <KeyboardButton
                            letter={"Z"}
                            onClick={handleButtonClick}
                        />
                        <KeyboardButton
                            letter={"X"}
                            onClick={handleButtonClick}
                        />
                        <KeyboardButton
                            letter={"C"}
                            onClick={handleButtonClick}
                        />
                        <KeyboardButton
                            letter={"V"}
                            onClick={handleButtonClick}
                        />
                        <KeyboardButton
                            letter={"B"}
                            onClick={handleButtonClick}
                        />
                        <KeyboardButton
                            letter={"N"}
                            onClick={handleButtonClick}
                        />
                        <KeyboardButton
                            letter={"M"}
                            onClick={handleButtonClick}
                        />
                        <KeyboardButton letter={"DEL"} onClick={handleDelete} />
                    </div>
                </div>
            </div>
        </div>
    );
}
