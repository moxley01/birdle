import React, { useEffect } from "react";
import {
    ComponentStory,
    ComponentMeta,
    StoryContext,
    ReactFramework,
} from "@storybook/react";
import { within, userEvent, waitFor } from "@storybook/testing-library";
import { expect, jest } from "@storybook/jest";

import App, { IProps } from "../pages";
import { useStore } from "../components/Game";

const mockProps: IProps = {
    state: {
        "0": { isComplete: false, text: "Follow", state: "______" },
        "1": { isComplete: false, text: "your", state: "____" },
        "2": { isComplete: false, text: "own", state: "___" },
        "3": { isComplete: false, text: "star", state: "____" },
        isComplete: false,
        gameOver: false,
        cursorPosition: { wordIndex: 0, charIndex: 0 },
        solution: [
            {
                text: "The only thing more infinite than the scroll is the dopamine.  Follow The Onion on TikTok. https://t.co/6m4SivP8bN",
                id: "1554670897985998848",
                author: "TheOnion",
                likes: 86,
                retweets: 4,
                quotes: 1,
                replies: 4,
                author_full: "The Onion",
                count: 11,
                author_profile_url:
                    "https://pbs.twimg.com/profile_images/1517492889852461056/bEnqsvVR_normal.jpg",
            },
            {
                text: "Pay for LA public transit with your iPhone. Add your TAP card to your Apple Wallet and just tap to ride.",
                id: "1554941088233771008",
                author: "Apple",
                likes: 0,
                retweets: 0,
                quotes: 0,
                replies: 0,
                author_full: "Apple",
                count: 11,
                author_profile_url:
                    "https://pbs.twimg.com/profile_images/1283958620359516160/p7zz5dxZ_normal.jpg",
            },
            {
                text: "The people of Kansas won a victory for freedom and liberty by standing with the majority of Americans who support a woman's right to make decisions about her own body.\n \nLast night, Kansans used their vote to protect the right to an abortion and reproductive healthcare.",
                id: "1554834429649883141",
                author: "VP",
                likes: 14639,
                retweets: 2116,
                quotes: 103,
                replies: 525,
                author_full: "Vice President Kamala Harris",
                count: 11,
                author_profile_url:
                    "https://pbs.twimg.com/profile_images/1380657780865044480/BBxmnji2_normal.jpg",
            },
            {
                text: "Why Rogue One’s K-2SO won’t be in Star Wars: Andor. https://t.co/O37AWQJCeO",
                id: "1555022210200473607",
                author: "IGN",
                likes: 189,
                retweets: 10,
                quotes: 3,
                replies: 10,
                author_full: "IGN",
                count: 11,
                author_profile_url:
                    "https://pbs.twimg.com/profile_images/1552401824174379009/b0HaUFPw_normal.jpg",
            },
        ],
        submissions: [],
    },
    challengeIndex: "11",
};

export default {
    title: "App",
    component: App,
    parameters: {
        layout: "fullscreen",
    },
} as ComponentMeta<typeof App>;

const Template: ComponentStory<typeof App> = (args) => {
    useEffect(() => {
        return afterEach;
    }, []);
    return <App {...args} {...mockProps} />;
};

export const FirstWord = Template.bind({});
export const FirstPhrase = Template.bind({});
export const Scrolling = Template.bind({});
export const DeletionPhrase = Template.bind({});
export const DeletionPhrase2 = Template.bind({});
export const DeletionPhrase3 = Template.bind({});
export const FailurePhrase = Template.bind({});
export const Setup = Template.bind({});

function afterEach() {
    useStore.setState({ currentChallenge: null, history: {} });
}

async function setup({ canvasElement }: StoryContext<ReactFramework, IProps>) {
    const canvas = within(canvasElement);
    await waitFor(() => {
        expect(canvas.getAllByRole("cell")[0]).toBeInTheDocument();
    });
    // how do we wait for the useEffect to be done???
    // how do we reset Zustand state after each so that tests are not interdependent?
    await new Promise((resolve) => setTimeout(resolve, 500));
    await userEvent.click(canvas.getByTitle("close dialog"));
}

Setup.play = async (context) => {
    await setup(context);
};

FirstWord.play = async (context) => {
    const canvas = within(context.canvasElement);
    await setup(context);
    await userEvent.keyboard("FOLLOW");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // assert Apple tweet is center of screen
    assertIndexIsCentered(canvas, 1);

    expect(getText(canvas)).toBe("FOLLOW___________");
};

