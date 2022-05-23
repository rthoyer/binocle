import {Command, flags} from '@oclif/command'
import ora from 'ora'
import LookerClient, { IDashboardElement, ILookerDashboard, ILookerLook, ILookerLookWithQuery, ILookerQuery } from '../client/client'
import inquirer from 'inquirer'
import { string } from '@oclif/parser/lib/flags'

export default class Edit extends Command {
  static description = 'Copy a dashboard into a specified folder.'

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
    bulk: flags.boolean({
      char: 'b',
      description: 'Allows to edit dashboard tiles in bulk.',
      default: false,
    }),
    get_properties: flags.boolean({
      char: 'p',
      description: 'Display the properties of the content you want to edit, before editing it.',
      default: false,
    }),
    edit_properties: flags.boolean({
      char: 'e',
      description: 'Allows to edit properties rather than replacing them. For example to edit a property enter the field and its value. To remove a field from an array of strings: enter an already existing field. A new field will be added automatically as well.',
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
  ]

  async run() {
    const {args, flags} = this.parse(Edit)
    this.debug('[args: %o]', args)
    this.client = new LookerClient({
      client_id: flags.client_id,
      client_secret: flags.client_secret,
      base_url: flags.base_url,
    })
    await this.client.auth()
    const spinner_edit_content  = ora(`Looking for Content`).start()
    try {
      if (args.type === 'd'){
        this.dashboard = await this.client.getDashboard(args.id)
        spinner_edit_content.succeed('Dashboard : ' + this.dashboard.title + '(# ' +  this.dashboard.id + ') found !')
      }
      else {
        this.look = await this.client.getLook(args.id)
        spinner_edit_content.succeed('Dashboard : ' + this.look.title + '(# ' +  this.look.id + ') found !')
      }
    }
    catch(e) {
      spinner_edit_content.fail()
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
    if (this.dashboard) {
      await this.editDashboard()
    }
  }
  
  
  private client!: LookerClient
  private dashboard ?: ILookerDashboard
  private look ?: ILookerLookWithQuery

  private async editDashboard() {
    if (this.dashboard) {
      const {args, flags} = this.parse(Edit)
      if (flags.rename) {
        let ask_name_of_dashboard: IShowRename = await inquirer.prompt([{
          name: 'answer',
          message: 'Enter the new name of the copied Dashboard :',
          type: 'input',
        }])
        const spinner_rename  = ora(`Editing Dashboard`).start()
        try{
          this.dashboard = await this.client.updateDashboard(this.dashboard.id, {title: ask_name_of_dashboard.answer})
        }
        catch(e) {
          spinner_rename.fail()
          console.error('Could not rename resquested content. It may not exist.')
          let show_get_error: IShowChoice = await inquirer.prompt([{
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
      let dashboard_elements = this.dashboard.dashboard_elements
      const choices: IDashboardElementChoice = await inquirer.prompt([{
          name: 'dashboard_element_choices',
          message: `Which tiles do you want to update ?`,
          type: 'checkbox',
          choices: dashboard_elements
            .filter(dashboard_element => dashboard_element.title_text == null)
            .map( dashboard_element => ({value: dashboard_element, name: `[Name: ${dashboard_element.title} ] [Id: ${dashboard_element.id}]`}))
      }])
      const spinner_editing  = ora(`Editing Dashboard`).start()
      if (flags.bulk) {
        if (flags.get_properties) {
          let show_properties: IShowChoice = await inquirer.prompt([{
            name: 'answer',
            message: 'Would you want to see the properties of the first element ?',
            type: 'list',
            choices: [{name: 'yes'}, {name: 'no'}],
          }])
          console.dir(choices.dashboard_element_choices[0].query, { depth: null })
        }
        let ask_changes: IShowChanges = await inquirer.prompt([{
          name: 'answer',
          message: 'Enter the object containing the changes you want to apply on all Tiles selected :',
          type: 'input',
        }])
        
        for (const element of choices.dashboard_element_choices) {
          await this.updateDashboardElement(element, ask_changes, spinner_editing)
        }
        spinner_editing.succeed('Your bulk has been updated !')
      }
      else {
        for (let element of choices.dashboard_element_choices) {
          if (flags.get_properties) {
            let show_properties: IShowChoice = await inquirer.prompt([{
              name: 'answer',
              message: 'Would you want to see the properties of all the elements ?',
              type: 'list',
              choices: [{name: 'yes'}, {name: 'no'}],
            }])
            console.dir(element.query, { depth: null })
          }
          let ask_changes: IShowChanges = await inquirer.prompt([{
            name: 'answer',
            message: 'Enter the object containing the changes you want to apply on all Tiles selected :',
            type: 'input',
          }])
          await this.updateDashboardElement(element, ask_changes, spinner_editing)
        } 
        spinner_editing.succeed('Your Dashboard has been updated !')
      }
    }
  }

  private async updateDashboardElement(element: IDashboardElement, ask_changes: IShowChanges, spinner_editing: ora.Ora) {
    const input_query = JSON.parse(ask_changes.answer)
    let query: ILookerQuery = element.query
    try {
      query = {
        ...query,
        ...input_query,
        can: undefined,
        slug: undefined,
        share_url: undefined,
        expanded_share_url: undefined,
        url: undefined,
        has_table_calculations: undefined,
        client_id: undefined
      }
      const new_query = await this.client.createQuery(query)
      await this.client.updateDashboardElement(element.id, {"query_id": new_query.id})
    }
    catch(e) {
      spinner_editing.fail()
      console.error('Could not edit the Dashboard elements.')
      let show_get_error_edit: IShowChoice = await inquirer.prompt([{
        name: 'answer',
        message: 'Display full error response ?',
        type: 'list',
        choices: [{name: 'yes'}, {name: 'no'}],
      }])
      if(show_get_error_edit.answer === 'yes'){
        console.error(e)
      }
      return
    }
  }
}


export interface IPotentiallyDeletedContent {
  deleted?: boolean
  deleted_at?: Date
  deleter_id?: number
}

export interface IRestoreChoice {
  restore: string
}

export interface IShowChanges {
  answer: string
}

export interface IShowChoice {
  answer: string
}

export interface IRestoreFolderChoice {
  id: number
}

export interface IDashboardElementChoice {
    dashboard_element_choices: IDashboardElement[]
  }

export interface IShowRename {
  answer: string
}