/** Shared low-poly material palette — keeps every procedural object visually consistent. */
export const DIORAMA_COLORS = {
  // Sky backdrop, top → middle → bottom. Drawn by CSS behind the editor
  // canvas and by SkyBackdrop in Preview; the fog fades toward the middle.
  skyTop: "#bfe3ff",
  skyMiddle: "#e3f0dd",
  skyBottom: "#ecdfc2",

  // Nature
  grassTop: "#9fbf84",
  dirt: "#a9764f",
  dirtDark: "#8a5f40",
  trunk: "#7a5a40",
  foliageLight: "#86ad62",
  foliageDark: "#5f8c4a",
  rock: "#a19d93",
  rockDark: "#86827a",
  // Autumn ginkgo (イチョウ): mostly turned, a few clumps still greenish
  ginkgoLeaf: "#dcb247",
  ginkgoLeafLight: "#e8c86a",
  ginkgoLeafDeep: "#c28f34",
  ginkgoLeafGreen: "#aea24e",
  bark: "#6b6156",

  // Japanese building
  wallPlaster: "#efe6d3",
  wallSiding: "#d9d2c3",
  roofTile: "#4a535a",
  woodTrim: "#5b3f2c",
  shopAwning: "#8f3b3b",
  shopAwningLight: "#b76a5c",
  windowGlow: "#ffd88a",
  acUnit: "#e4e1d9",
  acFan: "#6f6c66",
  foundation: "#b4afa3",
  roofSlab: "#a3a79e",
  doorDark: "#4d423a",

  // Street
  asphalt: "#55575a",
  asphaltLine: "#e8e2d0",
  sidewalkConcrete: "#c9c3b6",
  sidewalkJoint: "#b3ad9f",
  curb: "#dcd7cc",
  lotGravel: "#bdb4a0",
  plinth: "#3d3835",
  mirrorOrange: "#d98236",
  mirrorGlass: "#b7ccd4",

  // Infrastructure
  poleConcrete: "#9c978b",
  poleGuard: "#d6b13f",
  transformer: "#8e979b",
  insulator: "#ece9e1",
  wireGray: "#2b2b2b",

  // Props
  vendingBody: "#c24f47",
  vendingPanel: "#f4f1ea",
  vendingDark: "#3a3634",
  canBlue: "#5d7fa3",
  canGreen: "#6f9a5b",
  canYellow: "#d9b45a",
  signRed: "#b8433a",
  signBoard: "#f4f1ea",
  signPost: "#a9adb0",
  plateYellow: "#e6c34f",
  terracotta: "#b8734f",
  tankCream: "#e3dcc4",

  // Vehicles
  carBody: "#a9c4b6",
  carGlass: "#39434b",
  tireRubber: "#2f2d2b",
  metalLight: "#c4c7c8",
  bikeFrame: "#7d98a3",

  // People (model-railway figures: flat painted colors)
  clothNavy: "#46506a",
  clothBeige: "#bba98b",
  skin: "#dfb896",
  hairDark: "#3b322c",

  // Editor
  selection: "#f0b27a",
  locked: "#9db4c0",
} as const;
