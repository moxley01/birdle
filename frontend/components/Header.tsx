import React from "react";
import Image from "next/image";

import { DialogState } from "./Game";

import Settings from "../public/settings.svg";
import Info from "../public/info.svg";

import styles from "./Header.module.css";
import ProgressBar from "./ProgressBar";
import ClientOnly from "./ClientOnly";

interface IProps {
    openDialog: (type: DialogState) => void;
    progress: number;
    showProgress: boolean;
}

export default function Header(props: IProps) {
    return (
        <div className={styles.header}>
            <div className={styles.headerContent}>
                <div>
                    <button
                        className={styles.actionButton}
                        onClick={() => props.openDialog(DialogState.Info)}
                    >
                        <Info />
                    </button>
                </div>
                <div>
                    <Image src={"/logo.png"} width={24} height={24} />
                    Birdle
                </div>
                <div>
                    <button
                        className={styles.actionButton}
                        onClick={() => props.openDialog(DialogState.Settings)}
                    >
                        <Settings />
                    </button>
                </div>
            </div>
            {props.showProgress ? (
                <ClientOnly>
                    <ProgressBar progress={props.progress} />
                </ClientOnly>
            ) : null}
        </div>
    );
}
