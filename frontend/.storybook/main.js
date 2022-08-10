module.exports = {
    stories: [
        "../stories/**/*.stories.mdx",
        "../stories/**/*.stories.@(js|jsx|ts|tsx)"
    ],
    addons: [
        "@storybook/addon-links",
        "@storybook/addon-essentials",
        "@storybook/addon-interactions",
        "@storybook/addon-console",
        "storybook-css-modules",
    ],
    framework: "@storybook/react",
    core: {
        builder: "@storybook/builder-webpack5"
    },
    typescript: { reactDocgen: false },
    features: {
        interactionsDebugger: true // 👈 Enable playback controls
    },
    webpackFinal: config => {

        const fileLoaderRule = config.module.rules.find(rule => rule.test && rule.test.test('.svg'));
        fileLoaderRule.exclude = /\.svg$/;  

        config.resolve.alias['zustand/middleware'] = require.resolve('../__mocks__/zustand_middleware.js');

        // note: should be the same here as next.config.js
        config.module.rules.push({
            test: /\.svg$/,
            use: ["@svgr/webpack"],
        });

        return config;
    }
};
