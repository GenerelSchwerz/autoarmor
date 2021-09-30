import { Bot } from "mineflayer";
import { Entity } from "prismarine-entity";
import { ESMap } from "typescript";
interface NormalizedEnchant {
    name: string;
    lvl: number;
}
interface autoArmorOptions {
    disabled: boolean;
    autoEquip: boolean;
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
}
export default function plugin(bot: Bot): void;
export declare class autoArmor {
    bot: Bot;
    enabled: boolean;
    autoEquip: boolean;
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
    removeBannedArmor(armorName: string): void;
    timeoutAfter(time: number, message: string): Promise<unknown>;
    calculateWorth(armorName: string, enchantments?: NormalizedEnchant[]): any;
    emitWrapper(func: (...args: any[]) => Promise<any> | Promise<void> | void, ...args: any): Promise<void>;
    unequipArmor(waitTicks?: number): Promise<void>;
    equipArmor(waitTicks?: number): Promise<void>;
    checkForNoArmor(): Promise<void>;
    armorFromGround(item: Entity): void;
    armorPiece(target: string, callback?: (error: any) => void, manual?: boolean): Promise<void>;
    onHealthArmorCheck(): void;
    selfArmorCheck(who: Entity): void;
    playerCollectCheck(who: Entity, item: Entity): Promise<void>;
}
export {};
//# sourceMappingURL=index.d.ts.map