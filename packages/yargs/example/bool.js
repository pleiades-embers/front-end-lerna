#!/usr/bin/env node

var util = require('util');
console.log(process.argv.slice(2));
var argv = require('yargs/yargs')(process.argv.slice(2)).argv;

if (argv.s) {
  console.log(argv.fr ? 'Le chat dit: ' : 'The cat says: ');
}
console.log((argv.fr ? 'miaou' : 'meow') + (argv.p ? '.' : ''));
