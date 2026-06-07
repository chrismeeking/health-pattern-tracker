import { useEffect, useMemo, useState } from 'react';

type Faction = 'player' | 'enemy' | 'neutral';
type BuildingId = 'command' | 'refinery' | 'barracks' | 'warFactory' | 'turret';
type UnitId = 'infantry' | 'rocket' | 'tank' | 'artillery';
type Units = Record<UnitId, number>;

interface RegionDefinition {
  id: string;
  name: string;
  baseIncome: number;
  x: number;
  y: number;
  connections: string[];
}

interface RegionState {
  owner: Faction;
  buildings: BuildingId[];
  units: {
    player: Units;
    enemy: Units;
  };
}

interface GameState {
  version: 1;
  turn: number;
  playerCredits: number;
  enemyCredits: number;
  regions: Record<string, RegionState>;
  log: string[];
  winner?: Faction;
}

interface BuildingDefinition {
  id: BuildingId;
  name: string;
  shortName: string;
  cost: number;
  income: number;
  description: string;
}

interface UnitDefinition {
  id: UnitId;
  name: string;
  shortName: string;
  cost: number;
  attack: number;
  defense: number;
  requires: BuildingId;
  description: string;
}

const SAVE_KEY = 'command-frontier-save-v1';
const EMPTY_UNITS: Units = { infantry: 0, rocket: 0, tank: 0, artillery: 0 };

const BUILDING_ORDER: BuildingId[] = ['command', 'refinery', 'barracks', 'warFactory', 'turret'];
const UNIT_ORDER: UnitId[] = ['infantry', 'rocket', 'tank', 'artillery'];

const BUILDINGS: Record<BuildingId, BuildingDefinition> = {
  command: {
    id: 'command',
    name: 'Command Centre',
    shortName: 'CC',
    cost: 0,
    income: 2,
    description: 'The regional HQ. Adds income and anchors control.',
  },
  refinery: {
    id: 'refinery',
    name: 'Refinery',
    shortName: 'REF',
    cost: 120,
    income: 5,
    description: 'Harvests resources and greatly improves turn income.',
  },
  barracks: {
    id: 'barracks',
    name: 'Barracks',
    shortName: 'BAR',
    cost: 150,
    income: 0,
    description: 'Trains Infantry and Rocket Soldiers in this region.',
  },
  warFactory: {
    id: 'warFactory',
    name: 'War Factory',
    shortName: 'WF',
    cost: 240,
    income: 0,
    description: 'Builds Tanks and Artillery for heavy pushes.',
  },
  turret: {
    id: 'turret',
    name: 'Defence Turret',
    shortName: 'TUR',
    cost: 180,
    income: 0,
    description: 'Adds a strong defensive bonus during auto-battles.',
  },
};

const UNITS: Record<UnitId, UnitDefinition> = {
  infantry: {
    id: 'infantry',
    name: 'Infantry',
    shortName: 'INF',
    cost: 35,
    attack: 2,
    defense: 2,
    requires: 'barracks',
    description: 'Cheap line troops for holding and probing regions.',
  },
  rocket: {
    id: 'rocket',
    name: 'Rocket Soldier',
    shortName: 'RKT',
    cost: 55,
    attack: 4,
    defense: 2,
    requires: 'barracks',
    description: 'Anti-armour infantry with a useful attack punch.',
  },
  tank: {
    id: 'tank',
    name: 'Tank',
    shortName: 'TNK',
    cost: 120,
    attack: 8,
    defense: 6,
    requires: 'warFactory',
    description: 'Armoured breakthrough unit with high combat value.',
  },
  artillery: {
    id: 'artillery',
    name: 'Artillery',
    shortName: 'ART',
    cost: 145,
    attack: 10,
    defense: 3,
    requires: 'warFactory',
    description: 'Long-range firepower that hits hard but defends poorly.',
  },
};

