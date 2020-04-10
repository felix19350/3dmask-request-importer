const commandLineArgs = require('command-line-args');

const optionDefinitions = [
  { name: 'src', type: String}
];

const options = commandLineArgs(optionDefinitions);

if(!options.src){
    console.error("Please provide a source CSV file via the src argument. Example: node src/main.js --src test.csv");
    process.exit(-1);
}

console.log("TODO: something useful");
