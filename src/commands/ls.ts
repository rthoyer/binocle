import {Command, flags} from '@oclif/command'
import LookerClient, { ILookerFolder } from '../client/client'
import ora from 'ora'
import { createCanvas, loadImage, NodeCanvasRenderingContext2D } from 'canvas'
import fs from 'fs'
import open from 'open'

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
          try {
            const canvas = createCanvas(200,200)
            const canvas_context = canvas.getContext("2d")
            canvas_context.font = `${Listing.font_size.toString()}px Arial`
            canvas_context.textAlign = 'left'
            const { width, lines } = this.getCanvasSize(folder_org, parseInt(flags.depth), 0, 0, canvas_context)
            canvas_context.canvas.width = width + 2 * Listing.font_size
            canvas_context.canvas.height = Listing.font_size * (lines + 2) 
            canvas_context.font = `${Listing.font_size.toString()}px Arial`
            this.writeListingInCanvas(folder_org, parseInt(flags.depth), 0, canvas_context, flags.base_url)
            const buffer = canvas.toBuffer()
            const filename = `${process.cwd()}/binocle_ls_${args.folder_id}_${Date.now()}.png`
            fs.writeFileSync(filename, buffer)
            spinner_image_export.succeed(`Image exported as ${filename}`)
            await open(filename)
          }
          catch(e) {
            spinner_image_export.fail()
            console.error(e)
          }
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

  public printListing(org: IFolderOrganisation, max_depth: number, base_url: string){
    this.log(`${"|   ".repeat(org.depth)}📁 ${org.name} ${Listing.contentLinkFromId(base_url,org.id,'folder')} ${org.depth ===  max_depth ? '' : ` (D:${org.dashboards} - L:${org.looks})`}`)
    for (const child of org.children){
      this.printListing(child, max_depth, base_url)
    }
  }

  public getCanvasSize(org: IFolderOrganisation, max_depth: number, width: number, lines: number , canvas_context: NodeCanvasRenderingContext2D){
    const line_width = canvas_context.measureText(`${"|   ".repeat(org.depth)}📁 ${org.name} #${org.id} ${org.depth ===  max_depth ? '' : ` (D:${org.dashboards} - L:${org.looks})`}`).width
    let max_width = line_width>width ? line_width : width
    let total_lines = lines + 1
    for (const child of org.children){
      const {width: new_width, lines: new_lines} = this.getCanvasSize(child, max_depth, max_width, total_lines, canvas_context)
      max_width = new_width
      total_lines = new_lines
    }
    return { width : max_width, lines : total_lines}
  }

  public writeListingInCanvas(org: IFolderOrganisation, max_depth: number, line: number, canvas_context: NodeCanvasRenderingContext2D, base_url: string){
    let new_line = line + 1
    canvas_context.fillText(
      `${"|   ".repeat(org.depth)}📁 ${org.name} #${org.id} ${org.depth ===  max_depth ? '' : ` (D:${org.dashboards} - L:${org.looks})`}`,
      Listing.font_size,
      Listing.font_size * (new_line + 1),
    )
    for (const child of org.children){
      new_line = this.writeListingInCanvas(child, max_depth, new_line, canvas_context, base_url)
    }
    return new_line
  }

  public static contentLinkFromId(base_url: string,id: string, type: looker_content){
    return `\x1B]8;;${base_url}/${type}s/${id}\x1B\\#${id}\x1B]8;;\x1B\\`
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