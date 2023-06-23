import RconManager from "./classes/rcon/RconManager.js";
import TwitchManager from "./classes/twitch/TwitchManager.js";

import registerUserCommands from "./classes/commandsystem/standard/commands/UserCommands.js";
import registerEconomyCommands from "./classes/commandsystem/standard/commands/EconomyCommands.js";
import registerMiscCommands from "./classes/commandsystem/standard/commands/MiscCommands.js";

await RconManager.start();
await TwitchManager.start();

registerUserCommands();
registerEconomyCommands();
registerMiscCommands();