const fs = require(`fs-extra`)
const sampleSize = require(`lodash.samplesize`)

const { generateArticles } = require(`./generate`)
const fullImageDataset = require(`../open-image-dataset-v6/json/0.json`)

const arrayOfAscendingNumbers = times =>
  Array.from(new Array(times), (_, index) => index)

exports.generateArticlesAndWriteToDisk = async ({
  actionableSet,
  activity,
  reporter,
  chunksPerFile = 5000,
}) => {
  const { articles } = actionableSet

  const imageDataSet = sampleSize(fullImageDataset, articles)

  const numberOfFiles = Math.ceil(articles / chunksPerFile)
  const fileIndexes = arrayOfAscendingNumbers(numberOfFiles)

  const directoryPath = `data/${actionableSet.name}`

  fs.emptyDirSync(directoryPath)

  for (const index of fileIndexes) {
    activity.setStatus(`writing ${index + 1}/${numberOfFiles} json files`)

    const data = await generateArticles({
      imageDataSet,
      chunksPerFile,
      articleCount: articles,
      offset: chunksPerFile * index,
      reporter,
    })

    const filePath = `${directoryPath}/${index}.json`

    fs.ensureFileSync(filePath)
    fs.writeJSONSync(filePath, data)
  }
}