FirstPhrase.play = async (context) => {
    const canvas = within(context.canvasElement);
    await setup(context);

    await userEvent.keyboard("FOLLOBYOUROWNSTA");

    await new Promise((resolve) => setTimeout(resolve, 3000));

    await userEvent.keyboard("R");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // within 1s of the submission, the hover animation is going
    assertIndexIsCentered(canvas, 3);

    // after a while we would expect the scroll to take effect
    await new Promise((resolve) => setTimeout(resolve, 2000));
    assertIndexIsCentered(canvas, 0);

    expect(getText(canvas)).toBe("______YOUROWNSTAR");
};

Scrolling.play = async (context) => {
    const canvas = within(context.canvasElement);
    await setup(context);

    const main = await canvas.findByRole("main");

    main.scrollTo({ top: 1000, behavior: "smooth" });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    await userEvent.keyboard("F");

    await new Promise((resolve) => setTimeout(resolve, 2000));

    assertIndexIsCentered(canvas, 0);
};

DeletionPhrase.play = async (context) => {
    const canvas = within(context.canvasElement);
    await setup(context);

    await userEvent.keyboard("FOLLOW");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    assertIndexIsCentered(canvas, 1);

    await userEvent.keyboard("[Backspace]");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    assertIndexIsCentered(canvas, 0);
    expect(getText(canvas)).toBe("FOLLO____________");
};

DeletionPhrase2.play = async (context) => {
    const canvas = within(context.canvasElement);
    await setup(context);

    await userEvent.keyboard("FOLLOSYOUROWNSTAX");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await userEvent.keyboard("FOLLOSS");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    assertIndexIsCentered(canvas, 3);

    await userEvent.keyboard("[Backspace]");
    await userEvent.keyboard("[Backspace]");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    assertIndexIsCentered(canvas, 0);
    expect(getText(canvas)).toBe("FOLLO_YOUROWN____");
};

DeletionPhrase3.play = async (context) => {
    const canvas = within(context.canvasElement);
    await setup(context);

    await userEvent.keyboard("FOLLOWYOUROWNSTAX");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await userEvent.keyboard("ST");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // despite backspaces, scrollIndex should stay on the last (only incorrect) word
    await userEvent.keyboard("[Backspace]");
    await userEvent.keyboard("[Backspace]");
    await userEvent.keyboard("[Backspace]");
    await userEvent.keyboard("[Backspace]");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    assertIndexIsCentered(canvas, 3);

    expect(getText(canvas)).toBe("FOLLOWYOUROWN____");
};

FailurePhrase.play = async (context) => {
    const canvas = within(context.canvasElement);
    await setup(context);

    await userEvent.keyboard("FOLLOWYOUROWNSTAX");
    await userEvent.keyboard("STAX");
    await userEvent.keyboard("STAX");
    await userEvent.keyboard("STAX");
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await userEvent.keyboard("STAX");

    await new Promise((resolve) => setTimeout(resolve, 500));

    const article = canvas.getByRole("heading", { name: "Bad luck!" });
    expect(article).toBeDefined();
};

/*----------- Setup stuff -------------------*/

class Box {
    top: number;
    right: number;
    bottom: number;
    left: number;
    width: number;
    height: number;
    constructor(init: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    }) {
        this.top = init.top;
        this.right = init.right;
        this.bottom = init.bottom;
        this.left = init.left;
        this.height = init.top - init.bottom;
        this.width = init.right - init.left;
    }
    contains(other: Box) {
        return (
            this.top <= other.top &&
            this.right >= other.right &&
            this.bottom >= other.bottom &&
            this.left <= other.left
        );
    }
    positionRelativeTo(other: Box) {
        if (!this.contains(other)) {
            return null;
        }
        const otherCenterY = (other.top + other.bottom) / 2;
        const otherCenterX = (other.right + other.left) / 2;
        return {
            vertical: (this.top - otherCenterY) / this.height,
            horizontal: (this.right - otherCenterX) / this.width,
        };
    }
}

function assertIndexIsCentered(
    canvas: ReturnType<typeof within>,
    index: number
) {
    const articles = canvas.getAllByRole("article");
    const heading = canvas.getByRole("heading");
    const footer = canvas.getByRole("region");

    const {
        bottom: headingBottom,
        right,
        left,
    } = heading.getBoundingClientRect();
    const boxDimensions = {
        top: headingBottom,
        right,
        left,
        bottom: footer.getBoundingClientRect().top,
    };
    const box = new Box(boxDimensions);
    const containsIndex = box.positionRelativeTo(
        new Box(articles[index].getBoundingClientRect())
    );
    expect(containsIndex?.vertical).toBe(0.5);
}

function getText(canvas: ReturnType<typeof within>) {
    return canvas
        .getAllByRole("cell")
        .map((cell: HTMLElement) => cell.textContent)
        .join("");
}
