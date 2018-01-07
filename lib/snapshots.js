'use strict';

var config = require('../config');
var async = require('async');
var moment = require('moment');
var AWS = require('aws-sdk');
var ec2 = null;
var snapshotKey = 'Snapshot';


var createSnapshots = function(regions, dryrun, callback) {
  async.each(regions, function(region, done) {
    console.log('Creating snapshots for', region);

    var snapshotsCreated = 0;

    AWS.config.region = region;
    ec2 = new AWS.EC2();

    getVolumes(function (err, volumes) {
      if (err) return done(err);
      for (var x in volumes) {
        createSnapshot(volumes[x].VolumeId, volumes[x].VolumeName, dryrun);
        snapshotsCreated++;
      }
      console.log(' --', snapshotsCreated, 'snapshots created');
      done();
    });
  }, function(err) {
    callback(err);
  });
};


var purgeSnapshots = function(regions, dryrun, callback) {
  async.each(regions, function(region, done) {
    console.log('Purging snapshots for', region);

    var snapshotsPurged = 0;

    AWS.config.region = region;
    ec2 = new AWS.EC2();

    var volumesArr = [];
    getVolumes(function (err, volumes) {
      if (err) return done(err);
      for (var x in volumes) {
        volumesArr.push(x);
      }
      var params = {
        Filters: [
          {
            Name: 'volume-id',
            Values: volumesArr
          }
        ]
      };

      ec2.describeSnapshots(params, function (err, data) {
        if (err) {
          return done(err);
        }
        else {
          for (var x in data.Snapshots) {
            var retentionDays = volumes[data.Snapshots[x].VolumeId].RetentionDays;
            // 0 means keep all backups
            if (retentionDays === 0) {
              continue;
            }
            var daysOld = getDaysSince(data.Snapshots[x].StartTime);

            if (daysOld > retentionDays) {
              console.log('    Deleting', data.Snapshots[x].SnapshotId, '(' + daysOld + ' days old)');
              deleteSnapshot(data.Snapshots[x].SnapshotId, dryrun);
              snapshotsPurged++;
            }
          }
          console.log(' --', snapshotsPurged, 'snapshots purged');
          done();
        }
      });
    });
  }, function(err) {
    callback(err);
  });
};


var getVolumes = function(callback) {
  var params = {
    Filters: [
      {
        Name: 'tag-key',
        Values: [snapshotKey]
      }
    ]
  };

  ec2.describeVolumes(params, function(err, data) {
    var volumes = {};

    if (err) {
      if (callback) {
        callback(err, err.stack);
      }
    }
    else {
      for (var x in data.Volumes) {
        var volumeId = data.Volumes[x].VolumeId;
        volumes[volumeId] = data.Volumes[x];
        volumes[volumeId].RetentionDays = getRetentionFromTags(data.Volumes[x].Tags);
        volumes[volumeId].VolumeName = getNameFromTags(data.Volumes[x].Tags);
      }
      callback(null, volumes);
    }
  });
};


var createSnapshot = function(volumeId, volumeName, dryrun, callback) {
  var d = moment().format('YYYYMMDDHHmmss');
  var snapshotDesc = volumeId + '_' + volumeName + '_' + d;
  console.log('    New snapshot:', snapshotDesc);

  var params = {
    VolumeId: volumeId,
    Description: snapshotDesc,
    DryRun: dryrun
  };
  ec2.createSnapshot(params, function(err, data) {
    if (err) {
      if (callback) {
        callback(err, err.stack);
      }
    }
    else {
      if (callback) {
        callback(null, data);
      }
    }
  });
};


var deleteSnapshot = function(snapshotId, dryrun, callback) {
  var params = {
    SnapshotId: snapshotId,
    DryRun: dryrun
  };

  ec2.deleteSnapshot(params, function(err, data) {
    if (err && callback) callback(err, err.stack);
    else {
      if (callback) {
        callback(null, data);
      }
    }
  });
};


var getRetentionFromTags = function(tags) {
  for (var x in tags) {
    if (tags[x].Key == snapshotKey) {
      return parseInt(tags[x].Value);
    }
  }
  return 0;
};


var getNameFromTags = function(tags) {
  for (var x in tags) {
    if (tags[x].Key == 'Name') {
      return tags[x].Value;
    }
  }
  return '';
};


var getDaysSince = function(d) {
  var now = new Date();
  now = now.getTime();
  var then = d.getTime();
  var msDiff = now - then;
  return Math.floor(msDiff / 1000 / 86400);
};


module.exports = {
  createSnapshots: createSnapshots,
  purgeSnapshots: purgeSnapshots
};
