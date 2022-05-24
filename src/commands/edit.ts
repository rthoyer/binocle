import {Command, flags} from '@oclif/command'
import ora from 'ora'
import LookerClient, { IDashboardElement, ILookerDashboard, ILookerLook, ILookerLookWithQuery, ILookerQuery } from '../client/client'
import inquirer from 'inquirer'
import { string } from '@oclif/parser/lib/flags'

export default class Edit extends Command {
  static description = 'Edits a Dashboard or a Look query elements.'

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
    edit_dashboard_properties: flags.boolean({
      char: 'e',
      description: 'Allows to edit the properties of the dashboard before editing the dashboard elements. (Ex : Edit filters)',
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
  
  private client!: LookerClient
  private dashboard ?: ILookerDashboard
  private look ?: ILookerLookWithQuery
  private dashboard_looks ?: ILookerLookWithQuery[] = []

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
        spinner_edit_content.succeed('Dashboard : ' + this.dashboard.title + '(#' +  this.dashboard.id + ') found !')
      }
      else {
        this.look = await this.client.getLook(args.id)
        spinner_edit_content.succeed('Dashboard : ' + this.look.title + '(#' +  this.look.id + ') found !')
      }
    }
    catch(e) {
      spinner_edit_content.fail()
      console.error('Could not find resquested content. It may not exist.')
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
    if (this.dashboard) {
      await this.editDashboard()
    }
    else if(this.look) {
      await this.editLook()
    }
  }

