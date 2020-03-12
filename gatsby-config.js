module.exports = {
  siteMetadata: {
    title: `Gatsby-Drupal WillItBuild exporter`,
    description: `Generates and exports dummy data as JSON to be used for will it build`,
    author: `@gatsbyjs, Tyler Barnes`,
  },
  plugins: [
    {
      resolve: `gatsby-plugin-data-generator`,
      options: {
        generateSingleSet: `willitbuild-01`,
        sets: [
          {
            name: "willitbuild-01",
            articles: 64,
          },
          {
            name: "willitbuild-02",
            articles: 128,
          },
        ],
      },
    },
  ],
}
