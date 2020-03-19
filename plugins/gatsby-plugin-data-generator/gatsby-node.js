const { generateArticlesAndWriteToDisk } = require(`./utils/write`)

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

  const { reporter } = helpers

  for (const actionableSet of actionableSets) {
    let activity = reporter.activityTimer(
      `Generating ${actionableSet.articles} articles for ${actionableSet.name}`
    )

    activity.start()

    await generateArticlesAndWriteToDisk({ actionableSet, activity, reporter })

    activity.end()
  }
}
