const kebabCase = require(`lodash.kebabcase`)
const getSlug = require(`speakingurl`)
const fs = require(`fs-extra`)
const chunk = require(`lodash.chunk`)

const pluginOptionsUrl = require(`./gatsby-config`).plugins.find(
  plugin => plugin.resolve === `gatsby-source-drupal`
).options.baseUrl

const directoryPath = `./json/${getSlug(pluginOptionsUrl)}/`

const saveNodesChunkToDisk = async (chunk, index) => {
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

exports.onPreInit = ({ reporter }) =>
  reporter.log(`Exporting ${pluginOptionsUrl} to ./json/`)

exports.onPostBuild = ({ reporter }) =>
  reporter.log(`Finished exporting ${pluginOptionsUrl} to ./json/`)

exports.createPages = async ({ graphql, reporter }) => {
  const result = await graphql(`
    {
      articles: allNodeArticle {
        nodes {
          id
          drupal_id
          title
          created
          body {
            processed
          }
          field_image {
            alt
            title
            width
            height
          }
          relationships {
            field_image {
              filename
              filemime
              uri {
                url
              }
              drupal_id
              localFile {
                relativePath
                id
              }
            }
          }
        }
      }
    }
  `)

  if (result.errors) {
    reporter.panicOnBuild(result.errors)
  }

  // find corrupt images
  for (const node of result.data.articles.nodes) {
    const result = await graphql(`
          {
            nodeArticle(id: { eq: "${node.id}" }) {
              relationships {
                field_image {
                  localFile {
                    childImageSharp {
                      fluid(maxWidth: 256) {
                        src
                      }
                    }
                  }
                }
              }
            }
          }
      `)

    if (result.errors) {
      result.errors.forEach(error => reporter.error(error.message))

      reporter.info(`Gatsby nodeArticle id: ${node.id}`)
      reporter.info(`Drupal Article id: ${node.drupal_id}`)

      reporter.info(
        `Drupal Image id: ${node.relationships.field_image.drupal_id}`
      )

      if (node.relationships.field_image.uri) {
        reporter.info(
          `Drupal Image url: ${node.relationships.field_image.uri.url}`
        )
      }

      reporter.log(`\n\n\n`)
    }
  }

  const normalizedArticles = result.data.articles.nodes.map(node => {
    const drupalPath =
      (((node.relationships || {}).field_image || {}).uri || {}).url || ``

    return {
      id: node.drupal_id,
      path: kebabCase(node.title),
      title: node.title,
      date: node.created,
      body: node.body.processed,
      image: {
        alt: node.field_image.alt,
        title: node.field_image.title,
        width: node.field_image.width,
        height: node.field_image.height,
        fileName: node.relationships.field_image.filename,
        fileMime: node.relationships.field_image.filemime,
        drupalUrl: process.env.DRUPAL_URL + drupalPath,
        staticPath: drupalPath.replace(`/sites/default/`, `../`),
        staticFileName: drupalPath.split(`/`).pop(),
        localFileRelativePath:
          (((node.relationships || {}).field_image || {}).localFile || {})
            .relativePath || null,
        googleCloudUrl: (node.field_public_image_url || {}).uri,
      },
    }
  })

  fs.emptyDirSync(directoryPath)

  const chunkedArticles = chunk(normalizedArticles, 2000)

  chunkedArticles.forEach(saveNodesChunkToDisk)
}
