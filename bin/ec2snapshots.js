#!/usr/bin/env node

var program = require('commander');
var snapshots = require('../lib/snapshots');

program
  .version('0.0.1')
  .arguments('<region>]')
  .action(function (region) {
    var regions = region.split(',');
    snapshots.purgeSnapshots(regions, function(err, data) {
      if (err) console.error(err, err.stack);
      snapshots.createSnapshots(regions, function (err, data) {
        if (err) console.error(err, err.stack);
      });
    });
  });

program.parse(process.argv);
