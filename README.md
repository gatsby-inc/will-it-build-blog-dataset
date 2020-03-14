# Will it build data generator

This Gatsby site uses a local plugin (`plugins/gatsby-plugin-generate-data`) to generate mass amounts of dummy data for use in testing.

Images are taken from the open-image-dataset-v6. Any images over 5mb are discarded, the remaining image URL's are checked to ensure the image still exists.

To regenerate all data sets, run `gatsby build`.
To regenerate a single dataset, add this plugin option to gatsby-config `generateSingleSet:`willitbuild-0X`,`

# MDX generator

To generate MDX from the generated JSON dataset, run `node ./mdx-generator.js` in this directory. MDX will be generated into an `mdx/` directory. This directory is gitignored because it would blow up the size of this repo. While generating MDX, the script also downloads images for each MDX file. If it fails partway and you restart, it will only redownload images it hasn't downloaded yet.
