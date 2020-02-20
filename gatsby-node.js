const kebabCase = require(`lodash.kebabcase`)
const getSlug = require(`speakingurl`)
const fs = require("fs-extra")

const pluginOptionsUrl = require(`./gatsby-config`).plugins.find(
  plugin => plugin.resolve === `gatsby-source-drupal`
).options.baseUrl

const directoryPath = `./json/${getSlug(pluginOptionsUrl)}/`

const saveNodeToDisk = node => {
  const filePath = `${directoryPath}/articles/${node.id}.json`

  fs.ensureFileSync(filePath)
  fs.writeJSONSync(filePath, node)
}

exports.createPages = async ({ graphql, reporter }) => {
  const result = await graphql(`
    {
      images: allNodeArticle {
        nodes {
          field_image {
            title
          }
          relationships {
            field_image {
              uri {
                url
              }
              localFile {
                childImageSharp {
                  original {
                    src
                  }
                }
              }
            }
          }
        }
      }
      articles: allNodeArticle {
        nodes {
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
              localFile {
                childImageSharp {
                  original {
                    src
                  }
                }
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

  const articles = result.data.articles.nodes
  const images = result.data.images.nodes

  const normalizedArticles = articles.map(node => ({
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
      staticPath:
        node.relationships.field_image.localFile.childImageSharp.original.src,
    },
  }))

  const dedupedImageSrcs = new Set([
    ...images
      .map(article =>
        article &&
        article.relationships &&
        article.relationships.field_image &&
        article.relationships.field_image.localFile
          ? article.relationships.field_image.localFile.childImageSharp.original
              .src
          : null
      )
      .filter(Boolean),
  ])

  const dedupedImageUrls = new Set([
    ...images
      .map(article =>
        article &&
        article.relationships &&
        article.relationships.field_image &&
        article.relationships.field_image.uri
          ? article.relationships.field_image.uri.url
          : null
      )
      .filter(Boolean),
  ])

  const dedupedImageTitles = new Set([
    ...images
      .map(article =>
        article && article.field_image ? article.field_image.title : null
      )
      .filter(Boolean),
  ])

  console.log(dedupedImageSrcs.size)
  console.log(dedupedImageUrls.size)
  console.log(dedupedImageTitles.size)
  console.log(images.length)
  console.log([...dedupedImageSrcs])
  console.log([...dedupedImageUrls])

  fs.emptyDirSync(directoryPath)

  normalizedArticles.forEach(saveNodeToDisk)
}

exports.onPostBuild = () =>
  fs.moveSync(`./public/static`, `${directoryPath}/static`, err => {
    if (!err) {
      console.log(`finished exporting ${pluginOptionsUrl} to ./json/!`)
      return
    }

    console.error(err)
  })