const REGIONS: RegionDefinition[] = [
  { id: 'harbor', name: 'Harbor Gate', baseIncome: 8, x: 16, y: 25, connections: ['ridge', 'delta'] },
  { id: 'ridge', name: 'Iron Ridge', baseIncome: 7, x: 39, y: 15, connections: ['harbor', 'junction', 'foundry'] },
  { id: 'delta', name: 'Sunken Delta', baseIncome: 9, x: 22, y: 55, connections: ['harbor', 'junction', 'oasis'] },
  { id: 'junction', name: 'Crossroad Junction', baseIncome: 6, x: 49, y: 44, connections: ['ridge', 'delta', 'foundry', 'oasis', 'citadel'] },
  { id: 'foundry', name: 'Ash Foundry', baseIncome: 10, x: 69, y: 22, connections: ['ridge', 'junction', 'citadel'] },
  { id: 'oasis', name: 'Green Oasis', baseIncome: 7, x: 43, y: 75, connections: ['delta', 'junction', 'relay'] },
  { id: 'citadel', name: 'Red Citadel', baseIncome: 9, x: 80, y: 50, connections: ['foundry', 'junction', 'relay'] },
  { id: 'relay', name: 'Signal Relay', baseIncome: 8, x: 66, y: 82, connections: ['oasis', 'citadel'] },
];

const regionById = REGIONS.reduce<Record<string, RegionDefinition>>((lookup, region) => {
  lookup[region.id] = region;
  return lookup;
}, {});

const ownerLabel: Record<Faction, string> = {
  player: 'Steel Falcons',
  enemy: 'Crimson Hand',
  neutral: 'Neutral',
};

function cloneUnits(units: Units): Units {
  return { ...units };
}

function emptyUnits(): Units {
  return cloneUnits(EMPTY_UNITS);
}

function countUnits(units: Units) {
  return UNIT_ORDER.reduce((total, unitId) => total + units[unitId], 0);
}

function unitPower(units: Units, mode: 'attack' | 'defense') {
  return UNIT_ORDER.reduce((total, unitId) => total + units[unitId] * UNITS[unitId][mode], 0);
}

function formatUnits(units: Units) {
  const entries = UNIT_ORDER.filter((unitId) => units[unitId] > 0).map(
    (unitId) => `${UNITS[unitId].shortName} ${units[unitId]}`
  );

  return entries.length > 0 ? entries.join(' / ') : 'No units';
}

function createRegion(
  owner: Faction,
  buildings: BuildingId[],
  playerUnits: Partial<Units> = {},
  enemyUnits: Partial<Units> = {}
): RegionState {
  return {
    owner,
    buildings,
    units: {
      player: { ...EMPTY_UNITS, ...playerUnits },
      enemy: { ...EMPTY_UNITS, ...enemyUnits },
    },
  };
}

function createNewGame(): GameState {
  return {
    version: 1,
    turn: 1,
    playerCredits: 260,
    enemyCredits: 260,
    winner: undefined,
    regions: {
      harbor: createRegion('player', ['command', 'refinery', 'barracks'], { infantry: 6, rocket: 2 }),
      ridge: createRegion('player', ['command'], { infantry: 3 }),
      delta: createRegion('neutral', [], {}, { infantry: 2 }),
      junction: createRegion('neutral', [], {}, { infantry: 3, rocket: 1 }),
      foundry: createRegion('enemy', ['command', 'refinery', 'warFactory'], {}, { infantry: 4, tank: 1 }),
      oasis: createRegion('neutral', [], {}, { infantry: 2 }),
      citadel: createRegion('enemy', ['command', 'barracks', 'turret'], {}, { infantry: 6, rocket: 2 }),
      relay: createRegion('enemy', ['command'], {}, { infantry: 3 }),
    },
    log: [
      'Campaign begins. Capture neutral regions, build your base network, and break the Crimson Hand.',
      'Tip: build Refineries for income, then Barracks or War Factories to recruit stronger armies.',
    ],
  };
}

function loadGame(): GameState {
  const saved = localStorage.getItem(SAVE_KEY);

  if (!saved) {
    return createNewGame();
  }

  try {
    const parsed = JSON.parse(saved) as GameState;

    if (parsed.version !== 1 || !parsed.regions || !parsed.regions.harbor) {
      return createNewGame();
    }

    return parsed;
  } catch {
    return createNewGame();
  }
}

