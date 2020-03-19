# Will it build blog dataset

This Gatsby site uses a local plugin (`plugins/gatsby-plugin-generate-data`) to generate mass amounts of dummy data for use in testing.

Images are taken from the open-image-dataset-v6. Any images over 5mb are discarded, the remaining image URL's are checked to ensure the image still exists.

To regenerate all data sets, run `gatsby build`.
To regenerate a single dataset, add this plugin option to gatsby-config `generateSingleSet:`willitbuild-0X`,`
