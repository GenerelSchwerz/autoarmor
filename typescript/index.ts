import { Bot } from "mineflayer";
import { Entity } from "prismarine-entity";
import { Item } from "prismarine-item";
import { ESMap } from "typescript";

type ArmorPieces = "head" | "torso" | "legs" | "feet" | "off-hand";

const armorPieces: ArmorPieces[] = ["head", "torso", "legs", "feet", "off-hand"];

const armorPlacement = {
    leather_helmet: "head",
    leather_chestplate: "torso",
    leather_leggings: "legs",
    leather_boots: "feet",
    gold_helmet: "head",
    gold_chestplate: "torso",
    gold_leggings: "legs",
    gold_boots: "feet",
    chainmail_helmet: "head",
    chainmail_chestplate: "torso",
    chainmail_leggings: "legs",
    chainmail_boots: "feet",
    iron_helmet: "head",
    iron_chestplate: "torso",
    iron_leggings: "legs",
    iron_boots: "feet",
    diamond_helmet: "head",
    diamond_chestplate: "torso",
    diamond_leggings: "legs",
    diamond_boots: "feet",
    netherite_helmet: "head",
    netherite_chestplate: "chestplate",
    netherite_leggings: "legs",
    netherite_boots: "feet",
    turtle_helmet: "head",
    elytra: "torso",
    shield: "off-hand",
    other: "hand",
} as const;

const armorRankings = {
    leather_helmet: 1,
    leather_chestplate: 1,
    leather_leggings: 1,
    leather_boots: 1,
    gold_helmet: 2,
    gold_chestplate: 2,
    gold_leggings: 2,
    gold_boots: 2,
    chainmail_helmet: 3,
    chainmail_chestplate: 3,
    chainmail_leggings: 3,
    chainmail_boots: 3,
    iron_helmet: 4,
    iron_chestplate: 4,
    iron_leggings: 4,
    iron_boots: 4,
    diamond_helmet: 5,
    diamond_chestplate: 5,
    diamond_leggings: 5,
    diamond_boots: 5,
    netherite_helmet: 6,
    netherite_chestplate: 6,
    netherite_leggings: 6,
    netherite_boots: 6,
    turtle_helmet: 4.5,
    elytra: 0.5,
    shield: 10,
    other: 0,
} as const;

const enchantmentRankingsPerLevel = {
    mending: 1,
    protection: 0.5,
    blast_protection: 0.4,
    frost_walker: 0.4,
    thorns: 0.33,
    soul_speed: 0.33,
    unbreaking: 0.2,
    other: 0,
} as const;

// Stolen from prismarine-item
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

export default function plugin(bot: Bot) {
    const autoarmor = new autoArmor(bot);
    bot.autoArmor = autoarmor;
}

export class autoArmor {
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

    constructor(bot: Bot, options?: autoArmorOptions) {
        this.bot = bot;
        this.enabled = options?.disabled ?? true;
        this.autoReplace = options?.autoReplace ?? false;
        this.waitTick = options?.waitTick ?? 1;
        this.priority = options?.priority ?? "raw"; //* planned "durability" | "enchantments" | "armorType" | "raw"
        this.bannedArmor = options?.bannedArmor ?? [];
        this.wornArmor = options?.wornArmor ?? new Map<string, string>();
        this.ignoreInventoryCheck = options?.ignoreInventoryCheck ?? false;
        this.checkOnItemPickup = options?.checkOnItemPickup ?? true;
        this.currentlyEquipping = false;

        this.items = {};
        this.bot.once("spawn", () => {
            this.items = require("minecraft-data")(this.bot.version).items;
        });

        this.bot.on("entityAttributes", this.selfArmorCheck.bind(this));
        this.bot.on("health", this.onHealthArmorCheck.bind(this));
        this.bot.on("spawn", () => {
            this.currentlyEquipping = false;
        });
        this.bot.on("death", () => {
            this.currentlyEquipping = false;
        });
        this.bot.on("playerCollect", this.playerCollectCheck.bind(this));
    }

    disable() {
        this.enabled = false;
    }

    enable() {
        this.enabled = true;
    }

    disableAuto() {
        this.autoReplace = false;
    }

    enableAuto() {
        this.autoReplace = true;
    }

    addBannedArmor(armorName: string) {
        this.bannedArmor.push(armorName);
    }

    removeBannedArmor(...armorNames: string[]) {
        this.bannedArmor = this.bannedArmor.filter((name) => !armorNames.includes(name));
    }

