import {Command, flags} from '@oclif/command'
import LookerClient, { ILookerFolder } from '../client/client'
import ora from 'ora'

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
      spinner_main_folder.succeed(`Folder ${Listing.contentLinkFromId(args.folder_id,'folder')} (${main_folder.name}) found`)
      var folder_org: IFolderOrganisation = {
        children: [],
        dashboards: main_folder.dashboards.length,
        depth: 0,
        id: main_folder.id, 
        looks: main_folder.looks.length,
        name: main_folder.name,
      }
      const spinner_subfolders = ora(`Searching for subfolders`).start()
      try {
        await this.getSubFolders(args.folder_id,1,parseInt(flags.depth),folder_org.children)
        spinner_subfolders.succeed(`Subfolders found`)
        if(flags.image){
          const spinner_image_export  = ora(`Exporting the image in the current folder ${process.cwd()}`).start()
          spinner_image_export.succeed(`Image exported as ${process.cwd()}/binocle_ls_${args.folder_id}_${Date.now()}.png`)
        }
        this.printListing(folder_org, parseInt(flags.depth),flags.base_url)
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

  public async getSubFolders(folder_id: string, depth: number, max_depth: number, org: IFolderOrganisation[]): Promise<void>{
    var page = 1
    var children = await this.client.getFolderChildren(folder_id, {page: page, per_page: Listing.page_limit})
    while (children.length == page*Listing.page_limit){
      page++
      children.push(...await this.client.getFolderChildren(folder_id, {page: page, per_page: Listing.page_limit}))
    }
    for (const child of children){
      var grandchildren: IFolderOrganisation[] = []
      if(depth + 1 <= max_depth || max_depth === -1){
        await this.getSubFolders(child.id, depth + 1, max_depth, grandchildren)
      }
      org.push({
        children: grandchildren,
        dashboards: child.dashboards.length,
        depth: depth,
        id: child.id,
        looks: child.looks.length,
        name: child.name,
      })
    }
  }

  public printListing(org: IFolderOrganisation, max_depth: number, link_url: string){
    this.log(`${"|   ".repeat(org.depth)}📁 ${org.name} ${Listing.contentLinkFromId(org.id,'folder')} ${org.depth ===  max_depth ? '' : ` (D:${org.dashboards} - L:${org.looks})`}`)
    for (const child of org.children){
      this.printListing(child, max_depth,link_url)
    }
  }

  public static contentLinkFromId(id: string, type: looker_content){
    return `\x1B]8;;${this.flags.base_url}/${type}s/${id}\x1B\\#${id}\x1B]8;;\x1B\\`
  }

  private client!: LookerClient
}

export interface IFolderOrganisation {
  children: IFolderOrganisation[]
  dashboards: number
  depth: number
  id: string
  looks: number
  name: string
}

export type looker_content = 'folder' | 'look' | 'dashboard'