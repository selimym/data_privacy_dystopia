export interface NPCDisplayData {
  citizen_id: string
  sprite_key: string
  map_x: number
  map_y: number
  is_flagged: boolean
  is_highlighted: boolean
}

export interface WorldDisplayState {
  npcs: NPCDisplayData[]
}
