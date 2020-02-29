# Will it build Drupal blog export

This Gatsby site pulls data from `gatsby-source-drupal` and writes it to disk as JSON files.

Images are pulled to validate that they don't cause Sharp/Vips errors but they're gitignored due to how big this repo would become with images. If you need images, re-export the sites locally.

To re-export all sites run `yarn build-all`
