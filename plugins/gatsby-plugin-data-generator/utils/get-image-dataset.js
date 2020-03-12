const URL = require(`url`)
const tsvtojson = require(`tsvtojson`)
const sampleSize = require(`lodash.samplesize`)
const { https } = require("follow-redirects")

const bytesToMB = bytes => bytes / 1048576

exports.getImageDataset = async ({
  count: numberOfImages,
  maxImageSizeMB = 5,
}) => {
  const fullImageDataSet = await tsvtojson(
    require.resolve(`../open-image-dataset-v6/0.tsv`),
    [`url`, `size`, `id`]
  )

  // we only want images up to maxImageSizeMB
  const imageDataSetUnderSizeLimit = fullImageDataSet.filter(
    ({ size }) => bytesToMB(size) <= maxImageSizeMB
  )

  const imageDataSetUnverified = sampleSize(
    imageDataSetUnderSizeLimit,
    numberOfImages
  )

  const imageDataSet = (
    await Promise.all(
      imageDataSetUnverified.map(
        ({ url, size, id }) =>
          new Promise(resolve => {
            const parsedUrl = URL.parse(url)

            const request = https.request(
              {
                method: "HEAD",
                host: parsedUrl.hostname,
                path: parsedUrl.pathname,
              },
              response => {
                const isImage = response.headers[`content-type`].includes(
                  `image/`
                )

                if (!isImage) {
                  resolve(false)
                }

                resolve({ url, size, id })
              }
            )
            request.end()
          })
      )
    )
  ).filter(Boolean)

  return imageDataSet
}
