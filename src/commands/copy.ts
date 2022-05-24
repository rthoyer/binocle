import {Command, flags} from '@oclif/command'
import ora from 'ora'
import LookerClient, { ILookerDashboard } from '../client/client'
import inquirer from 'inquirer'

export default class Copy extends Command {
  static description = 'Copies a dashboard into a specified folder.'

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
    rename: flags.boolean({
      char: 'r',
      description: 'Allows to rename the content that will be copied.',
      default: false,
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
      options: ['l', 'd'],
      require: true,
    },

    {
      name: 'folder_id',
      require: true,
    },
  ]

  async run() {
    const {args, flags} = this.parse(Copy)
    this.debug('[args: %o]', args)
    this.client = new LookerClient({
      client_id: flags.client_id,
      client_secret: flags.client_secret,
      base_url: flags.base_url,
    })
    await this.client.auth()
    const spinner_copy_content  = ora(`Copying Content`).start()
    try {
      if (args.type === 'd'){
        let dashboard = await this.client.copyDashboard({
          dashboard_id: args.id,
          folder_id: args.folder_id,
        })
        spinner_copy_content.succeed('Your Dashboard has been succesfully copied !')
        if (flags.rename) {
          console.log(flags.rename)
          let ask_name_of_dashboard: IShowRename = await inquirer.prompt([{
            name: 'answer',
            message: 'Enter the new name of the copied Dashboard :',
            type: 'input',
          }])
          dashboard = await this.client.updateDashboard(dashboard.id, {title: ask_name_of_dashboard.answer})
        }
      }
      else if (args.type === 'l'){
        let look = await this.client.copyLook({
          look_id: args.id,
          folder_id: args.folder_id,
        })
        spinner_copy_content.succeed('Your Look has been succesfully copied !')
        if (flags.rename) {
          console.log(flags.rename)
          let ask_name_of_look: IShowRename = await inquirer.prompt([{
            name: 'answer',
            message: 'Enter the new name of the copied Look :',
            type: 'input',
          }])
          look = await this.client.updateLook(look.id, {title: ask_name_of_look.answer})
        }
      }
    }
    catch(e) {
      spinner_copy_content.fail()
      console.error('Could not find resquested content. It may not exist.')
      let show_get_error: IShowErrorChoice = await inquirer.prompt([{
        name: 'error',
        message: 'Display full error response ?',
        type: 'list',
        choices: [{name: 'yes'}, {name: 'no'}],
      }])
      if(show_get_error.answer === 'yes'){
        console.error(e)
      }
      return
    }
  }
  
  private client!: LookerClient
}

export interface IShowRename {
  answer: string
}

export interface IShowErrorChoice {
  answer: string
}
