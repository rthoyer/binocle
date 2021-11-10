import axios, {AxiosResponse, AxiosInstance} from 'axios'
import debug from 'debug'
import https from 'https'
import {stringify} from 'qs'
import ora from 'ora'

export class LookerClient {
  constructor(account: ILookerAccount, agent?: https.Agent) {
    this.account = account
    this.agent = axios.create({httpsAgent: agent, withCredentials: true})
    this.agent.interceptors.request.use(request => {
      if (request.headers && this.access_token) {
        request.headers.Authorization = this.access_token
      }
      return request
    })
  }

  private access_token?: string

  public agent: AxiosInstance

  public readonly account: ILookerAccount

  public async auth(): Promise<ILookerAuth | undefined> {
    const spinner_auth = ora('Looker Authentication').start()
    try {
      const {data} = await this.agent.post<ILookerAuth>(`${this.account.base_url}/api/4.0/login?${stringify({
        client_id: this.account.client_id,
        client_secret: this.account.client_secret,
      })}`)
      this.access_token = `token ${data.access_token}`
      spinner_auth.succeed()
      return data
    } catch (e) {
      spinner_auth.fail()
      console.error(e)
    }
  }

  public async getFolder(folder_id: string): Promise<ILookerFolder> {
    const {data} = await this.agent.get<ILookerFolder>(`${this.account.base_url}/api/4.0/folders/${folder_id}`)
    return data
  }

  public async getFolderChildren(folder_id: string, opts?: ILookerFolderChildrenOptions): Promise<ILookerFolder[]> {
    const {data} = await this.agent.get<ILookerFolder[]>(`${this.account.base_url}/api/4.0/folders/${folder_id}/children?${stringify(opts)}`)
    return data
  }
}

export interface ILookerAccount {
  client_id: string;
  client_secret: string;
  base_url: string;
}

export interface ILookerAuth {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface ILookerFolder {
  name: string;
  parent_id: string | null;
  id: string;
  content_metadata_id: number;
  created_at: string;
  creator_id: string | null;
  external_id: string;
  is_embed: boolean;
  is_embed_shared_root: boolean;
  is_embed_users_root: boolean;
  is_personal: boolean;
  is_personal_descendant: boolean;
  is_shared_root: boolean;
  is_users_root: boolean;
  child_count: number;
  dashboards: ILookerDashboardBase[];
  looks: ILookerLook[];
  can: object;
}

export interface ILookerDashboardBase {
  can: object;
  content_favorite_id: number;
  content_metadata_id: number;
  description: string;
  hidden: boolean;
  id: string;
  model: ILookerModel;
  query_timezone: string;
  readonly: boolean;
  refresh_interval: string;
  refresh_interval_to_i: number;
  folder: ILookerFolderBase;
  title: string;
  user_id: number;
  slug: string;
  preferred_viewer: string;
  space: ILookerSpaceBase;
}

export interface ILookerModel {
  id: string;
  label: string;
}

export interface ILookerFolderBase {
  name: string;
  parent_id: string;
  id: string;
  content_metadata_id: number;
  created_at: Date;
  creator_id: number;
  child_count: number;
  external_id: string;
  is_embed: boolean;
  is_embed_shared_root: boolean;
  is_embed_users_root: boolean;
  is_personal: boolean;
  is_personal_descendant: boolean;
  is_shared_root: boolean;
  is_users_root: boolean;
  can: object;
}

export interface ILookerSpaceBase {
  name: string;
  parent_id: string;
  id: string;
  content_metadata_id: number;
  created_at: Date;
  creator_id: number;
  child_count: number;
  external_id: string;
  is_embed: boolean;
  is_embed_shared_root: boolean;
  is_embed_users_root: boolean;
  is_personal: boolean;
  is_personal_descendant: boolean;
  is_shared_root: boolean;
  is_users_root: boolean;
  can: object;
}

export interface ILookerLook {
  can: object;
  content_metadata_id: number;
  id: number;
  title: string;
  content_favorite_id: number;
  created_at: Date;
  deleted: boolean;
  deleted_at: Date;
  deleter_id: number;
  description: string;
  embed_url: string;
  excel_file_url: string;
  favorite_count: number;
  google_spreadsheet_formula: string;
  image_embed_url: string;
  is_run_on_load: boolean;
  last_accessed_at: Date;
  last_updater_id: number;
  last_viewed_at: Date;
  model: ILookerModel;
  public: boolean;
  public_slug: string;
  public_url: string;
  query_id: number;
  short_url: string;
  folder: ILookerFolderBase;
  folder_id: string;
  updated_at: Date;
  user_id: number;
  view_count: number;
  user: ILookerUserIdOnly;
  space_id: string;
  space: ILookerSpaceBase;
  dashboards: ILookerDashboardBase[];
}

export interface ILookerUserIdOnly {
  id: number;
}

export interface ILookerFolderChildrenOptions {
  fields?: string;
  page?: number;
  per_page?: number;
  sorts?: string;
}

export default LookerClient
