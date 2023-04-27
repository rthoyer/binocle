import {Command, flags} from '@oclif/command'
import ora from 'ora'
import LookerClient, { ILookerFolder } from '../client/client'
import inquirer from 'inquirer'

export default class Share extends Command {
  static description = 'Shares a folder and its parents up until the shared/users root folder to a group or a user'

  static flags = {
    base_url: flags.string({
      char: 'u',
      description: 'Sets base url like https://my.looker.com:19999',
      env: 'LOOKERSDK_BASE_URL',
      required: true,
    }),
    client_id: flags.string({
      char: 'c',
      description: 'API3 credential client_id',
      env: 'LOOKERSDK_CLIENT_ID',
      required: true,
    }),
    client_secret: flags.string({
      char: 's',
      description: 'API3 credential client_id',
      env: 'LOOKERSDK_CLIENT_SECRET',
      required: true,
    }),
    edit_right: flags.boolean({ // Check this works
      char: 'e',
      default: false,
      description: 'Shares with edit rights',
    }),
    is_group: flags.boolean({
      char: 'g',
      default: false,
      description: 'The provided id is the one of a group, not a user',
    }),
    help: flags.help({
      char: 'h',
    }),
  }

  static args = [
    {
      name: 'folder_id',
      required: true,
    },
    {
      name: 'id',
      required: true,
    },
  ]

  async run() {
    const {args, flags} = this.parse(Share)
    this.debug('[args: %o]', args)
    this.client = new LookerClient({
      client_id: flags.client_id,
      client_secret: flags.client_secret,
      base_url: flags.base_url,
    })
    await this.client.auth()
    let parents : IParentFolder[]
    const spinner_get_parents  = ora(`Fetching parent folders`).start()
    try {
      const folder = await this.client.getFolder(args.folder_id)
      parents = [ {id : args.folder_id, content_metadata_id: folder.content_metadata_id} ]
      parents = await this.getParents(parents)
      spinner_get_parents.succeed('Parent folders found')
    }
    catch(e) {
      spinner_get_parents.fail()
      console.error('Could not find parent folders')
      let show_get_error: IShowErrorChoice = await inquirer.prompt([{
        name: 'answer',
        message: 'Display full error response ?',
        type: 'list',
        choices: [{name: 'yes'}, {name: 'no'}],
      }])
      if(show_get_error.answer === 'yes') {
        console.error(e)
      }
      return
    }
    const spinner_share_parents  = ora(`Sharing folders`).start()
    try {
      for (const folder of parents) {
        const accesses = await this.client.getAllContentMetadataAccesses(folder.content_metadata_id)
        const existing_access = accesses.find((access) => access[args.is_group ? 'group_id' : 'user_id'] = args.id)
        if (!!existing_access){
          if(existing_access.permission_type === args.edit_right ? 'edit' : 'view' ){
            continue
          }
          await this.client.updateContentMetadataAccesses(existing_access.id, {
            ...(args.is_group ? {group_id : args.id} : {}),
            ...(args.is_group ? {} : {user_id : args.id}),
            permission_type : args.edit_right ? 'edit' : 'view',
            content_metadata_id: folder.content_metadata_id,
          })
          continue
        }
        await this.client.createContentMetadataAccesses({
          ...(args.is_group ? {group_id : args.id} : {}),
          ...(args.is_group ? {} : {user_id : args.id}),
          permission_type : args.edit_right ? 'edit' : 'view',
          content_metadata_id: folder.content_metadata_id,
        })
      }
      spinner_share_parents.succeed('Folders Shared')
    }
    catch(e) {
      spinner_share_parents.fail()
      console.error(e)
    }
  }


  public async getParents(parents: IParentFolder[]): Promise<IParentFolder[]>{
    const last_parent: ILookerFolder = await this.client.getFolder(parents[0].id)
    if(last_parent.is_shared_root || last_parent.is_users_root || !last_parent.parent_id){
      return parents
    }
    else {
      const new_parent : ILookerFolder = await this.client.getFolder(last_parent.parent_id)
      parents.unshift({id : new_parent.id, content_metadata_id: new_parent.content_metadata_id})
      return await this.getParents(parents)
    }
  }
  
  private client!: LookerClient
}

export interface IShowErrorChoice {
  answer: string
}

export interface IParentFolder {
  id: string
  content_metadata_id: number
}
