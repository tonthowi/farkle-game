export const TOKEN_CONFIG = {
  STARTING_BALANCE: 500,
  ONLINE_ENTRY_FEE: 5,
  VS_COMPUTER: {
    easy:   { win: 75,  loss: -75  },
    medium: { win: 125, loss: -125 },
    hard:   { win: 200, loss: -200 },
  },
  ONLINE_MULTIPLAYER: {
    win: 150,
    loss: 0, // entry fee is the sole cost of losing
  },
} as const;
