import React, { useEffect } from "react";
import shallow from "zustand/shallow";
import amplitude from "amplitude-js";
import { GetStaticProps } from "next";

import Game, { IGameState, RootActions, useStore } from "../components/Game";
import { createClient } from "@supabase/supabase-js";

// Use this mock data as a backup as a worst-case scenario if Supabase is not returning the day's puzzle
const challenge = "think less live more";
const solution: [IRow, IRow, IRow, IRow] = [
    {
        id: "1550782871668789248",
        text: "RT @authoramish: Couldn’t think of anyone better than my dear friend, @AnupamPKher ji to unveil the cover of the 4th book of the #RamChandr…",
        author: "AnupamPKher",
        likes: 0,
        retweets: 89,
        quotes: 0,
        replies: 0,
        author_full: "Anupam Kher",
        count: 5,
        author_profile_url: "",
    },
    {
        id: "1550873214263463939",
        text: "Your summer vita might get a bit less dolce from 2024, when new rules are set to come into force that some in the know are warning could change the fabric of Italy's seaside https://t.co/JnSSUiQU6b",
        author: "cnni",
        likes: 40,
        retweets: 9,
        quotes: 1,
        replies: 4,
        author_full: "CNN International",
        count: 5,
        author_profile_url: "",
    },
    {
        id: "1550989285658165249",
        text:
            "Trae Young on the lob! 🔥\n" +
            "\n" +
            "Catch tonight's Drew League action live on https://t.co/Pqxh2EPubW and the NBA App.\n" +
            "\n" +
            "📲 https://t.co/7kEPbDcgmN https://t.co/O1hiPoJjQH",
        author: "NBA",
        likes: 497,
        retweets: 48,
        quotes: 1,
        replies: 10,
        author_full: "NBA",
        count: 5,
        author_profile_url: "",
    },
    {
        id: "1550926235865432064",
        text: "Katelyn McClure was sentenced to one year and a day in prison for her role in scamming more than $400,000 from GoFundMe donors, claiming to be collecting money for a homeless man. https://t.co/GYFhHu51Eh",
        author: "CNN",
        likes: 1103,
        retweets: 250,
        quotes: 32,
        replies: 143,
        author_full: "CNN",
        count: 5,
        author_profile_url: "",
    },
];

function getInitialState(
    challenge: string,
    solution: [IRow, IRow, IRow, IRow]
): IGameState {
    const words = challenge.split(" ") as [string, string, string, string];

    const initialState: IGameState = {
        isComplete: false,
        gameOver: false,
        cursorPosition: { wordIndex: 0, charIndex: 0 },
        solution,
        submissions: [],
        0: {
            isComplete: false,
            text: "",
            state: "",
        },
        1: {
            isComplete: false,
            text: "",
            state: "",
        },
        2: {
            isComplete: false,
            text: "",
            state: "",
        },
        3: {
            isComplete: false,
            text: "",
            state: "",
        },
    };
    words.forEach((word, index) => {
        initialState[index as 0 | 1 | 2 | 3] = {
            isComplete: false,
            text: word,
            state: new Array(word.length).fill("_").join(""),
        };
    });
    return initialState;
}

export interface IProps {
    state: IGameState;
    challengeIndex: string;
}

function App(props: IProps) {
    const firstTime = useStore((state) => !Object.keys(state.history).length);
    const { dispatch, state: hydratedState } = useStore(
        (state) => ({
            dispatch: state.dispatch,
            state: state.currentChallenge
                ? state.history[props.challengeIndex || state.currentChallenge]
                : null,
        }),
        shallow
    );

    useEffect(() => {
        if (process.env.NODE_ENV === "production") {
            amplitude.getInstance().init("f71fc51fc4d20217b4e09e4dc199d60f");
            amplitude.getInstance().logEvent("LOAD");
        }
    }, []);

    useEffect(() => {
        if (!hydratedState) {
            dispatch(
                RootActions.loadChallenge(props.state, props.challengeIndex)
            );
        }
    }, [hydratedState, dispatch, props.state, props.challengeIndex]);

    return (
        <div>
            <title>Birdle</title>
            <Game
                dispatch={dispatch}
                state={hydratedState || props.state}
                challengeIndex={props.challengeIndex}
                firstTime={firstTime}
            />
        </div>
    );
}

export const getStaticProps: GetStaticProps = async () => {
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
    );

    const currentPuzzle = await supabase
        .from("current_puzzle")
        .select("*")
        .then((res) => {
            if (res.error) {
                console.log("error getting puzzle data");
                return null;
            }
            if (!res.data.length) {
                console.log("No data");
                return null;
            } else {
                return res.data as [
                    IExtendedRow,
                    IExtendedRow,
                    IExtendedRow,
                    IExtendedRow
                ];
            }
        });

    if (!currentPuzzle?.[0]?.puzzle_text) {
        const state = getInitialState(challenge, solution);
        return { props: { state, challengeIndex: "1" } };
    }

    const state = getInitialState(
        currentPuzzle[0].puzzle_text.replace(",", ""),
        currentPuzzle
    );

    // Pass data to the page via props
    return {
        props: { state, challengeIndex: currentPuzzle[0].count.toString() },
        revalidate: 60, // 1 minute cache
    };
};

export default App;
