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

  const normalizedArticles = result.data.articles.nodes.map(node => ({
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
