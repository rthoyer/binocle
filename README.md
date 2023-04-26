binocle
=======

Brilliant Instance Navigation, Organisation and Cleaning Looker Executable

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/binocle.svg)](https://npmjs.org/package/binocle)
[![Downloads/week](https://img.shields.io/npm/dw/binocle.svg)](https://npmjs.org/package/binocle)
[![License](https://img.shields.io/npm/l/binocle.svg)](https://github.com/rthoyer/binocle/blob/master/package.json)

This CLI tool was initially developed during the Hack@Home 2021 Hackathon organized by Looker.  
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
binocle/0.1.6 darwin-arm64 node-v19.6.0
$ binocle --help [COMMAND]
USAGE
  $ binocle COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`binocle copy ID [TYPE] [FOLDER_ID]`](#binocle-copy-id-type-folder_id)
* [`binocle edit ID [TYPE]`](#binocle-edit-id-type)
* [`binocle help [COMMAND]`](#binocle-help-command)
* [`binocle ls [FOLDER_ID]`](#binocle-ls-folder_id)
* [`binocle pause CONTENT_ID [TYPE] [USER_ID]`](#binocle-pause-content_id-type-user_id)
* [`binocle restore ID [TYPE]`](#binocle-restore-id-type)
* [`binocle share FOLDER_ID ID [TYPE]`](#binocle-share-folder_id-id-type)

## `binocle copy ID [TYPE] [FOLDER_ID]`

Copies a dashboard into a specified folder.

```
USAGE
  $ binocle copy ID [TYPE] [FOLDER_ID]

ARGUMENTS
  ID
  TYPE       (l|d) [default: l] look (l) or dashboard (d)
  FOLDER_ID

OPTIONS
  -c, --client_id=client_id          (required) API3 credential client_id
  -h, --help                         show CLI help
  -r, --rename                       Allows to rename the content that will be copied.
  -s, --client_secret=client_secret  (required) API3 credential client_id
  -u, --base_url=base_url            (required) Sets base url like https://my.looker.com:19999
```

_See code: [src/commands/copy.ts](https://github.com/rthoyer/binocle/blob/v0.1.6/src/commands/copy.ts)_

## `binocle edit ID [TYPE]`

Edit queries of Looks and Dashboard tiles.

```
USAGE
  $ binocle edit ID [TYPE]

ARGUMENTS
  ID
  TYPE  (l|d) [default: l] look (l) or dashboard (d)

OPTIONS
  -b, --bulk                         Allows to edit dashboard tiles in bulk.
  -c, --client_id=client_id          (required) API3 credential client_id

  -e, --edit_dashboard_properties    Allows to edit the properties of the dashboard before editing the dashboard
                                     elements. (Ex : Edit filters)

  -h, --help                         show CLI help

  -p, --get_properties               Display the properties of the content you want to edit, before editing it.

  -r, --rename                       Allows to rename the content that will be copied.

  -s, --client_secret=client_secret  (required) API3 credential client_id

  -u, --base_url=base_url            (required) Sets base url like https://my.looker.com:19999
```

_See code: [src/commands/edit.ts](https://github.com/rthoyer/binocle/blob/v0.1.6/src/commands/edit.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.18/src/commands/help.ts)_

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

_See code: [src/commands/ls.ts](https://github.com/rthoyer/binocle/blob/v0.1.6/src/commands/ls.ts)_

## `binocle pause CONTENT_ID [TYPE] [USER_ID]`

Gets all schedules of a Look/Dashboard and enables pausing/unpausing them. NB: if any runs were skipped while it was paused, it will run once after being unpaused.

```
USAGE
  $ binocle pause CONTENT_ID [TYPE] [USER_ID]

ARGUMENTS
  CONTENT_ID
  TYPE        (l|d) [default: l] look (l) or dashboard (d)
  USER_ID     If no user_id is provided defaults to the API3 Key owner

OPTIONS
  -c, --client_id=client_id          (required) API3 credential client_id
  -h, --help                         show CLI help
  -r, --revert                       Revert: displays paused schedules and enabling unpausing them
  -s, --client_secret=client_secret  (required) API3 credential client_id
  -u, --base_url=base_url            (required) Sets base url like https://my.looker.com:19999

ALIASES
  $ binocle schedule:pause
```

_See code: [src/commands/pause.ts](https://github.com/rthoyer/binocle/blob/v0.1.6/src/commands/pause.ts)_

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

_See code: [src/commands/restore.ts](https://github.com/rthoyer/binocle/blob/v0.1.6/src/commands/restore.ts)_

## `binocle share FOLDER_ID ID [TYPE]`

Shares a folder and its parents up until the shared folders to a group or a user

```
USAGE
  $ binocle share FOLDER_ID ID [TYPE]

ARGUMENTS
  FOLDER_ID
  ID
  TYPE       (g|u) [default: g] group (g) or user (u)

OPTIONS
  -c, --client_id=client_id          (required) API3 credential client_id
  -e, --edit_right                   Shares with edit rights
  -h, --help                         show CLI help
  -s, --client_secret=client_secret  (required) API3 credential client_id
  -u, --base_url=base_url            (required) Sets base url like https://my.looker.com:19999
```

_See code: [src/commands/share.ts](https://github.com/rthoyer/binocle/blob/v0.1.6/src/commands/share.ts)_
<!-- commandsstop -->
