import React, { useCallback } from "react";

interface IProps {
    letter: string;
    onClick: (letter: string) => void;
}

export default function KeyboardButton(props: IProps) {
    const handleButtonClick = useCallback(() => {
        props.onClick(props.letter);
    }, [props]);
    return <button onClick={handleButtonClick}>{props.letter}</button>;
}
