const fs = require(`fs-extra`)
const chunk = require(`lodash.chunk`)

const saveNodesChunkToDisk = async ({ chunk, index, directoryPath }) => {
  const filePath = `${directoryPath}/articles/${index}.json`

  fs.ensureFileSync(filePath)
  fs.writeJSONSync(filePath, chunk)

  await Promise.all(
    chunk.map(async article => {
      if (
        !article.image.staticPath ||
        article.image.staticPath === `` ||
        !article.image.localFileRelativePath
      ) {
        return
      }

      const imagePath = `${directoryPath}/${article.image.staticPath.replace(
        `../`,
        ``
      )}`

      await fs.copy(article.image.localFileRelativePath, imagePath)
    })
  )
}

exports.writeDataToDisk = ({ name, data }) => {
  const directoryPath = `data/${name}`

  fs.emptyDirSync(directoryPath)

  const chunkedArticles = chunk(data, 2000)

  chunkedArticles.forEach((chunk, index) =>
    saveNodesChunkToDisk({ chunk, index, directoryPath })
  )
}
