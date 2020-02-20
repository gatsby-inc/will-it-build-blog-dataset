module.exports = {
  siteMetadata: {
    title: `Gatsby-Drupal WillItBuild exporter`,
    description: `Pulls data from Drupal and exports it to JSON`,
    author: `@gatsbyjs`,
  },
  plugins: [
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-source-drupal`,
      options: {
        baseUrl: process.env.DRUPAL_URL,
      },
    },
  ],
}
