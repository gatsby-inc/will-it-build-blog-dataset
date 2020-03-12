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
        // use this option to generate a single dataset
        // otherwise it will do all of them one by one
        // generateSingleSet: `willitbuild-03`,
        sets: [
          {
            name: "willitbuild-01",
            articles: 512,
          },
          {
            name: "willitbuild-02",
            articles: 1024,
          },
          {
            name: "willitbuild-02",
            articles: 2048,
          },
          {
            name: "willitbuild-03",
            articles: 4096,
          },
          {
            name: "willitbuild-04",
            articles: 8192,
          },
          {
            name: "willitbuild-05",
            articles: 16384,
          },
          {
            name: "willitbuild-06",
            articles: 32768,
          },
          {
            name: "willitbuild-07",
            articles: 65536,
          },
          {
            name: "willitbuild-08",
            articles: 131072,
          },
          {
            name: "willitbuild-09",
            articles: 262144,
          },
          {
            name: "willitbuild-10",
            articles: 524288,
          },
        ],
      },
    },
  ],
}
