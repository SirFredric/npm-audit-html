const terminalLink = require('terminal-link')
const Handlebars = require('handlebars')
const moment = require('moment')
const marked = require('marked')
const fs = require('fs-extra')
const chalk = require('chalk')

const bootstrapClassSeverityMap = {
  low: 'primary',
  moderate: 'secondary',
  high: 'warning',
  critical: 'danger'
}

const generateTemplate = async (data, template) => {
  try {
    const htmlTemplate = await fs.readFile(template, 'utf8')
    return Handlebars.compile(htmlTemplate)(data)
  } catch (err) {
    throw err
  }
}

const writeReport = async (report, output) => {
  try {
    await fs.ensureFile(output)
    await fs.writeFile(output, report)
  } catch (err) {
    throw err
  }
}

const modifyData = async data => {
  const vulnerabilities = data.metadata.vulnerabilities || []

  //   for (const act in data.actions) {
  //     const action = data.actions[act]
  //     console.log(action)
  //   }

  // calculate totals
  let total = 0
  for (const vul in vulnerabilities) {
    const count = vulnerabilities[vul]
    total += count
  }
  data.metadata.vulnerabilities.total = total
  data.date = Date.now()

  return data
}

module.exports = async (data, templateFile, outputFile) => {
  try {
    if (!data.metadata) {
      if (data.updated) {
        console.log(
          chalk.red(
            `Sorry! You can't use ${chalk.underline(
              'npm audit fix'
            )} with npm-audit-html.\n\nSee ${terminalLink(
              'issue #3',
              'https://github.com/eventOneHQ/npm-audit-html/issues/3'
            )}`
          )
        )
      } else {
        console.log(
          chalk.red(
            `The provided data doesn't seem to be correct. Did you run with ${chalk.underline(
              'npm audit --json'
            )}?`
          )
        )
      }
      process.exit(1)
    }

    const modifiedData = await modifyData(data)
    const report = await generateTemplate(modifiedData, templateFile)
    await writeReport(report, outputFile)
  } catch (err) {
    console.log(err)
  }
}

Handlebars.registerHelper('moment', (date, format) => {
  return moment.utc(date).format(format)
})

Handlebars.registerHelper('severityClass', severity => {
  const bootstrapClass = bootstrapClassSeverityMap[severity]
  return bootstrapClass
})

Handlebars.registerHelper('markdown', source => {
  return marked(source)
})