    calculateWorth(armorName: string, enchantments: NormalizedEnchant[] = []) {
        //@ts-expect-error
        return ((armorRankings[armorName] ?? armorRankings.other) + enchantments.map((enchant) => (enchantmentRankingsPerLevel[enchant.name] ?? enchantmentRankingsPerLevel.other) * enchant.lvl).reduce((a, b) => a + b, 0));
    }


    // This is messy but works on every version.
    // If there's a better way to get an item from an entity on the ground, let me know.
    armorFromGround(item: Entity) {
        let metadata = item.metadata.find((obj) => Object.keys(obj).some((key) => key.includes("Id")));

        //@ts-expect-error
        let key = metadata[Object.keys(metadata).find((key) => key.includes("Id"))];

        let rawitem = this.items[key];

        //@ts-expect-error
        let place = armorPlacement[rawitem.name] ?? armorPlacement.other;
        if (armorPieces.includes(place)) this.armorPiece(place);
    }

    
    async emitWrapper(func: (...args: any[]) => Promise<any> | Promise<void> | void, ...args: any) {
        if (this.currentlyEquipping) return;
        this.bot.emit("autoArmorStartedEquipping");
        this.currentlyEquipping = true;
        await func.bind(this)(...args);
        this.currentlyEquipping = false;
        this.bot.emit("autoArmorStoppedEquipping");
    }

    async unequipArmor(waitTicks?: number) {
        if (this.autoReplace) return;
        for (let i = 0; i < armorPieces.length; i++) {
            await this.bot.waitForTicks(this.waitTick ?? waitTicks);
            await this.bot.unequip(armorPieces[i]);
        }
    }

    async equipArmor(waitTicks?: number) {
        for (let i = 0; i < armorPieces.length; i++) {
            await this.bot.waitForTicks(this.waitTick ?? waitTicks);
            await this.armorPiece(armorPieces[i]);
        }
    }

    async checkForNoArmor(waitTicks?: number) {
        for (let i = 0; i < armorPieces.length; i++) {
            const piece = armorPieces[i];
            if (!this.bot.inventory.slots[this.bot.getEquipmentDestSlot(piece)]) {
                await this.bot.waitForTicks(this.waitTick ?? waitTicks);
                await this.armorPiece(piece);
            }
        }
    }


    async armorPiece(target: string, manual = false) {
        const bestChoices = this.bot.inventory
            .items()
            .filter((item) => item.name in armorRankings)
            .filter((item) => !this.bannedArmor.includes(item.name))
            //@ts-expect-error
            .filter((item) => armorPlacement[item.name] === target)
            .sort((a, b) => this.calculateWorth(b.name, b.enchants) - this.calculateWorth(a.name, a.enchants));

        if (bestChoices.length === 0) return manual ? Error("No Armor found.") : null;

        const bestArmor = bestChoices[0];
        const currentArmor = this.bot.inventory.slots[this.bot.getEquipmentDestSlot(target)];
        if (
            this.calculateWorth(currentArmor?.name ?? "other", currentArmor?.enchants) >
            this.calculateWorth(bestArmor.name, bestArmor.enchants)
        )
            return manual ? Error("Better armor already equipped.") : null;

        const requiresConfirmation = this.bot.inventory.requiresConfirmation;
        if (this.ignoreInventoryCheck) this.bot.inventory.requiresConfirmation = false;
        //@ts-expect-error
        const res = await promisfy(this.bot.equip(bestArmor, armorPlacement[bestArmor.name]));
        this.bot.inventory.requiresConfirmation = requiresConfirmation;

        if (res) this.bot.emit("autoArmorEquippedItem", bestArmor);

        return;
    }

    async onHealthArmorCheck() {
        if (!this.enabled || !this.autoReplace) return;
        try {
            await this.emitWrapper(this.checkForNoArmor);
        } catch (e) {}
    }

    async selfArmorCheck(who: Entity) {
        if (!this.enabled || who !== this.bot.entity || !this.autoReplace) return;
        try {
            await this.emitWrapper(this.checkForNoArmor);
        } catch (e) {}
    }

    async playerCollectCheck(who: Entity, item: Entity) {
        if (who.username !== this.bot.username || !this.checkOnItemPickup) return;
        try {
            await this.bot.waitForTicks(1);
            this.armorFromGround(item);
        } catch (e) {}
    }
}
