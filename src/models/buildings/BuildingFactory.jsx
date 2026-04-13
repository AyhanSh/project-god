'use client'

// Ancient
import {
  MudHut,
  StoneTemple,
  MarketStall,
  Well,
  FarmField,
  StorageSilo,
  Pyramid,
} from './AncientBuildings'

// Medieval
import {
  StoneCottage,
  CastleKeep,
  Cathedral,
  Tavern,
  Blacksmith,
  CityWall,
  MarketHall,
  Mill,
} from './MedievalBuildings'

// Renaissance
import {
  ManorHouse,
  University,
  Bank,
  Theatre,
  HarborDock,
  Observatory,
} from './RenaissanceBuildings'

// Industrial
import {
  Factory,
  RailStation,
  Hospital,
  CoalMine,
  ApartmentBlock,
  Park,
  PowerPlant,
} from './IndustrialBuildings'

// Modern
import {
  Skyscraper,
  Airport,
  ShoppingMall,
  Stadium,
  SuburbHouse,
  OfficeTower,
  DataCenter,
} from './ModernBuildings'

// Singularity
import {
  Arcology,
  QuantumServer,
  BioDome,
  SpaceElevator,
  MindPalace,
  HoloMarket,
} from './SingularityBuildings'

// ─── Building size map ─────────────────────────────────────────────────────────
// All units in world-space at scale=1. Values represent footprint + height
// width / depth are the XZ footprint, height is the approximate build height.

export const BUILDING_SIZES = {
  // Ancient
  mud_hut:      { width: 2.6,  depth: 2.6,  height: 2.4 },
  stone_temple: { width: 5.2,  depth: 3.8,  height: 5.0 },
  market_stall: { width: 2.8,  depth: 2.1,  height: 2.6 },
  well:         { width: 1.4,  depth: 1.4,  height: 2.1 },
  farm_field:   { width: 6.0,  depth: 5.0,  height: 0.5 },
  storage_silo: { width: 2.0,  depth: 2.0,  height: 5.0 },
  pyramid:      { width: 9.4,  depth: 9.4,  height: 6.0 },

  // Medieval
  stone_cottage: { width: 3.2,  depth: 2.4,  height: 3.5 },
  castle_keep:   { width: 4.0,  depth: 4.0,  height: 7.0 },
  cathedral:     { width: 5.8,  depth: 7.0,  height: 8.0 },
  tavern:        { width: 4.5,  depth: 3.2,  height: 4.5 },
  blacksmith:    { width: 3.6,  depth: 2.8,  height: 3.2 },
  city_wall:     { width: 14.0, depth: 0.8,  height: 3.5 },
  market_hall:   { width: 7.2,  depth: 3.8,  height: 4.2 },
  mill:          { width: 2.8,  depth: 2.8,  height: 5.5 },

  // Renaissance
  manor_house: { width: 7.5,  depth: 3.8,  height: 5.5 },
  university:  { width: 9.8,  depth: 7.0,  height: 7.0 },
  bank:        { width: 6.0,  depth: 3.5,  height: 5.5 },
  theatre:     { width: 7.0,  depth: 6.5,  height: 5.5 },
  harbor_dock: { width: 9.0,  depth: 4.0,  height: 3.5 },
  observatory: { width: 5.0,  depth: 5.0,  height: 6.5 },

  // Industrial
  factory:         { width: 9.0,  depth: 4.0,  height: 6.0 },
  rail_station:    { width: 10.0, depth: 3.8,  height: 6.0 },
  hospital:        { width: 6.5,  depth: 4.5,  height: 6.0 },
  coal_mine:       { width: 3.0,  depth: 3.0,  height: 6.0 },
  apartment_block: { width: 5.5,  depth: 2.8,  height: 7.5 },
  park:            { width: 8.0,  depth: 7.0,  height: 3.0 },
  power_plant:     { width: 9.0,  depth: 4.5,  height: 8.0 },

  // Modern
  skyscraper:    { width: 2.4,  depth: 2.4,  height: 16.0 },
  airport:       { width: 12.0, depth: 4.0,  height: 6.0  },
  shopping_mall: { width: 10.0, depth: 6.5,  height: 5.0  },
  stadium:       { width: 9.6,  depth: 9.6,  height: 5.0  },
  suburb_house:  { width: 5.2,  depth: 2.8,  height: 3.5  },
  office_tower:  { width: 5.0,  depth: 4.5,  height: 12.0 },
  data_center:   { width: 8.5,  depth: 4.5,  height: 4.5  },

  // Singularity
  arcology:       { width: 11.0, depth: 11.0, height: 10.0 },
  quantum_server: { width: 3.0,  depth: 3.0,  height: 5.0  },
  bio_dome:       { width: 7.0,  depth: 7.0,  height: 7.0  },
  space_elevator: { width: 3.0,  depth: 3.0,  height: 50.0 },
  mind_palace:    { width: 5.6,  depth: 5.6,  height: 7.0  },
  holo_market:    { width: 8.0,  depth: 7.0,  height: 4.0  },
}

