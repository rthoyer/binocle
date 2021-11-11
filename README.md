binocle
=======

Brilliant Instance Navigation, Organisation and Cleaning Looker Executable

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/binocle.svg)](https://npmjs.org/package/binocle)
[![Downloads/week](https://img.shields.io/npm/dw/binocle.svg)](https://npmjs.org/package/binocle)
[![License](https://img.shields.io/npm/l/binocle.svg)](https://github.com/rthoyer/binocle/blob/master/package.json)

This CLI tool was developed furing the Hack@Home 2021 Hackathon organized by Looker.  
It uses the environement variables described in the [Looker Codegen SDK](https://github.com/looker-open-source/sdk-codegen#environment-variable-configuration).

It aims at providing a set of tools to better understand, organise and document your Looker instance.

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g binocle
$ binocle COMMAND
running command...
$ binocle (-v|--version|version)
binocle/0.1.1 darwin-x64 node-v12.20.1
$ binocle --help [COMMAND]
USAGE
  $ binocle COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`binocle help [COMMAND]`](#binocle-help-command)
* [`binocle ls [FOLDER_ID]`](#binocle-ls-folder_id)
* [`binocle restore ID [TYPE]`](#binocle-restore-id-type)

## `binocle help [COMMAND]`

display help for binocle

```
USAGE
  $ binocle help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.4/src/commands/help.ts)_

## `binocle ls [FOLDER_ID]`

Lists the content of the selected folder and its subfolders.

```
USAGE
  $ binocle ls [FOLDER_ID]

OPTIONS
  -c, --client_id=client_id          (required) API3 credential client_id
  -d, --depth=depth                  [default: 2] Sets the subfolders depth to display. Unlimited depth : -1
  -h, --help                         show CLI help
  -i, --image                        Creates an image of the listing in the current directory
  -s, --client_secret=client_secret  (required) API3 credential client_id
  -u, --base_url=base_url            (required) Sets base url like https://my.looker.com:19999
  --show_content                     Displays Looks and Dashboards in the listing

DESCRIPTION
  Use the options to save the output to a png image, display the looks and dashboards and set the depth in the folder 
  binocle must search in. Click on the contents and folders ids in your terminal (provided it supports it, use iTerm2 
  for instance) to open them in your default browser.

EXAMPLE
  $ binocle ls 123 -d 2
  📁 Folder A #123 (D:0 - L:0)
  |   📁 Folder B #145 (D:0 - L:2)
  |   |   📁 Folder D #547 (D:0 - L:3)
  |   📁 Folder C #156 (D:1 - L:7)
```

_See code: [src/commands/ls.ts](https://github.com/rthoyer/binocle/blob/v0.1.1/src/commands/ls.ts)_

## `binocle restore ID [TYPE]`

Check if a look or dashboard has been deleted by id and restore it if possible in a chosen folder.

```
USAGE
  $ binocle restore ID [TYPE]

ARGUMENTS
  ID
  TYPE  (l|d) [default: l] look (l) or dashboard (d)

OPTIONS
  -c, --client_id=client_id          (required) API3 credential client_id
  -h, --help                         show CLI help
  -s, --client_secret=client_secret  (required) API3 credential client_id
  -u, --base_url=base_url            (required) Sets base url like https://my.looker.com:19999
```

_See code: [src/commands/restore.ts](https://github.com/rthoyer/binocle/blob/v0.1.1/src/commands/restore.ts)_
<!-- commandsstop -->
