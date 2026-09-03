const postcssConfig = {
  plugins: {
    '@tailwindcss/postcss': {},
    // autoprefixer is no longer needed in v4, as it's included by default with LightningCSS
  },
};

export default postcssConfig;