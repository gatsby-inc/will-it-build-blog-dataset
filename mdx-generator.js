const fs = require(`fs-extra`)
const kebabCase = require(`lodash.kebabcase`)
const download = require(`image-downloader`)
const path = require(`path`)
const { dd } = require(`dumper.js`)
const ProgressBar = require("progress")
const retry = require(`async-retry`)
const Url = require(`url`)
const chunk = require(`lodash.chunk`)

const fetchAndWriteImage = async ({ url, directory }) => {
  const fileName = path.parse(Url.parse(url).pathname).base

  if (await fs.exists(`${directory}/${fileName}`)) {
    return fileName
  }

  try {
    const fileName = await retry(
      async () => {
        const { filename: fileDirectory } = await download.image({
          url,
          dest: directory,
        })

        const fileName = path.parse(fileDirectory).base

        return fileName
      },
      {
        retries: 5,
        onRetry: (error, attemptNumber) => {
          if (attemptNumber === 5) {
            console.log(directory)
            console.log(url)
            console.error(error)
          }
        },
      }
    )

    return fileName
  } catch (e) {
    dd(e)
  }
}

const generateMDX = async ({
  articleNumber,
  title,
  imageFileName,
  content,
}) => {
  return `---
articleNumber: ${articleNumber}
title: "${title}"
image: "${`./${imageFileName}`}"
---

import { Link } from "gatsby"

<Link to="/">Go Home</Link>

${content}
`
}

const generateAndWriteMDXFile = async ({ set, article }) => {
  const articleDirectory = `${set.name}/articles/${kebabCase(article.title)}`

  const absoluteArticleDirectory = `${__dirname}/mdx/${articleDirectory}`

  await fs.ensureDir(absoluteArticleDirectory)

  const imageFileName = await fetchAndWriteImage({
    url: article.image.url,
    directory: absoluteArticleDirectory,
  })

  const mdxFileContents = await generateMDX({
    ...article,
    imageFileName,
  })

  await fs.writeFile(`${absoluteArticleDirectory}/index.mdx`, mdxFileContents)
}

const generateAndWriteMDXFiles = async set => {
  const jsonDir = `./data/${set.name}`
  const jsonFiles = await fs.readdir(jsonDir)

  for (const jsonFile of jsonFiles) {
    const articles = await fs.readJSON(`${jsonDir}/${jsonFile}`)

    const jsonBar = new ProgressBar(
      `Generating MDX from ${set.name}/${jsonFile} [:bar] :rate/s | :current/:total | :percent | eta :etas`,
      {
        width: 50,
        total: articles.length,
      }
    )

    const chunkedArticles = chunk(articles, 10)

    for (const articles of chunkedArticles) {
      await Promise.all(
        articles.map(async article => {
          await generateAndWriteMDXFile({
            set,
            article,
          })
          jsonBar.tick()
        })
      )
    }
  }
}

;(async () => {
  const options = require(`./gatsby-config`).plugins.find(
    plugin => plugin.resolve === `gatsby-plugin-data-generator`
  ).options

  const singleSet = options.sets.find(
    set => set.name === options.generateSingleSet
  )

  if (singleSet) {
    await generateAndWriteMDXFiles(singleSet)
  } else {
    for (const set of options.sets) {
      await generateAndWriteMDXFiles(set)
    }
  }
})()
