const fs = require(`fs-extra`)
const URL = require(`url`)
const tsvtojson = require(`tsvtojson`)
const sampleSize = require(`lodash.samplesize`)
const { https } = require("follow-redirects")
const chunk = require(`lodash.chunk`)

const bytesToMB = bytes => bytes / 1048576

const getImageDataset = async ({
  reporter,
  count: numberOfImages,
  maxImageSizeMB = 5,
}) => {
  const fullImageDataSet = await tsvtojson(
    require.resolve(`./open-image-dataset-v6/tsv/0.tsv`),
    [`url`, `size`, `id`]
  )

  // we only want images up to maxImageSizeMB
  const imageDataSetUnderSizeLimit = fullImageDataSet.filter(
    ({ size }) => bytesToMB(size) <= maxImageSizeMB
  )

  reporter.info(
    `got ${fullImageDataSet.length} urls, there are ${imageDataSetUnderSizeLimit.length} under the 5mb limit`
  )

  let imageDataSetUnverified

  if (numberOfImages && numberOfImages > 0) {
    imageDataSetUnverified = sampleSize(
      imageDataSetUnderSizeLimit,
      numberOfImages
    )
  } else {
    imageDataSetUnverified = imageDataSetUnderSizeLimit
  }

  let activity = reporter.activityTimer(
    `Checking that all ${imageDataSetUnverified.length} image urls are still valid`
  )

  activity.start()

  let imageDataSet = []

  const chunkedUnverifiedImages = chunk(imageDataSetUnverified, 256)

  let verifiedCount = 0

  for (const imagesChunk of chunkedUnverifiedImages) {
    const validImagesChunk = (
      await Promise.all(
        imagesChunk.map(
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

    verifiedCount += imagesChunk.length

    imageDataSet = [...imageDataSet, ...validImagesChunk]

    activity.setStatus(
      `[${verifiedCount} of ${
        imageDataSetUnverified.length
      }] ${imagesChunk.length -
        validImagesChunk.length} dead image links discarded, ${
        validImagesChunk.length
      } kept. ${imageDataSet.length} total valid url's`
    )

    const filePath = `./open-image-dataset-v6/json/0-temp.json`
    fs.ensureFileSync(filePath)
    fs.writeJSONSync(filePath, imageDataSet)
  }

  activity.end()

  reporter.info(
    `Of the ${imageDataSetUnverified.length} image URL's ${imageDataSet.length} were valid images`
  )

  return imageDataSet
}

;(async () => {
  const images = await getImageDataset({
    count: 1000001,
    reporter: {
      info: console.log,
      activityTimer: () => ({
        start: () => {},
        end: () => {},
        setStatus: console.log,
      }),
    },
  })

  const filePath = `./open-image-dataset-v6/json/0.json`
  fs.ensureFileSync(filePath)
  fs.writeJSONSync(filePath, images)
})()
