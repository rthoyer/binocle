import {Command, flags} from '@oclif/command'
import ora from 'ora'
import LookerClient, { ILookerScheduledPlan } from '../client/client'
import inquirer from 'inquirer'

export default class Pause extends Command {
  static description = 'Gets all schedules of a Look/Dashboard and enables pausing/unpausing them. NB: if any runs were skipped while it was paused, it will run once after being unpaused.'
  static aliases = ['schedule:pause']
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
    revert: flags.boolean({
      char: 'r',
      description: 'Revert: displays paused schedules and enabling unpausing them',
      default: false
    }),
  }

  static args = [
    {
      name: 'content_id',
      required: true,
    },
    {
      name: 'type',
      default: 'l',
      description: 'look (l) or dashboard (d)',
      options: ['l', 'd']
    },
    {
      name: 'user_id',
      description: 'If no user_id is provided defaults to the API3 Key owner',
      required: false,
    },
  ]

  async run() {
    const {args, flags} = this.parse(Pause)
    this.debug('[args: %o]', args)
    this.client = new LookerClient({
      client_id: flags.client_id,
      client_secret: flags.client_secret,
      base_url: flags.base_url,
    })
    await this.client.auth()
    let schedules : ILookerScheduledPlan[] = []
    const spinner_get_schedules  = ora(`Fetching Content schedules`).start()
    try {
      if (args.type === 'l'){
      schedules = await this.client.getScheduledPlansForLook(args.content_id, ( args?.user_id ?{ user_id: args.user_id} : {}))
      spinner_get_schedules.succeed()
      }
      else {
        schedules = await this.client.getScheduledPlansForDashboard(args.content_id, ( args?.user_id ?{ user_id: args.user_id} : {}))
        spinner_get_schedules.succeed()
      }
    }
    catch(e) {
      spinner_get_schedules.fail()
      console.error('Failed to find schedules for this content.')
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
    if(schedules.filter(schedule => schedule.enabled !== flags.revert).length === 0){
      this.log(`No ${flags.revert ? 'paused' : 'enabled'} schedules for this content`)
    }
    else {
      const choices: IScheduleChoice = await inquirer.prompt([{
        name: 'schedule_choices',
        message: `Which ${flags.revert ? 'paused' : 'enabled'} schedule do you want to ${flags.revert ? 'un' : ''}pause ?`,
        type: 'checkbox',
        choices: schedules
          .filter(schedule => schedule.enabled !== flags.revert)
          .map( schedule => ({value: schedule, name: `[Status: ${schedule.enabled ? '✅' : '⏸'} ] [Id: ${schedule.id}] [Name: ${schedule?.name}] [Title: ${schedule?.title}] [Crontab: ${schedule?.crontab}] [Type: ${JSON.stringify(schedule?.scheduled_plan_destination.map(dest => dest?.type).join())}] [Recipients: ${JSON.stringify(schedule?.scheduled_plan_destination.map(dest => dest?.address).join())}]`}))
      }])
      const spinner_pausing_schedule  = ora(`${flags.revert ? 'Unp' : 'P'}ausing schedule`).start()
      try {
        for (const schedule in choices.schedule_choices){
          const data = await this.client.updateScheduledPlan(choices.schedule_choices[schedule].id, {enabled: flags.revert})
          spinner_pausing_schedule.stopAndPersist({text: `${flags.revert ? 'Unp' : 'P'}aused schedule ${choices.schedule_choices[schedule].id}`})
        }
        spinner_pausing_schedule.succeed(`Schedules ${flags.revert ? 'un' : ''}paused`)
      }
      catch(e) {
        spinner_pausing_schedule.fail()
        console.error(`Failed to ${flags.revert ? 'un' : ''}pause this schedule.`)
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
    }
  }
  
  private client!: LookerClient
}

export interface IScheduleChoice {
  schedule_choices: ILookerScheduledPlan[]
}

export interface IShowErrorChoice {
  answer: string
}
