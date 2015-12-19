# ec2snapshots

This is a utility which creates snapshots and purges them after a set number of retention days
defined in AWS volume tags.

Each time the script is run, it will do the following for each volume which contains a `Snapshot` tag:
 - Purge snapshots older than the retention period (number of days defined as the value in the tag)
 - Create a new snapshot (Description format: [volume-id]_[volume-name]_YYYYMMDDHHSS)
 

## Installation

### 1) Install ec2snapshots

```
npm install -g ec2snapshots
```

### 2) Add your credentials to `~/aws/credentials`

```
[default]
aws_access_key_id = XXXXXXXXXXXXXXXXXXXX
aws_secret_access_key = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3) Tag the AWS volumes you would like to manage

Use the key name of `Snapshot` and add a value representing the number of days you would like the snapshot to be retained.

For example, if you would like a snapshot to be retained for 10 days, add a tag with a key name
of `Snapshot` and a value of `10`.


## Run it

```
ec2snapshots <region>
```

Separate multiple regions by commas.

```
ec2snapshots us-west-1,us-west-2
```

### Dry runs

If you would like to see what would happen, without creating or deleting any snapshots,
you can use the `--dryrun` flag.

```
ec2snapshots --dryrun us-west-1
# OR
ec2snapshots -d us-west-1
```


## Development

If you want to develop with the source, you can simply execute `./bin/ec2snapshots.js us-west-1` to test it.

If you would like to install it globally, based on your source, run the following from the project directory:

```
npm install . -g
```

This will replace the `ec2snapshots` executable with the latest from your current codebase.
