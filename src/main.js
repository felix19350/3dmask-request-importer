const commandLineArgs = require('command-line-args');
const CsvDataTransformer = require('./CsvDataTransformer');

const optionDefinitions = [
  { name: 'src', type: String },
  { name: 'outputDir', alias: 'o', type: String, defaultValue: '/tmp' }
];

const options = commandLineArgs(optionDefinitions);

if (!options.src) {
  console.error("Please provide a source CSV file via the src argument. Example: node src/main.js --src test.csv --outputDir /tmp");
  process.exit(-1);
} else {
  try {
    const dataTransformManager = new CsvDataTransformer(options.outputDir);
    dataTransformManager.processCsvFile(options.src).then(({ sqlOutputPath, reportFilePath }) => {
      console.log(`Transformation process complete.`);
      console.log(`SQL file went to: ${sqlOutputPath}`);
      console.log(`Report went to: ${reportFilePath}`)
    }).catch(err => { throw err });
  } catch (err) {
    console.error("Data transformation process failed.")
    console.error(err);
    process.exit(-1);
  }
}

