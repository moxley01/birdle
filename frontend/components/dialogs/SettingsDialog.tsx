import React, { useCallback, useEffect } from "react";
import Toggle from "react-toggle";
import create from "zustand";
import { persist } from "zustand/middleware";

import styles from "./styles.module.css";

import "react-toggle/style.css";
import { useTheme } from "next-themes";
import amplitude from "amplitude-js";

interface IUserStore {
    easyMode: boolean;
    darkMode: boolean;
    noConfetti: boolean;
    setEasyMode: (easyMode: boolean) => void;
    setDarkMode: (darkMode: boolean) => void;
    setNoConfetti: (noConfetti: boolean) => void;
}

export const useSettingsStore = create<IUserStore, any>(
    persist(
        (set) => ({
            easyMode: true,
            darkMode: false,
            noConfetti: false,
            setEasyMode: (value: boolean) => set(() => ({ easyMode: value })),
            setDarkMode: (value: boolean) => set(() => ({ darkMode: value })),
            setNoConfetti: (value: boolean) =>
                set(() => ({ noConfetti: value })),
        }),
        {
            name: "birdle-user-storage", // unique name
        }
    )
);

export default function SettingsDialog() {
    const {
        easyMode,
        darkMode,
        noConfetti,
        setEasyMode,
        setDarkMode,
        setNoConfetti,
    } = useSettingsStore();
    const { setTheme } = useTheme();

    useEffect(() => {
        if (darkMode) {
            setTheme("dark");
        } else {
            setTheme("light");
        }
    }, [darkMode, setTheme]);

    const toggleEasyMode = useCallback(() => {
        if (process.env.NODE_ENV === "production") {
            amplitude.getInstance().logEvent(`SET_EASY_MODE_${!easyMode}`);
        }
        setEasyMode(!easyMode);
    }, [easyMode, setEasyMode]);
    const toggleDarkMode = useCallback(() => {
        if (process.env.NODE_ENV === "production") {
            amplitude.getInstance().logEvent(`SET_DARK_MODE_${!darkMode}`);
        }
        setDarkMode(!darkMode);
    }, [darkMode, setDarkMode]);
    const toggleNoConfetti = useCallback(() => {
        if (process.env.NODE_ENV === "production") {
            amplitude.getInstance().logEvent(`SET_CONFETTI_${!noConfetti}`);
        }
        setNoConfetti(!noConfetti);
    }, [noConfetti, setNoConfetti]);
    return (
        <div>
            <h4>Settings</h4>
            <div className={styles.row}>
                <div className={styles.description}>
                    <div>Toggle easy mode</div>
                    <div>
                        Adds colored hints for failed guesses, in a format
                        reminiscent of another popular internet-based word game.
                    </div>
                </div>
                <Toggle
                    id="easy-mode"
                    checked={easyMode}
                    onChange={toggleEasyMode}
                />
            </div>
            <div className={styles.row}>
                <div className={styles.description}>
                    <div>Toggle dark mode</div>
                    <div></div>
                </div>
                <Toggle
                    id="dark-mode"
                    checked={darkMode}
                    onChange={toggleDarkMode}
                />
            </div>
            <div className={styles.row}>
                <div className={styles.description}>
                    <div>No confetti</div>
                    <div>
                        Prevents the confetti effect that plays after getting
                        the puzzle correct.
                    </div>
                </div>
                <Toggle
                    id="no-confetti"
                    checked={noConfetti}
                    onChange={toggleNoConfetti}
                />
            </div>
        </div>
    );
}
