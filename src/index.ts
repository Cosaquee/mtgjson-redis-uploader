import yargs from "yargs";
import { Logger } from "tslog";

import { Tedis } from "tedis";

const parse = async (data: any, tedis: Tedis) => {
  const log: Logger = new Logger({ minLevel: "info" });

  await Promise.all(
    Object.keys(data.data).map(async (key) => {
      const set = data.data[key] as Set;
      log.info(`Opening SET ${set.name} with ID ${set.code}`);

      await Promise.all(
        set.cards.map(async (card) => {
          const c = card as Card;

          if (c.availability.includes("arena")) {
            log.trace(
              `Found CARD playable in MTG Arena. NAME ${c.name} ID: ${c.identifiers.mtgArenaId}`
            );

            if (c.identifiers.mtgArenaId) {
              try {
                await tedis.set(c.identifiers.mtgArenaId, c.name);
              } catch (error) {
                throw new Error(
                  `Error inserting CARD ${c.name} ${c.identifiers.mtgArenaId} to database`
                );
              }
            } else {
              console.log({ cardName: c.name, set: set.name });
            }
          }
        })
      );
    })
  );

  tedis.close();
};

type Set = {
  baseSetSize: number;
  block: string;
  booster: Object;
  cards: Array<Card>;
  code: string;
  isFoilOnly: boolean;
  isOnlineOnly: boolean;
  keyruneCode: string;
  mcmId: number;
  mcmName: string;
  mtgoCode: string;
  name: string;
  releaseDate: string;
  tcgplayerGroupId: number;
  tokens: Array<Object>;
  totalSetSize: number;
  type: string;
};

type Card = {
  availability: Array<string>;
  colorIdentity: Array<string>;
  colors: Array<string>;
  name: string;
  identifiers: Identfiers;
};

type Identfiers = {
  mtgArenaId: string;
};

(async () => {
  const args = yargs.options({
    path: { type: "string", demandOption: true, alias: "p" },
  }).argv;

  const data = require(`./${[args.path]}`);

  // no auth
  const tedis = new Tedis({
    port: 6379,
    host: "127.0.0.1",
  });

  await parse(data, tedis);
})();