function getIncome(state: GameState, faction: Exclude<Faction, 'neutral'>) {
  return REGIONS.reduce((total, region) => {
    const regionState = state.regions[region.id];

    if (regionState.owner !== faction) {
      return total;
    }

    const buildingIncome = regionState.buildings.reduce((sum, buildingId) => sum + BUILDINGS[buildingId].income, 0);
    return total + region.baseIncome + buildingIncome;
  }, 0);
}

function addLog(state: GameState, message: string) {
  state.log = [message, ...state.log].slice(0, 9);
}

function getWinner(regions: Record<string, RegionState>): Faction | undefined {
  const playerRegions = Object.values(regions).filter((region) => region.owner === 'player').length;
  const enemyRegions = Object.values(regions).filter((region) => region.owner === 'enemy').length;

  if (playerRegions === 0) {
    return 'enemy';
  }

  if (enemyRegions === 0) {
    return 'player';
  }

  return undefined;
}

function distributeSurvivors(originalUnits: Units, survivingPower: number, mode: 'attack' | 'defense') {
  const survivors = emptyUnits();
  let remainingPower = Math.max(0, survivingPower);

  [...UNIT_ORDER]
    .sort((left, right) => UNITS[right][mode] - UNITS[left][mode])
    .forEach((unitId) => {
      const unitValue = UNITS[unitId][mode];
      const maximum = originalUnits[unitId];
      const kept = Math.min(maximum, Math.floor(remainingPower / unitValue));
      survivors[unitId] = kept;
      remainingPower -= kept * unitValue;
    });

  if (countUnits(survivors) === 0 && countUnits(originalUnits) > 0 && survivingPower > 0) {
    const fallback = UNIT_ORDER.find((unitId) => originalUnits[unitId] > 0);

    if (fallback) {
      survivors[fallback] = 1;
    }
  }

  return survivors;
}

function resolveCombat(
  state: GameState,
  targetRegionId: string,
  attacker: Exclude<Faction, 'neutral'>,
  attackingUnits: Units
) {
  const defender = attacker === 'player' ? 'enemy' : 'player';
  const target = state.regions[targetRegionId];
  const regionName = regionById[targetRegionId].name;
  const defendingUnits = target.owner === 'neutral' ? target.units.enemy : target.units[defender];
  const turretBonus = target.buildings.includes('turret') ? 14 : 0;
  const commandBonus = target.buildings.includes('command') ? 4 : 0;
  const attackScore = unitPower(attackingUnits, 'attack') * (0.9 + Math.random() * 0.25);
  const defenseScore = (unitPower(defendingUnits, 'defense') + turretBonus + commandBonus) * (0.9 + Math.random() * 0.25);

  if (attackScore > defenseScore) {
    const survivors = distributeSurvivors(attackingUnits, attackScore - defenseScore * 0.45, 'attack');
    target.owner = attacker;
    target.units.player = emptyUnits();
    target.units.enemy = emptyUnits();
    target.units[attacker] = survivors;

    if (!target.buildings.includes('command')) {
      target.buildings = ['command', ...target.buildings];
    }

    addLog(
      state,
      `${ownerLabel[attacker]} captured ${regionName} with ${formatUnits(survivors)} remaining.`
    );
  } else {
    const survivors = distributeSurvivors(defendingUnits, defenseScore - attackScore * 0.45, 'defense');
    target.units[defender] = target.owner === 'neutral' ? target.units[defender] : survivors;

    if (target.owner === 'neutral') {
      target.units.enemy = survivors;
    }

    addLog(state, `${ownerLabel[attacker]} attack on ${regionName} was repelled.`);
  }

  state.winner = getWinner(state.regions);
}

function moveUnits(state: GameState, fromRegionId: string, toRegionId: string, unitsToMove: Units) {
  const from = state.regions[fromRegionId];
  const to = state.regions[toRegionId];
  const fromName = regionById[fromRegionId].name;
  const toName = regionById[toRegionId].name;

  UNIT_ORDER.forEach((unitId) => {
    from.units.player[unitId] -= unitsToMove[unitId];
  });

  if (to.owner === 'player') {
    UNIT_ORDER.forEach((unitId) => {
      to.units.player[unitId] += unitsToMove[unitId];
    });
    addLog(state, `Moved ${formatUnits(unitsToMove)} from ${fromName} to ${toName}.`);
    return;
  }

  addLog(state, `Battle for ${toName}: ${formatUnits(unitsToMove)} advanced from ${fromName}.`);
  resolveCombat(state, toRegionId, 'player', unitsToMove);
}

