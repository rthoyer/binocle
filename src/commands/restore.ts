import {Command, flags} from '@oclif/command'
import ora from 'ora'
import LookerClient from '../client/client'
import inquirer from 'inquirer'

export default class Restore extends Command {
  static description = 'Check if a look or dashboard has been deleted by id and restore it if possible in a chosen folder.'

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
    help: flags.help({
      char: 'h',
    }),
  }

  static args = [
    {
      name: 'id',
      required: true,
    },
    {
      name: 'type',
      default: 'l',
      description: 'look (l) or dashboard (d)',
      options: ['l', 'd']
    },
  ]

  async run() {
    const {args, flags} = this.parse(Restore)
    this.debug('[args: %o]', args)
    this.client = new LookerClient({
      client_id: flags.client_id,
      client_secret: flags.client_secret,
      base_url: flags.base_url,
    })
    await this.client.auth()
    const content : IPotentiallyDeletedContent = {}
    const spinner_get_content  = ora(`Fetching Content information`).start()
      try {
      if (args.type === 'l'){
      const look = await this.client.getLook(args.id)
      content.deleted = look.deleted
      content.deleted_at = look.deleted_at
      content.deleted_at = look.deleted_at
      spinner_get_content.succeed()
      }
      else {
        const dashboard = await this.client.getDashboard(args.id)
        content.deleted = dashboard.deleted
        content.deleted_at = dashboard.deleted_at
        content.deleted_at = dashboard.deleted_at
        spinner_get_content.succeed()
      }
    }
    catch(e) {
      spinner_get_content.fail()
      console.error('Could not find resquested content. It may have been hard deleted or does not exist.')
      let show_get_error: IShowErrorChoice = await inquirer.prompt([{
        name: 'answer',
        message: 'Display full error response ?',
        type: 'list',
        choices: [{name: 'yes'}, {name: 'no'}],
      }])
      if(show_get_error.answer === 'yes'){
        console.error(e)
      }
      return
    }
    if(!content.deleted){
      this.log(`Your content doesn't appear to have been deleted`)
    }
    else {
      const choice: IRestoreChoice = await inquirer.prompt([{
        name: 'restore',
        message: 'Your content was soft deleted, do you want to restore it ?',
        type: 'list',
        choices: [{name: 'yes'}, {name: 'no'}],
      }])
      if(choice.restore === 'yes'){
        let folder: IRestoreFolderChoice = await inquirer.prompt([{
          name: 'id',
          message: 'Select the id of the folder where you want to restore your content',
          type: 'number',
        }])
        const spinner_move_content  = ora(`Moving Content information`).start()
        try {
          if (args.type === 'l') {
            await this.client.updateLook(args.id, {deleted: false})
            const look = await this.client.getLook(args.id)
            if(look.folder_id !== folder.id.toString()){
              await this.client.moveLook({
                look_id: args.id,
                folder_id: folder.id.toString(),
              })
            }
          }
          else {
            await this.client.updateDashboard(args.id, {deleted: false})
            const look = await this.client.getDashboard(args.id)
            if(look.folder_id !== folder.id.toString()){
              await this.client.moveDashboard({
                dashboard_id: args.id,
                folder_id: folder.id.toString(),
              })
            }
          }
          spinner_move_content.succeed('Your content has been moved')
        }
        catch(e) {
          spinner_move_content.fail()
          console.error(e)
        }
      }
    }
  }
  
  private client!: LookerClient
}

export interface IPotentiallyDeletedContent {
  deleted?: boolean
  deleted_at?: Date
  deleter_id?: number
}

export interface IRestoreChoice {
  restore: string
}

export interface IShowErrorChoice {
  answer: string
}

export interface IRestoreFolderChoice {
  id: number
}
