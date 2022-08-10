import React, { useEffect, useRef } from "react";
import cn from "classnames";
import styles from "./Game.module.css";
import headerStyles from "./Header.module.css";

import Share from "../public/share-2.svg";

interface IProps {
    isComplete: boolean;
    onShareClick: () => void;
    stickyRef: React.RefObject<HTMLDivElement>;
}

export default function ShareLink(props: IProps) {
    const shareRef = useRef<HTMLDivElement>(null);

    const { isComplete, onShareClick, stickyRef } = props;

    useEffect(() => {
        if (!stickyRef.current) {
            return;
        }
        stickyRef.current.style.paddingBottom =
            Number(shareRef.current?.getBoundingClientRect().height) + "px";
    }, [isComplete, stickyRef]);
    return (
        <div
            ref={shareRef}
            className={cn(styles.share, isComplete ? styles.visible : null)}
        >
            <button
                className={headerStyles.actionButton}
                onClick={onShareClick}
            >
                <Share />
            </button>
        </div>
    );
}
