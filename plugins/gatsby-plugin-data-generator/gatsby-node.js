const { generateArticles } = require(`./utils/generate`)
const { writeDataToDisk } = require(`./utils/write`)

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

  for (const actionableSet of actionableSets) {
    const [name, data] = await generateArticles(actionableSet)

    await writeDataToDisk({ name, data })
  }
}