function enemyMoveUnits(state: GameState, fromRegionId: string, toRegionId: string, unitsToMove: Units) {
  const from = state.regions[fromRegionId];
  const to = state.regions[toRegionId];

  UNIT_ORDER.forEach((unitId) => {
    from.units.enemy[unitId] -= unitsToMove[unitId];
  });

  if (to.owner === 'enemy') {
    UNIT_ORDER.forEach((unitId) => {
      to.units.enemy[unitId] += unitsToMove[unitId];
    });
    return;
  }

  addLog(state, `Crimson Hand attacks ${regionById[toRegionId].name} from ${regionById[fromRegionId].name}.`);
  resolveCombat(state, toRegionId, 'enemy', unitsToMove);
}

function chooseEnemyBuild(region: RegionState, credits: number): BuildingId | undefined {
  const priorities: BuildingId[] = ['refinery', 'barracks', 'warFactory', 'turret'];

  return priorities.find((buildingId) => !region.buildings.includes(buildingId) && BUILDINGS[buildingId].cost <= credits);
}

function runEnemyTurn(state: GameState) {
  const income = getIncome(state, 'enemy');
  state.enemyCredits += income;
  addLog(state, `Crimson Hand collected ${income} credits.`);

  const enemyRegionIds = REGIONS.filter((region) => state.regions[region.id].owner === 'enemy').map((region) => region.id);

  enemyRegionIds.forEach((regionId) => {
    const region = state.regions[regionId];
    const buildingToAdd = chooseEnemyBuild(region, state.enemyCredits);

    if (buildingToAdd) {
      region.buildings.push(buildingToAdd);
      state.enemyCredits -= BUILDINGS[buildingToAdd].cost;
      addLog(state, `Crimson Hand built ${BUILDINGS[buildingToAdd].name} at ${regionById[regionId].name}.`);
    }
  });

  enemyRegionIds.forEach((regionId) => {
    const region = state.regions[regionId];
    const preferredUnits: UnitId[] = region.buildings.includes('warFactory')
      ? ['tank', 'rocket', 'infantry']
      : ['rocket', 'infantry'];

    preferredUnits.forEach((unitId) => {
      const unit = UNITS[unitId];

      if (region.buildings.includes(unit.requires) && state.enemyCredits >= unit.cost) {
        const amount = Math.min(2, Math.floor(state.enemyCredits / unit.cost));
        region.units.enemy[unitId] += amount;
        state.enemyCredits -= amount * unit.cost;
        addLog(state, `Crimson Hand recruited ${amount} ${unit.name}${amount > 1 ? 's' : ''}.`);
      }
    });
  });

  const attackOptions = enemyRegionIds
    .flatMap((regionId) => {
      const region = state.regions[regionId];
      const force = countUnits(region.units.enemy);

      if (force < 4) {
        return [];
      }

      return regionById[regionId].connections
        .filter((targetId) => state.regions[targetId].owner !== 'enemy')
        .map((targetId) => ({ from: regionId, to: targetId, force, targetOwner: state.regions[targetId].owner }));
    })
    .sort((left, right) => {
      if (left.targetOwner !== right.targetOwner) {
        return left.targetOwner === 'player' ? -1 : 1;
      }

      return right.force - left.force;
    });

  attackOptions.slice(0, 2).forEach((option) => {
    if (state.winner) {
      return;
    }

    const sourceUnits = state.regions[option.from].units.enemy;
    const unitsToMove = emptyUnits();

    UNIT_ORDER.forEach((unitId) => {
      unitsToMove[unitId] = Math.floor(sourceUnits[unitId] / 2);
    });

    if (countUnits(unitsToMove) > 0) {
      enemyMoveUnits(state, option.from, option.to, unitsToMove);
    }
  });
}

function getFactionCounts(state: GameState) {
  return Object.values(state.regions).reduce(
    (counts, region) => {
      counts[region.owner] += 1;
      return counts;
    },
    { player: 0, enemy: 0, neutral: 0 } as Record<Faction, number>
  );
}

