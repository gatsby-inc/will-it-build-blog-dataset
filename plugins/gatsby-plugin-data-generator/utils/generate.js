const faker = require(`faker`)

const { getImageDataset } = require(`./get-image-dataset`)

exports.generateArticles = async ({
  name: datasetName,
  articles: numberOfArticles,
}) => {
  const imageDataSet = await getImageDataset({
    count: numberOfArticles,
  })

  const articles = []

  for (
    let articleNumber = 1;
    articleNumber <= numberOfArticles;
    articleNumber++
  ) {
    const image = {
      // to account for that some of our images url's no longer existed
      // if there is no image for this article
      ...(imageDataSet[articleNumber - 1]
        ? imageDataSet[articleNumber - 1]
        : // use another image from earlier in the array
          imageDataSet[articleNumber - imageDataSet.length + 1]),
    }

    const title = faker.random.words(Math.floor(Math.random() * 7) + 3)

    const content = faker.random.words(500)

    const article = {
      articleNumber,
      title,
      content,
      image,
    }

    articles.push(article)
  }

  return [datasetName, articles]
}