// ─── Component registry ────────────────────────────────────────────────────────

const BUILDING_REGISTRY = {
  // Ancient
  mud_hut:      MudHut,
  stone_temple: StoneTemple,
  market_stall: MarketStall,
  well:         Well,
  farm_field:   FarmField,
  storage_silo: StorageSilo,
  pyramid:      Pyramid,

  // Medieval
  stone_cottage: StoneCottage,
  castle_keep:   CastleKeep,
  cathedral:     Cathedral,
  tavern:        Tavern,
  blacksmith:    Blacksmith,
  city_wall:     CityWall,
  market_hall:   MarketHall,
  mill:          Mill,

  // Renaissance
  manor_house: ManorHouse,
  university:  University,
  bank:        Bank,
  theatre:     Theatre,
  harbor_dock: HarborDock,
  observatory: Observatory,

  // Industrial
  factory:         Factory,
  rail_station:    RailStation,
  hospital:        Hospital,
  coal_mine:       CoalMine,
  apartment_block: ApartmentBlock,
  park:            Park,
  power_plant:     PowerPlant,

  // Modern
  skyscraper:    Skyscraper,
  airport:       Airport,
  shopping_mall: ShoppingMall,
  stadium:       Stadium,
  suburb_house:  SuburbHouse,
  office_tower:  OfficeTower,
  data_center:   DataCenter,

  // Singularity
  arcology:       Arcology,
  quantum_server: QuantumServer,
  bio_dome:       BioDome,
  space_elevator: SpaceElevator,
  mind_palace:    MindPalace,
  holo_market:    HoloMarket,
}

// ─── Fallback placeholder ──────────────────────────────────────────────────────

function UnknownBuilding({ position = [0, 0, 0], scale = 1, progress = 1 }) {
  const p = Math.max(0, Math.min(1, progress ?? 1))
  const s = scale ?? 1
  return (
    <group position={position}>
      <mesh position={[0, 0.5 * s * p, 0]} scale={[s, s * p, s]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 1.0, 1.0]} />
        <meshStandardMaterial color="#ff00ff" wireframe />
      </mesh>
    </group>
  )
}

// ─── BuildingFactory ──────────────────────────────────────────────────────────
/**
 * Renders the correct building component for the given `type` string.
 *
 * Props:
 * @param {string}   type     - Snake-case building type key (e.g. 'mud_hut')
 * @param {number[]} position - [x, y, z] world position (default [0,0,0])
 * @param {number}   scale    - Uniform scale multiplier (default 1)
 * @param {number}   progress - Construction progress 0–1 (default 1 = fully built)
 */
export default function BuildingFactory({
  type,
  position = [0, 0, 0],
  scale = 2,
  progress = 1,
}) {
  const Component = BUILDING_REGISTRY[type]

  if (!Component) {
    console.warn(`[BuildingFactory] Unknown building type: "${type}". Rendering placeholder.`)
    return (
      <UnknownBuilding
        position={position}
        scale={scale}
        progress={progress}
      />
    )
  }

  return (
    <Component
      position={position}
      scale={scale}
      progress={progress}
    />
  )
}

// ─── Named list exports ────────────────────────────────────────────────────────

/** All valid building type keys, grouped by era */
export const BUILDING_TYPES_BY_ERA = {
  ancient:     ['mud_hut', 'stone_temple', 'market_stall', 'well', 'farm_field', 'storage_silo', 'pyramid'],
  medieval:    ['stone_cottage', 'castle_keep', 'cathedral', 'tavern', 'blacksmith', 'city_wall', 'market_hall', 'mill'],
  renaissance: ['manor_house', 'university', 'bank', 'theatre', 'harbor_dock', 'observatory'],
  industrial:  ['factory', 'rail_station', 'hospital', 'coal_mine', 'apartment_block', 'park', 'power_plant'],
  modern:      ['skyscraper', 'airport', 'shopping_mall', 'stadium', 'suburb_house', 'office_tower', 'data_center'],
  singularity: ['arcology', 'quantum_server', 'bio_dome', 'space_elevator', 'mind_palace', 'holo_market'],
}

/** Flat list of all registered building type keys */
export const ALL_BUILDING_TYPES = Object.keys(BUILDING_REGISTRY)
