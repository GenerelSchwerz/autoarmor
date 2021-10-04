import { Bot } from "mineflayer";
import { Entity } from "prismarine-entity";
import { Item } from "prismarine-item";
import { ESMap } from "typescript";
interface NormalizedEnchant {
    name: string;
    lvl: number;
}
interface autoArmorOptions {
    disabled: boolean;
    autoReplace: boolean;
    waitTick: number;
    priority: string;
    bannedArmor: string[];
    ignoreInventoryCheck: boolean;
    checkOnItemPickup: boolean;
    armorTimeout?: number;
    wornArmor?: ESMap<string, string>;
}
declare module "mineflayer" {
    interface Bot {
        autoArmor: autoArmor;
    }
    interface BotEvents {
        autoArmorStartedEquipping: () => void;
        autoArmorEquippedItem: (item: Item) => void;
        autoArmorStoppedEquipping: () => void;
    }
}
export default function plugin(bot: Bot): void;
export declare class autoArmor {
    bot: Bot;
    enabled: boolean;
    autoReplace: boolean;
    waitTick: number;
    priority: string;
    bannedArmor: string[];
    ignoreInventoryCheck: boolean;
    checkOnItemPickup: boolean;
    items: any;
    currentlyEquipping: boolean;
    wornArmor: ESMap<string, string>;
    constructor(bot: Bot, options?: autoArmorOptions);
    disable(): void;
    enable(): void;
    disableAuto(): void;
    enableAuto(): void;
    addBannedArmor(armorName: string): void;
    removeBannedArmor(...armorNames: string[]): void;
    calculateWorth(armorName: string, enchantments?: NormalizedEnchant[]): any;
    armorFromGround(item: Entity): void;
    emitWrapper(func: (...args: any[]) => Promise<any> | Promise<void> | void, ...args: any): Promise<void>;
    unequipArmor(waitTicks?: number): Promise<void>;
    equipArmor(waitTicks?: number): Promise<void>;
    checkForNoArmor(waitTicks?: number): Promise<void>;
    armorPiece(target: string, manual?: boolean): Promise<Error | null | undefined>;
    onHealthArmorCheck(): Promise<void>;
    selfArmorCheck(who: Entity): Promise<void>;
    playerCollectCheck(who: Entity, item: Entity): Promise<void>;
}
export {};
//# sourceMappingURL=index.d.ts.map