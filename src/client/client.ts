import axios, { AxiosInstance } from 'axios'
import https from 'https'
import { stringify } from 'qs'
import ora from 'ora'

export class LookerClient {
  constructor(account: ILookerAccount, agent?: https.Agent) {
    this.account = account
    this.prefix = `${this.account.base_url}/api/4.0`
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

  public prefix: string

  public readonly account: ILookerAccount

  public async auth(): Promise<ILookerAuth | any> {
    const spinner_auth = ora('Looker Authentication').start()
    try {
      const { data } = await this.agent.post<ILookerAuth>(`${this.prefix}/login?${stringify({
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
    const { data } = await this.agent.get<ILookerFolder>(`${this.prefix}/folders/${folder_id}`)
    return data
  }

  public async createContentMetadataAccesses(body: Partial<ILookerContentMetaGroupUser>): Promise<ILookerContentMetaGroupUser> {
    const { data } = await this.agent.post<ILookerContentMetaGroupUser>(`${this.prefix}/content_metadata_access`, body)
    return data
  }

  public async updateContentMetadataAccesses(content_metadata_access_id: string, body: Partial<ILookerContentMetaGroupUser>): Promise<ILookerContentMetaGroupUser> {
    const { data } = await this.agent.put<ILookerContentMetaGroupUser>(`${this.prefix}/content_metadata_access/${content_metadata_access_id}`, body)
    return data
  }

  public async getAllContentMetadataAccesses(content_metadata_id: number, fields?: string[]): Promise<ILookerContentMetaGroupUser[]> {
    const { data } = await this.agent.get<ILookerContentMetaGroupUser[]>(`${this.prefix}/content_metadata_access${stringify({content_metadata_id, fields})}`)
    return data
  }

  public async getFolderChildren(folder_id: string, opts?: ILookerFolderChildrenOptions): Promise<ILookerFolder[]> {
    const { data } = await this.agent.get<ILookerFolder[]>(`${this.prefix}/folders/${folder_id}/children?${stringify(opts)}`)
    return data
  }

  public async getLook(id: string): Promise<ILookerLookWithQuery> {
    const { data } = await this.agent.get<ILookerLookWithQuery>(`${this.prefix}/looks/${id}`)
    return data
  }

  public async updateLook(id: string, opts: object): Promise<ILookerLookWithQuery> {
    const { data } = await this.agent.patch<ILookerLookWithQuery>(`${this.prefix}/looks/${id}?${stringify(opts)}`,opts)
    return data
  }

  public async moveLook(opts: ILookMovementOptions): Promise<ILookerLookWithQuery> {
    const { data } = await this.agent.patch<ILookerLookWithQuery>(`${this.prefix}/looks/${opts.look_id}/move?${stringify(opts)}`,opts)
    return data
  }

  public async copyLook(opts: ILookMovementOptions): Promise<ILookerLookWithQuery> {
    const { data } = await this.agent.post<ILookerLookWithQuery>(`${this.prefix}/looks/${opts.look_id}/copy?${stringify(opts)}`,opts)
    return data
  }

  public async getDashboard(id: string): Promise<ILookerDashboard> {
    const { data } = await this.agent.get<ILookerDashboard>(`${this.prefix}/dashboards/${id}`)
    return data
  }

  public async updateDashboard(id: string, opts: object): Promise<ILookerDashboard> {
    const { data } = await this.agent.patch<ILookerDashboard>(`${this.prefix}/dashboards/${id}?${stringify(opts)}`,opts)
    return data
  }

  public async moveDashboard(opts: IDashboardMovementOptions): Promise<ILookerDashboard> {
    const { data } = await this.agent.patch<ILookerDashboard>(`${this.prefix}/dashboards/${opts.dashboard_id}/move?${stringify(opts)}`,opts)
    return data
  }

  public async copyDashboard(opts: IDashboardMovementOptions): Promise<ILookerDashboard> {
    const { data } = await this.agent.post<ILookerDashboard>(`${this.prefix}/dashboards/${opts.dashboard_id}/copy?${stringify(opts)}`,opts)
    return data
  }

  public async getScheduledPlansForLook(id: string, opts: object): Promise<ILookerScheduledPlan[]> {
    const { data } = await this.agent.get<ILookerScheduledPlan[]>(`${this.prefix}/scheduled_plans/look/${id}?${stringify(opts)}`,opts)
    return data
  }

  public async getScheduledPlansForDashboard(id: string, opts: object): Promise<ILookerScheduledPlan[]> {
    const { data } = await this.agent.get<ILookerScheduledPlan[]>(`${this.prefix}/scheduled_plans/dashboard/${id}?${stringify(opts)}`,opts)
    return data
  }

  public async updateScheduledPlan(id: number, opts: object): Promise<ILookerScheduledPlan[]> {
    const { data } = await this.agent.patch<ILookerScheduledPlan[]>(`${this.prefix}/scheduled_plans/${id}`,opts)
    return data
  }

  public async updateDashboardElement(dashboard_id: string, opts: object): Promise<IDashboardElement> {
    const { data } = await this.agent.patch<IDashboardElement>(`${this.prefix}/dashboard_elements/${dashboard_id}?${stringify(opts)}`,opts)
    return data
  }
  
  public async createQuery(opts: object): Promise<ILookerQuery> {
    const { data } = await this.agent.post<ILookerQuery>(`${this.prefix}/queries`,opts)
    return data
  }
}

export interface ILookerAccount {
  client_id: string
  client_secret: string
  base_url: string
}

export interface ILookerAuth {
  access_token: string
  expires_in: number
  token_type: string
}

export interface ILookMovementOptions {
  look_id: string
  folder_id: string
}

export interface IDashboardMovementOptions {
  dashboard_id: string
  folder_id: string
}

export interface ILookerFolder {
  name: string
  parent_id: string | null
  id: string
  content_metadata_id: number
  created_at: string
  creator_id: string | null
  external_id: string
  is_embed: boolean
  is_embed_shared_root: boolean
  is_embed_users_root: boolean
  is_personal: boolean
  is_personal_descendant: boolean
  is_shared_root: boolean
  is_users_root: boolean
  child_count: number
  dashboards: ILookerDashboardBase[]
  looks: ILookerLook[]
  can: object
}

export interface ILookerContentMetaGroupUser {
  can: object
  id: string
  content_metadata_id: number
  permission_type: string
  group_id: string
  user_id: string
}

export interface ILookerDashboardBase {
  can: object
  content_favorite_id: number
  content_metadata_id: number
  description: string
  hidden: boolean
  id: string
  model: ILookerModel
  query_timezone: string
  readonly: boolean
  refresh_interval: string
  refresh_interval_to_i: number
  folder: ILookerFolderBase
  title: string
  user_id: number
  slug: string
  preferred_viewer: string
  space: ILookerSpaceBase
}

export interface ILookerDashboard extends ILookerDashboardBase {
  alert_sync_with_dashboard_filter_enabled: boolean
  background_color: string
  created_at: Date
  crossfilter_enabled: boolean
  dashboard_elements: IDashboardElement[]
  dashboard_filters: IDashboardFilter[]
  dashboard_layouts: IDashboardLayout[]
  deleted: boolean
  deleted_at: Date
  deleter_id: number
  edit_uri: string
  favorite_count: number
  filters_bar_collapsed: boolean
  last_accessed_at: Date
  last_viewed_at: Date
  updated_at: Date
  last_updater_id: number
  last_updater_name: Date
  user_name: string
  load_configuration: string
  lookml_link_id: string
  show_filters_bar: boolean
  show_title: boolean
  folder_id: string
  text_tile_text_color: string
  tile_background_color: string
  tile_text_color: string
  title_color: string
  view_count: number
  appearance: IDashboardAppearance
  url: string
}

export interface IDashboardElement {
  can: object
  body_text: string
  body_text_as_html: string
  dashboard_id: string
  edit_uri: string
  id: string
  look: ILookerLookWithQuery
  look_id: string
  lookml_link_id: string
  merge_result_id: string
  note_display: string
  note_state: string
  note_text: string
  note_text_as_html: string
  query: ILookerQuery
  query_id: number
  refresh_interval: string
  refresh_interval_to_i: number
  result_maker: IResultMakerWithIdVisConfigAndDynamicFields
  result_maker_id: number
  subtitle_text: string
  title: string
  title_hidden: boolean
  title_text: string
  type: string
  alert_count: number
  title_text_as_html: string
  subtitle_text_as_html: string
}

export interface IResultMakerWithIdVisConfigAndDynamicFields {
  id: number
  dynamic_fields: string
  filterables: IResultMakerFilterables[]
  sorts: string[]
  merge_result_id: string
  total: boolean
  query_id: number
  sql_query_id: string
  query: ILookerQuery
  vis_config: object
}

export interface IResultMakerFilterables {
  model: string
  view: string
  name: string
  listen: IResultMakerFilterablesListen
}

export interface IResultMakerFilterablesListen {
  dashboard_filter_name: string
  field: string
}

export interface IDashboardFilter {
  can: object
  id: string
  dashboard_id: string
  name: string
  title: string
  type: string
  default_value: string
  model: string
  explore: string
  dimension: string
  field: object
  row: number
  listens_to_filters: string[]
  allow_multiple_values: boolean
  required: boolean
  ui_config: object
}

  export interface IDashboardLayout {
    can: object
    id: string
    dashboard_id: string
    type: string
    active: boolean
    column_width: number
    width: number
    deleted: boolean
    dashboard_title: string
    dashboard_layout_components: IDashboardLayoutComponent[]
}

export interface IDashboardLayoutComponent {
  can: object
  id: string
  dashboard_layout_id: string
  dashboard_element_id: string
  row: number
  column: number
  width: number
  height: number
  deleted: boolean
  element_title: string
  element_title_hidden: boolean
  vis_type: string
}

export interface IDashboardAppearance {
  page_side_margins: number
  page_background_color: string
  tile_title_alignment: string
  tile_space_between: number
  tile_background_color: string
  tile_shadow: boolean
  key_color: string
  }
export interface ILookerModel {
  id: string
  label: string
}
export interface ILookerFolderBase {
  name: string
  parent_id: string
  id: string
  content_metadata_id: number
  created_at: Date
  creator_id: number
  child_count: number
  external_id: string
  is_embed: boolean
  is_embed_shared_root: boolean
  is_embed_users_root: boolean
  is_personal: boolean
  is_personal_descendant: boolean
  is_shared_root: boolean
  is_users_root: boolean
  can: object
}

export interface ILookerSpaceBase {
  name: string
  parent_id: string
  id: string
  content_metadata_id: number
  created_at: Date
  creator_id: number
  child_count: number
  external_id: string
  is_embed: boolean
  is_embed_shared_root: boolean
  is_embed_users_root: boolean
  is_personal: boolean
  is_personal_descendant: boolean
  is_shared_root: boolean
  is_users_root: boolean
  can: object
}

export interface ILookerLook extends ILookerLookBase{
  user: ILookerUserIdOnly
  space_id: string
  space: ILookerSpaceBase
  dashboards: ILookerDashboardBase[]
}

export interface ILookerLookBase {
  can: object
  content_metadata_id: number
  id: string
  title: string
  content_favorite_id: number
  created_at: Date
  deleted: boolean
  deleted_at: Date
  deleter_id: number
  description: string
  embed_url: string
  excel_file_url: string
  favorite_count: number
  google_spreadsheet_formula: string
  image_embed_url: string
  is_run_on_load: boolean
  last_accessed_at: Date
  last_updater_id: number
  last_viewed_at: Date
  model: ILookerModel
  public: boolean
  public_slug: string
  public_url: string
  query_id: number
  short_url: string
  folder: ILookerFolderBase
  folder_id: string
  updated_at: Date
  user_id: number
  view_count: number
}

export interface ILookerLookWithQuery extends ILookerLookBase{
  query: ILookerQuery
  url: string
}

export interface ILookerQuery {
 can?: object
 id?: string
 model: string
 view: string
 fields: string[]
 pivots: string[]
 fill_fields: string[]
 filters: object
 filter_expression: string
 sorts: string[]
 limit: string
 column_limit: string
 total: boolean
 row_total: string
 subtotals: string[]
 vis_config: object
 filter_config: object
 visible_ui_sections: string
 slug?: string
 dynamic_fields: string
 client_id?: string
 share_url?: string
 expanded_share_url?: string
 url?: string
 query_timezone: string
 has_table_calculations?: boolean
}

export interface ILookerUserIdOnly {
  id: number
}

export interface ILookerFolderChildrenOptions {
  fields?: string
  page?: number
  per_page?: number
  sorts?: string
}

export interface ILookerScheduledPlan {
  can: object
  color_theme?: string
  created_at: Date
  crontab: string
  dashboard_filters?: string
  dashboard_id?: number
  datagroup?: string
  embed?: boolean
  enabled: boolean
  filters_string ?: string
  id: number
  include_links: boolean
  last_run_at: Date
  long_tables?: boolean
  look_id?: number
  lookml_dashboard_id?: string
  name?: string
  next_run_at: Date
  pdf_landscape?: boolean
  pdf_paper_size?: string
  prewarm_only?: boolean
  query_id: string
  require_change: boolean
  require_no_results: boolean
  require_results: boolean
  run_as_recipient?: boolean
  run_once: boolean
  scheduled_plan_destination: ILookerScheduledPlanDestination[]
  send_all_results: boolean
  timezone: string
  title?: string
  updated_at: Date
  user_id: number
  user?: ILookerUserIdOnly
}

export interface ILookerScheduledPlanDestination {
  address?: string
  apply_formatting?: boolean
  apply_vis?: boolean
  format: string
  id: number
  looker_recipient?: boolean
  message?: string
  parameters?: string
  scheduled_plan_id?: number
  secret_parameters?: string
  type?: string
}

export default LookerClient