function makeDraftFromAvailable(available: Units): Units {
  return {
    infantry: Math.min(2, available.infantry),
    rocket: Math.min(1, available.rocket),
    tank: Math.min(1, available.tank),
    artillery: Math.min(1, available.artillery),
  };
}

function getOwnerClasses(owner: Faction) {
  if (owner === 'player') {
    return 'border-cyan-300 bg-cyan-100 text-cyan-950';
  }

  if (owner === 'enemy') {
    return 'border-red-300 bg-red-100 text-red-950';
  }

  return 'border-amber-300 bg-amber-100 text-amber-950';
}

export default function App() {
  const [game, setGame] = useState<GameState>(() => loadGame());
  const [selectedRegionId, setSelectedRegionId] = useState('harbor');
  const [destinationId, setDestinationId] = useState<string | undefined>('ridge');
  const [draft, setDraft] = useState<Units>(emptyUnits);

  const selectedRegion = game.regions[selectedRegionId];
  const selectedDefinition = regionById[selectedRegionId];
  const selectedAvailable = selectedRegion.units.player;
  const selectedConnections = selectedDefinition.connections;
  const playerIncome = useMemo(() => getIncome(game, 'player'), [game]);
  const enemyIncome = useMemo(() => getIncome(game, 'enemy'), [game]);
  const factionCounts = useMemo(() => getFactionCounts(game), [game]);
  const canMove = selectedRegion.owner === 'player' && countUnits(selectedAvailable) > 0;

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
  }, [game]);

  useEffect(() => {
    setDraft(makeDraftFromAvailable(selectedAvailable));
    setDestinationId((currentDestination) => {
      if (currentDestination && selectedConnections.includes(currentDestination)) {
        return currentDestination;
      }

      return selectedConnections[0];
    });
  }, [selectedAvailable, selectedConnections]);

  function updateGame(recipe: (next: GameState) => void) {
    setGame((current) => {
      const next = structuredClone(current) as GameState;
      recipe(next);
      next.winner = next.winner ?? getWinner(next.regions);
      return next;
    });
  }

  function build(buildingId: BuildingId) {
    updateGame((next) => {
      const region = next.regions[selectedRegionId];
      const building = BUILDINGS[buildingId];

      if (region.owner !== 'player' || region.buildings.includes(buildingId) || next.playerCredits < building.cost) {
        return;
      }

      region.buildings.push(buildingId);
      next.playerCredits -= building.cost;
      addLog(next, `Built ${building.name} at ${regionById[selectedRegionId].name}.`);
    });
  }

  function recruit(unitId: UnitId) {
    updateGame((next) => {
      const region = next.regions[selectedRegionId];
      const unit = UNITS[unitId];

      if (region.owner !== 'player' || !region.buildings.includes(unit.requires) || next.playerCredits < unit.cost) {
        return;
      }

      region.units.player[unitId] += 1;
      next.playerCredits -= unit.cost;
      addLog(next, `Recruited 1 ${unit.name} at ${regionById[selectedRegionId].name}.`);
    });
  }

  function adjustDraft(unitId: UnitId, amount: number) {
    setDraft((current) => {
      const next = { ...current };
      next[unitId] = Math.max(0, Math.min(selectedAvailable[unitId], next[unitId] + amount));
      return next;
    });
  }

  function sendArmy() {
    if (!destinationId || countUnits(draft) === 0 || !canMove) {
      return;
    }

    updateGame((next) => {
      moveUnits(next, selectedRegionId, destinationId, draft);
    });
  }

  function endTurn() {
    updateGame((next) => {
      if (next.winner) {
        return;
      }

      const income = getIncome(next, 'player');
      next.playerCredits += income;
      addLog(next, `Turn ${next.turn}: Steel Falcons collected ${income} credits.`);
      runEnemyTurn(next);
      next.turn += 1;
    });
  }

  function resetGame() {
    const fresh = createNewGame();
    setGame(fresh);
    setSelectedRegionId('harbor');
    setDestinationId('ridge');
    setDraft(emptyUnits());
  }

  return (
    <main className="min-h-dvh bg-[#09111f] text-slate-100">
      <section className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-4 px-3 pb-6 pt-4 sm:px-5 lg:grid lg:grid-cols-[1.3fr_0.9fr] lg:items-start">
        <header className="rounded-[1.75rem] border border-cyan-300/20 bg-slate-900/95 p-4 shadow-2xl shadow-cyan-950/30 lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">Command Frontier</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl">Mobile Strategy War Room</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                Turn-based campaign control meets base building: capture regions, construct production, raise armies,
                and outmaneuver the Crimson Hand.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[23rem]">
              <Stat label="Turn" value={game.turn.toString()} />
              <Stat label="Credits" value={game.playerCredits.toString()} tone="cyan" />
              <Stat label="Income" value={`+${playerIncome}`} tone="green" />
            </div>
          </div>
        </header>

        {game.winner ? (
          <section className="rounded-[1.75rem] border border-yellow-300/40 bg-yellow-300/10 p-4 lg:col-span-2">
            <h2 className="text-2xl font-black text-yellow-100">
              {game.winner === 'player' ? 'Victory: the frontier is yours.' : 'Defeat: the Crimson Hand controls the map.'}
            </h2>
            <p className="mt-2 text-sm text-yellow-50/80">
              Start a new campaign to try a different build order or attack route.
            </p>
            <button
              className="mt-4 min-h-12 w-full rounded-2xl bg-yellow-300 px-4 py-3 font-black text-slate-950 active:scale-[0.98] sm:w-auto"
              type="button"
              onClick={resetGame}
            >
              New Campaign
            </button>
          </section>
        ) : null}

        <section className="space-y-4">
          <div className="rounded-[1.75rem] border border-slate-700 bg-slate-900 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">Campaign Map</h2>
                <p className="text-sm text-slate-400">Tap a region node to inspect, build, recruit, or launch moves.</p>
              </div>
              <div className="rounded-2xl bg-slate-800 px-3 py-2 text-right text-xs text-slate-300">
                <div>Enemy income +{enemyIncome}</div>
                <div>
                  P {factionCounts.player} / N {factionCounts.neutral} / E {factionCounts.enemy}
                </div>
              </div>
            </div>

            <div className="relative mt-4 aspect-[1.02] min-h-[360px] overflow-hidden rounded-[1.5rem] border border-slate-700 bg-[radial-gradient(circle_at_top_left,#164e63,transparent_38%),linear-gradient(145deg,#0f172a,#111827)] sm:aspect-[1.75]">
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {REGIONS.flatMap((region) =>
                  region.connections
                    .filter((targetId) => region.id < targetId)
                    .map((targetId) => {
                      const target = regionById[targetId];
                      return (
                        <line
                          key={`${region.id}-${targetId}`}
                          x1={region.x}
                          y1={region.y}
                          x2={target.x}
                          y2={target.y}
                          stroke="rgba(148, 163, 184, 0.38)"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                      );
                    })
                )}
              </svg>

              {REGIONS.map((region) => {
                const regionState = game.regions[region.id];
                const isSelected = region.id === selectedRegionId;
                const visibleUnits =
                  regionState.owner === 'player' ? regionState.units.player : regionState.units.enemy;

                return (
                  <button
                    key={region.id}
                    type="button"
                    onClick={() => setSelectedRegionId(region.id)}
                    className={`absolute flex min-h-24 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-3xl border-2 p-2 text-center shadow-xl transition active:scale-95 sm:w-32 ${
                      isSelected ? 'ring-4 ring-white/80' : ''
                    } ${getOwnerClasses(regionState.owner)}`}
                    style={{ left: `${region.x}%`, top: `${region.y}%` }}
                  >
                    <span className="text-[0.63rem] font-black uppercase tracking-wide">{ownerLabel[regionState.owner]}</span>
                    <span className="mt-1 text-sm font-black leading-tight">{region.name}</span>
                    <span className="mt-1 rounded-full bg-black/10 px-2 py-1 text-xs font-bold">
                      +{region.baseIncome} / {countUnits(visibleUnits)} units
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <LegendCard label="Steel Falcons" detail="Your faction" className="border-cyan-300 bg-cyan-100 text-cyan-950" />
            <LegendCard label="Neutral militia" detail="Capture for income" className="border-amber-300 bg-amber-100 text-amber-950" />
            <LegendCard label="Crimson Hand" detail="AI opponent" className="border-red-300 bg-red-100 text-red-950" />
          </div>

          <section className="rounded-[1.75rem] border border-slate-700 bg-slate-900 p-4">
            <h2 className="text-xl font-black">Command Log</h2>
            <div className="mt-3 space-y-2">
              {game.log.map((entry, index) => (
                <p key={`${entry}-${index}`} className="rounded-2xl bg-slate-800 px-3 py-2 text-sm leading-5 text-slate-200">
                  {entry}
                </p>
              ))}
            </div>
          </section>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-4">
          <section className="rounded-[1.75rem] border border-slate-700 bg-slate-900 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Selected Region</p>
                <h2 className="mt-1 text-2xl font-black text-white">{selectedDefinition.name}</h2>
                <p className="mt-1 text-sm text-slate-300">
                  {ownerLabel[selectedRegion.owner]} control / Base income +{selectedDefinition.baseIncome}
                </p>
              </div>
              <span className={`rounded-2xl border px-3 py-2 text-xs font-black ${getOwnerClasses(selectedRegion.owner)}`}>
                {selectedRegion.owner.toUpperCase()}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Panel label="Buildings" value={selectedRegion.buildings.length.toString()} />
              <Panel
                label="Army"
                value={countUnits(
                  selectedRegion.owner === 'player' ? selectedRegion.units.player : selectedRegion.units.enemy
                ).toString()}
              />
            </div>

            <div className="mt-4 rounded-2xl bg-slate-800 p-3">
              <h3 className="font-black">Garrison</h3>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {UNIT_ORDER.map((unitId) => {
                  const units = selectedRegion.owner === 'player' ? selectedRegion.units.player : selectedRegion.units.enemy;

                  return (
                    <div key={unitId} className="rounded-xl bg-slate-950/70 px-3 py-2">
                      <p className="text-xs font-bold text-slate-400">{UNITS[unitId].shortName}</p>
                      <p className="text-lg font-black">{units[unitId]}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-700 bg-slate-900 p-4">
            <h2 className="text-xl font-black">Build Base</h2>
            <p className="mt-1 text-sm text-slate-400">Buildings are regional, so place production where you need units.</p>
            <div className="mt-3 grid gap-2">
              {BUILDING_ORDER.filter((buildingId) => buildingId !== 'command').map((buildingId) => {
                const building = BUILDINGS[buildingId];
                const owned = selectedRegion.buildings.includes(buildingId);
                const disabled = selectedRegion.owner !== 'player' || owned || game.playerCredits < building.cost || Boolean(game.winner);

                return (
                  <button
                    key={buildingId}
                    type="button"
                    disabled={disabled}
                    onClick={() => build(buildingId)}
                    className="min-h-16 rounded-2xl border border-slate-700 bg-slate-800 px-3 py-3 text-left transition enabled:active:scale-[0.98] disabled:opacity-45"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-black">
                        {building.shortName} {building.name}
                      </span>
                      <span className="rounded-full bg-cyan-300 px-2 py-1 text-xs font-black text-slate-950">
                        {owned ? 'Built' : `${building.cost}c`}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-400">{building.description}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-700 bg-slate-900 p-4">
            <h2 className="text-xl font-black">Recruit Units</h2>
            <div className="mt-3 grid gap-2">
              {UNIT_ORDER.map((unitId) => {
                const unit = UNITS[unitId];
                const unlocked = selectedRegion.buildings.includes(unit.requires);
                const disabled = selectedRegion.owner !== 'player' || !unlocked || game.playerCredits < unit.cost || Boolean(game.winner);

                return (
                  <button
                    key={unitId}
                    type="button"
                    disabled={disabled}
                    onClick={() => recruit(unitId)}
                    className="min-h-16 rounded-2xl border border-slate-700 bg-slate-800 px-3 py-3 text-left transition enabled:active:scale-[0.98] disabled:opacity-45"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-black">
                        {unit.shortName} {unit.name}
                      </span>
                      <span className="rounded-full bg-emerald-300 px-2 py-1 text-xs font-black text-slate-950">
                        {unit.cost}c
                      </span>
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-400">
                      ATK {unit.attack} / DEF {unit.defense}. Needs {BUILDINGS[unit.requires].shortName}. {unit.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-700 bg-slate-900 p-4">
            <h2 className="text-xl font-black">Move or Attack</h2>
            <p className="mt-1 text-sm text-slate-400">Pick a connected region, set the army size, then send it.</p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {selectedConnections.map((connectionId) => {
                const connection = regionById[connectionId];
                const connectionState = game.regions[connectionId];
                const active = destinationId === connectionId;

                return (
                  <button
                    key={connectionId}
                    type="button"
                    onClick={() => setDestinationId(connectionId)}
                    className={`min-h-14 rounded-2xl border px-3 py-2 text-left text-sm font-black transition active:scale-[0.98] ${
                      active ? 'border-white bg-white text-slate-950' : 'border-slate-700 bg-slate-800 text-slate-100'
                    }`}
                  >
                    <span className="block">{connection.name}</span>
                    <span className="text-xs font-bold opacity-70">{ownerLabel[connectionState.owner]}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 space-y-2 rounded-2xl bg-slate-800 p-3">
              {UNIT_ORDER.map((unitId) => (
                <div key={unitId} className="grid grid-cols-[1fr_auto] items-center gap-3">
                  <div>
                    <p className="font-black">{UNITS[unitId].name}</p>
                    <p className="text-xs text-slate-400">Available {selectedAvailable[unitId]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjustDraft(unitId, -1)}
                      disabled={!canMove || draft[unitId] === 0}
                      className="h-11 w-11 rounded-full bg-slate-700 text-xl font-black disabled:opacity-35"
                    >
                      -
                    </button>
                    <span className="w-7 text-center text-lg font-black">{draft[unitId]}</span>
                    <button
                      type="button"
                      onClick={() => adjustDraft(unitId, 1)}
                      disabled={!canMove || draft[unitId] >= selectedAvailable[unitId]}
                      className="h-11 w-11 rounded-full bg-slate-700 text-xl font-black disabled:opacity-35"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={!canMove || !destinationId || countUnits(draft) === 0 || Boolean(game.winner)}
              onClick={sendArmy}
              className="mt-3 min-h-14 w-full rounded-2xl bg-cyan-300 px-4 py-3 text-lg font-black text-slate-950 transition active:scale-[0.98] disabled:opacity-40"
            >
              Send Army
            </button>
          </section>

          <section className="grid grid-cols-2 gap-3 pb-[env(safe-area-inset-bottom)]">
            <button
              type="button"
              onClick={endTurn}
              disabled={Boolean(game.winner)}
              className="min-h-16 rounded-[1.25rem] bg-emerald-300 px-4 py-3 text-lg font-black text-slate-950 shadow-lg shadow-emerald-950/30 active:scale-[0.98] disabled:opacity-40"
            >
              End Turn
            </button>
            <button
              type="button"
              onClick={resetGame}
              className="min-h-16 rounded-[1.25rem] border border-slate-600 bg-slate-800 px-4 py-3 text-lg font-black text-white active:scale-[0.98]"
            >
              New Game
            </button>
          </section>
        </aside>
      </section>
    </main>
  );
}

function Stat({ label, value, tone = 'slate' }: { label: string; value: string; tone?: 'slate' | 'cyan' | 'green' }) {
  const toneClasses = {
    slate: 'bg-slate-800 text-white',
    cyan: 'bg-cyan-300 text-slate-950',
    green: 'bg-emerald-300 text-slate-950',
  };

  return (
    <div className={`rounded-2xl px-3 py-2 ${toneClasses[tone]}`}>
      <p className="text-[0.65rem] font-black uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}

function Panel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-800 px-3 py-3">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}

function LegendCard({ label, detail, className }: { label: string; detail: string; className: string }) {
  return (
    <div className={`rounded-2xl border-2 px-4 py-3 ${className}`}>
      <p className="font-black">{label}</p>
      <p className="text-sm font-bold opacity-70">{detail}</p>
    </div>
  );
}
