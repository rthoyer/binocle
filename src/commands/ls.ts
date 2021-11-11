import {Command, flags} from '@oclif/command'
import LookerClient, { ILookerFolder } from '../client/client'
import ora from 'ora'
import open from 'open'
import nodeHtmlToImage from 'node-html-to-image'
import Handlebars from 'handlebars'

export default class Listing extends Command {
  static description = 'Lists the content of the selected folder and its subfolders'
  static examples = [
    `$ binocle ls 123 -d 2
📁 Folder A #123 (D:0 - L:0)
|   📁 Folder B #145 (D:0 - L:2)
|   |   📁 Folder D #547 (D:0 - L:3)
|   📁 Folder C #156 (D:1 - L:7)
`,
  ]
  public static page_limit = 50
  public static font_size = 50

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
    image: flags.boolean({
      char: 'i',
      default: false,
      description: 'Creates an image of the listing in the current directory',
    }),
    depth: flags.string({
      char: 'd',
      default: '2',
      description: 'Sets the subfolders depth to display. Unlimited depth : -1',
    }),
    show_content: flags.boolean({
      default: false,
      description: 'Displays Looks and Dashboards in the listing',
    }),
  }

  static args = [
    {
      name: 'folder_id',
      default: '1',
    },
  ]

  async run() {
    const {args, flags} = this.parse(Listing)
    this.debug('[args: %o] [flags: %o]', args, {image: flags.image, level: flags.depth})
    this.client = new LookerClient({
      client_id: flags.client_id,
      client_secret: flags.client_secret,
      base_url: flags.base_url,
    })

    await this.client.auth()
    const spinner_main_folder = ora(`Searching for folder ${args.folder_id}`).start()
    var main_folder: ILookerFolder
    try {
      main_folder = await this.client.getFolder(args.folder_id)
      spinner_main_folder.succeed(`Folder ${Listing.contentLinkFromId(flags.base_url, args.folder_id,'folder')} (${main_folder.name}) found`)
      var folder_org: IFolderOrganisation = {
        children: [],
        dashboards: main_folder.dashboards.length,
        dashboards_array: main_folder.dashboards.map((dashboard) => ({name : dashboard.title, id: dashboard.id.toString()})),
        depth: 0,
        id: main_folder.id, 
        looks: main_folder.looks.length,
        looks_array: main_folder.looks.map((look) => ({name : look.title, id: look.id.toString()})),
        name: main_folder.name,
      }
      const spinner_subfolders = ora(`Searching for subfolders`).start()
      try {
        await this.getSubFolders(args.folder_id,1,parseInt(flags.depth),folder_org.children, flags.show_content)
        spinner_subfolders.succeed(`Subfolders found`)
        if(flags.image){
          const spinner_image_export  = ora(`Exporting the image in the current folder ${process.cwd()}`).start()
          try {
            const filename = `${process.cwd()}/binocle_ls_${args.folder_id}_${Date.now()}.png`
            Handlebars.registerPartial('child',
            `📁 {{name}} #{{id}} (D:{{dashboards}} - L:{{looks}})
            <div>
              {{#each children}}
                {{> child}}
              {{/each}}
            </div>`)
            await nodeHtmlToImage({
              output: filename,
              html: `
              <html>
                <head>
                  <link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css" rel="stylesheet">
                  <style>body { padding: 15px; }</style>
                  <style>div { border-left: 1px solid black; padding-left: 10px; }</style>
              </head>
              <body>
                  📁 {{name}} #{{id}} (D:{{dashboards}} - L:{{looks}})
                  <div>
                  {{#each children}}
                    {{> child}}
                  {{/each}}
                  </div>
              </body>
              </html>`,
              content: folder_org,
              transparent: true
            })
            spinner_image_export.succeed(`Image exported as ${filename}`)
            await open(filename)
          }
          catch(e) {
            spinner_image_export.fail()
            console.error(e)
          }
        }
        this.printListing(folder_org, parseInt(flags.depth),flags.base_url, flags.show_content)
      }
      catch(e) {
        spinner_subfolders.fail()
        console.error(e)
      }
    }
    catch(e) {
      spinner_main_folder.fail()
      console.error(e)
    }
  }

  public async getSubFolders(folder_id: string, depth: number, max_depth: number, org: IFolderOrganisation[], fetch_content: boolean): Promise<void>{
    var page = 1
    var children = await this.client.getFolderChildren(folder_id, {page: page, per_page: Listing.page_limit})
    while (children.length == page*Listing.page_limit){
      page++
      children.push(...await this.client.getFolderChildren(folder_id, {page: page, per_page: Listing.page_limit}))
    }
    for (const child of children){
      var grandchildren: IFolderOrganisation[] = []
      if(depth + 1 <= max_depth || max_depth === -1){
        await this.getSubFolders(child.id, depth + 1, max_depth, grandchildren, fetch_content)
      }
      const content: IContent = {}
      if (fetch_content){
        var current_folder = await this.client.getFolder(folder_id)
        content.looks_array = current_folder.looks.map((look) => ({name : look.title, id: look.id.toString()}))
        content.dashboards_array = current_folder.dashboards.map((dashboard) => ({name : dashboard.title, id: dashboard.id.toString()}))
      }
      org.push({
        children: grandchildren,
        dashboards: child.dashboards.length,
        depth: depth,
        id: child.id,
        looks: child.looks.length,
        name: child.name,
        ...content
      })
    }
  }

  public printListing(org: IFolderOrganisation, max_depth: number, base_url: string, fetch_content: boolean){
    this.log(`${"|   ".repeat(org.depth)}📁 ${org.name} ${Listing.contentLinkFromId(base_url,org.id,'folder')} ${org.depth ===  max_depth ? '' : ` (D:${org.dashboards} - L:${org.looks})`}`)
    for (const child of org.children){
      this.printListing(child, max_depth, base_url, fetch_content)
    }
    if (fetch_content && org.looks_array && org.dashboards_array && org.depth !==  max_depth){
      for (const dashboard of org.dashboards_array){
        this.log(`${"|   ".repeat(org.depth + 1)}📊 ${dashboard.name} ${Listing.contentLinkFromId(base_url,dashboard.id,'dashboard')}`)
      }
      for (const look of org.looks_array){
        this.log(`${"|   ".repeat(org.depth + 1)}👁  ${look.name} ${Listing.contentLinkFromId(base_url,look.id,'look')}`)
      }
    }
  }

  public static contentLinkFromId(base_url: string,id: string, type: looker_content){
    return `\x1B]8;;${base_url}/${type}s/${id}\x1B\\#${id}\x1B]8;;\x1B\\`
  }

  private client!: LookerClient
}

export interface IFolderOrganisation {
  children: IFolderOrganisation[]
  dashboards: number
  dashboards_array?: IContentInfos[]
  depth: number
  id: string
  looks: number
  looks_array?: IContentInfos[]
  name: string
}

export interface IContent {
  dashboards_array?: IContentInfos[]
  looks_array?: IContentInfos[]
}

export type looker_content = 'folder' | 'look' | 'dashboard'

export interface IContentInfos {
  name: string
  id: string
}