  private async editDashboard() {
    if (this.dashboard) {
      const {args, flags} = this.parse(Edit)
      if (flags.rename) {
        let ask_name_of_dashboard: IShowRename = await inquirer.prompt([{
          name: 'answer',
          message: 'Enter the new name of this Dashboard :',
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
        spinner_rename.succeed("Dashboard renamed !")
      }
      if (flags.edit_dashboard_properties) {
        if (flags.get_properties) {
          let show_properties: IShowChoice = await inquirer.prompt([{
            name: 'answer',
            message: 'Would you like to see all the properties of the dashboard ?',
            type: 'list',
            choices: [{name: 'yes'}, {name: 'no'}],
          }])
          if (show_properties.answer == 'yes') {
            console.dir(this.dashboard, { depth: 4 })
          }
        }
        let ask_properties: IShowRename = await inquirer.prompt([{
          name: 'answer',
          message: 'Enter the properties object for this Dashboard :',
          type: 'input',
        }])
        const spinner_edit  = ora(`Editing Dashboard`).start()
        try{
          this.dashboard = await this.client.updateDashboard(this.dashboard.id, JSON.parse(ask_properties.answer))
        }
        catch(e) {
          spinner_edit.fail()
          console.error('Could not edit resquested content. There might be an issue with the body object you gave.')
          let show_get_error: IShowChoice = await inquirer.prompt([{
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
        spinner_edit.succeed("Dashboard edited !")
      }
      let dashboard_elements = this.dashboard.dashboard_elements
      for (const element of dashboard_elements) {
        if (element.look_id){
          try{
            const look = await this.client.getLook(element.look_id)
            this.dashboard_looks?.push(look)
          }
          catch(e){
            console.error(e)
            return
          }
        }
      }
      const choices: IDashboardElementChoice = await inquirer.prompt([{
          name: 'dashboard_element_choices',
          message: `Which tiles do you want to update ?`,
          type: 'checkbox',
          choices: dashboard_elements
            .filter(dashboard_element => dashboard_element.title_text == null && dashboard_element.look_id == null)
            .map( dashboard_element => ({value: dashboard_element, name: `[Name: ${dashboard_element.title} ] [Id: ${dashboard_element.id}]`}))
      }])
      let look_choices: IDashboardLookChoice = {dashboard_look_choices: []}
      if (this.dashboard_looks) {   
        look_choices = await inquirer.prompt([{
          name: 'dashboard_look_choices',
          message: `Your Dashboard also contains Looks linked to it. Which look would you like to edit ?`,
          type: 'checkbox',
          choices: this.dashboard_looks
            .map( dashboard_look => ({value: dashboard_look, name: `[Name: ${dashboard_look.title} ] [Id: ${dashboard_look.id}]`}))
        }])
      }
      const spinner_editing  = ora(`Editing Dashboard`)
      if (flags.bulk) {
        if (flags.get_properties) {
          let show_properties: IShowChoice = await inquirer.prompt([{
            name: 'answer',
            message: 'Would you like to see the properties of the first element ?',
            type: 'list',
            choices: [{name: 'yes'}, {name: 'no'}],
          }])
          if (show_properties.answer == 'yes') {
            console.dir(choices.dashboard_element_choices[0].query, { depth: null })
          }
        }
        let ask_changes: IShowChanges = await inquirer.prompt([{
          name: 'answer',
          message: 'Enter the object containing the changes you want to apply on all Tiles selected :',
          type: 'input',
        }])
        spinner_editing.start()
        for (const element of choices.dashboard_element_choices) {
          await this.updateElementQuery(element, ask_changes, spinner_editing)
        }
        for (const look of look_choices.dashboard_look_choices) {
          await this.updateElementQuery(look, ask_changes, spinner_editing)
        }
        spinner_editing.succeed('Your bulk has been updated !')
      }
      else {
        for (let element of choices.dashboard_element_choices) {
          if (flags.get_properties) {
            let show_properties: IShowChoice = await inquirer.prompt([{
              name: 'answer',
              message: 'Would you want to see the properties of the element : ' + element.title + '?',
              type: 'list',
              choices: [{name: 'yes'}, {name: 'no'}],
            }])
            if (show_properties.answer == 'yes') {
              console.dir(element.query, { depth: null })
            }
          }
          let ask_changes: IShowChanges = await inquirer.prompt([{
            name: 'answer',
            message: 'Enter the object containing the changes you want to apply on the element' + element.title + ':',
            type: 'input',
          }])
          await this.updateElementQuery(element, ask_changes, spinner_editing)
        }
        for (let look of look_choices.dashboard_look_choices) {
          if (flags.get_properties) {
            let show_properties: IShowChoice = await inquirer.prompt([{
              name: 'answer',
              message: 'Would you want to see the properties of all the elements ?',
              type: 'list',
              choices: [{name: 'yes'}, {name: 'no'}],
            }])
            if (show_properties.answer == 'yes') {
              console.dir(look.query, { depth: null })
            }
          }
          let ask_changes: IShowChanges = await inquirer.prompt([{
            name: 'answer',
            message: 'Enter the object containing the changes you want to apply this element :',
            type: 'input',
          }])
          await this.updateElementQuery(look, ask_changes, spinner_editing)
        }
        spinner_editing.succeed('Your Dashboard Looks have been updated !')
      }
    }
  }

  private async editLook() {
    if (this.look) {
      const {args, flags} = this.parse(Edit)
      const spinner_editing  = ora(`Editing Look`)
      if (flags.get_properties) {
        let show_properties: IShowChoice = await inquirer.prompt([{
          name: 'answer',
          message: 'Would you want to see the properties of this Look ?',
          type: 'list',
          choices: [{name: 'yes'}, {name: 'no'}],
        }])
        if (show_properties.answer == 'yes') {
          console.dir(this.look.query, { depth: null })
        }
      }
      let ask_changes: IShowChanges = await inquirer.prompt([{
        name: 'answer',
        message: 'Enter the object containing the changes you want to apply on this Look :',
        type: 'input',
      }])
      spinner_editing.start()
      await this.updateElementQuery(this.look, ask_changes, spinner_editing)
      spinner_editing.succeed('Your Look has been updated !')
    }
  }

  private async updateElementQuery(element: IDashboardElement|ILookerLookWithQuery, ask_changes: IShowChanges, spinner_editing: ora.Ora) {
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
      if (this.dashboard) {
        await this.client.updateDashboardElement(element.id, {"query_id": new_query.id})
      }
      else {
        await this.client.updateLook(element.id, {"query_id": new_query.id})
      }
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

export interface IShowChanges {
  answer: string
}

export interface IShowChoice {
  answer: string
}

export interface IDashboardElementChoice {
  dashboard_element_choices: IDashboardElement[]
}

export interface IDashboardLookChoice {
  dashboard_look_choices: ILookerLookWithQuery[]
}

export interface IShowRename {
  answer: string
}