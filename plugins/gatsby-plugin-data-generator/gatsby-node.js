const { generateArticles } = require(`./utils/generate`)

exports.sourceNodes = async (helpers, pluginOptions) => {
  const { sets, generateSingleSet } = pluginOptions

  const setsByName = sets.reduce((allSets, singleSet) => {
    allSets[singleSet.name] = singleSet

    return allSets
  }, {})

  const actionableSets =
    generateSingleSet && setsByName[generateSingleSet]
      ? [setsByName[generateSingleSet]]
      : sets

  if (!actionableSets || !actionableSets.length) {
    return
  }

  const dataSets = {}

  for (const actionableSet of actionableSets) {
    const [name, dataSet] = await generateArticles(actionableSet)

    dataSets[name] = dataSet
  }
}
