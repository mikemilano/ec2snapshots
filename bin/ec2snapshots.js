#!/usr/bin/env node

var program = require('commander');
var snapshots = require('../lib/snapshots');

program
  .version('0.0.1')
  .option('-d, --dryrun', 'Dry run')
  .arguments('<region>]')
  .action(function (region, options) {
    var dryrun = options.dryrun !== undefined && options.dryrun;
    if (dryrun) {
      console.log('** Dry run **');
    }
    var regions = region.split(',');
    snapshots.purgeSnapshots(regions, dryrun, function(err, data) {
      if (err) console.error(err, err.stack);
      snapshots.createSnapshots(regions, dryrun, function (err, data) {
        if (err) console.error(err, err.stack);
      });
    });
  });

program.parse(process.argv);
