const { dd } = require(`dumper.js`)

const globula = require(`glob`)
const Queue = require(`p-queue`).default
const fs = require(`fs-extra`)
const sampleSize = require(`lodash.samplesize`)

const fullImageDataset = require(`willit/src/utils/get-image-dataset`)
const corruptImageList = require(`./broken-images.json`)

const fileQueue = new Queue({ concurrency: 5 })

/**
 * Originally the pregenerated dataset was generated using corrupted images.
 * This script finds and replaces any corrupt images that were discovered using the ./remove-corrup-images.js script
 */
;(async () => {
  const articleFiles = await new Promise(resolve =>
    globula(`./data/**/*.json`, (_err, files) => resolve(files))
  )

  const brokenImageByLevelMap = {}

  articleFiles.forEach(fileName => {
    const level = fileName.split(`/`)[2] // willitbuild-01 for example

    const storageUrl = `https://storage.googleapis.com/gatsby-open-images/`

    fileQueue.add(async () => {
      const fileJSONContents = await fs.readJSON(fileName)

      let brokenImages = []

      const uncorruptedFileContents = fileJSONContents.map(article => {
        if (!article.image.url.includes(storageUrl)) {
          article.image.url = article.image.url
            .replace(`http://`, storageUrl)
            .replace(`https://`, storageUrl)
        }

        if (corruptImageList.includes(article.image.url)) {
          brokenImages.push(article.image.url)

          // grab a new image to replace the corrupted one
          const [image] = sampleSize(fullImageDataset, 1)

          return {
            ...article,
            image,
          }
        }

        return article
      })

      await fs.writeJSON(fileName, uncorruptedFileContents)

      if (brokenImages.length) {
        console.log(`found and replaced corrupt images in ${fileName}`)
        const brokenLevel = brokenImageByLevelMap[level]

        if (!brokenLevel) {
          brokenImageByLevelMap[level] = brokenImages
        } else {
          brokenImageByLevelMap[level] = [...brokenLevel, ...brokenImages]
        }
      }
    })
  })

  await fileQueue.onIdle()
  await fs.writeJSON(
    `./previously-broken-images-by-level.json`,
    brokenImageByLevelMap
  )
})()
