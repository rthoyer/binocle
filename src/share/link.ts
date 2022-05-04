export function contentLinkFromId(base_url: string,id: string, type: LookerContent){
  return `${base_url}/${type}s/${id}`
}

export function clickableContentId(base_url: string,id: string, type: LookerContent){
  return `\x1B]8;;${contentLinkFromId(base_url,id,type)}\x1B\\#${id}\x1B]8;;\x1B\\`
}

export type LookerContent = 'folder' | 'look' | 'dashboard'