"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoArmor = void 0;
const armorPieces = [
    "head", "torso", "legs", "feet", "off-hand"
];
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
    other: "hand"
};
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
    other: 0
};
const enchantmentRankingsPerLevel = {
    mending: 1,
    protection: 0.5,
    blast_protection: 0.4,
    frost_walker: 0.4,
    thorns: 0.33,
    soul_speed: 0.33,
    unbreaking: 0.2,
    other: 0
};
function plugin(bot) {
    const autoarmor = new autoArmor(bot);
    bot.autoArmor = autoarmor;
}
exports.default = plugin;
class autoArmor {
    constructor(bot, options) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        this.bot = bot;
        this.enabled = (_a = options === null || options === void 0 ? void 0 : options.disabled) !== null && _a !== void 0 ? _a : true,
            this.autoEquip = (_b = options === null || options === void 0 ? void 0 : options.autoEquip) !== null && _b !== void 0 ? _b : false,
            this.waitTick = (_c = options === null || options === void 0 ? void 0 : options.waitTick) !== null && _c !== void 0 ? _c : 1;
        this.priority = (_d = options === null || options === void 0 ? void 0 : options.priority) !== null && _d !== void 0 ? _d : 'raw', //* planned "durability" | "enchantments" | "armorType" | "raw"
            this.bannedArmor = (_e = options === null || options === void 0 ? void 0 : options.bannedArmor) !== null && _e !== void 0 ? _e : [],
            this.wornArmor = (_f = options === null || options === void 0 ? void 0 : options.wornArmor) !== null && _f !== void 0 ? _f : new Map();
        this.ignoreInventoryCheck = (_g = options === null || options === void 0 ? void 0 : options.ignoreInventoryCheck) !== null && _g !== void 0 ? _g : false,
            this.checkOnItemPickup = (_h = options === null || options === void 0 ? void 0 : options.checkOnItemPickup) !== null && _h !== void 0 ? _h : true,
            this.currentlyEquipping = false;
        this.items = {};
        this.bot.once("spawn", () => {
            this.items = require('minecraft-data')(this.bot.version).items;
        });
        this.bot.on('entityAttributes', this.selfArmorCheck.bind(this));
        this.bot.on('health', this.onHealthArmorCheck.bind(this));
        this.bot.on('spawn', this.disable.bind(this));
        this.bot.on('death', this.disable.bind(this));
        this.bot.on('playerCollect', this.playerCollectCheck.bind(this));
    }
    disable() {
        this.enabled = false;
    }
    enable() {
        this.enabled = true;
    }
    disableAuto() {
        this.autoEquip = false;
    }
    enableAuto() {
        this.autoEquip = true;
    }
    addBannedArmor(armorName) {
        this.bannedArmor.push(armorName);
    }
    removeBannedArmor(armorName) {
        this.bannedArmor = this.bannedArmor.filter(name => name !== armorName);
    }
    timeoutAfter(time, message) {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(message));
            }, time);
        });
    }
    calculateWorth(armorName, enchantments = []) {
        var _a;
        //@ts-expect-error
        return (((_a = armorRankings[armorName]) !== null && _a !== void 0 ? _a : armorRankings.other) + enchantments.map(enchant => { var _a; return ((_a = enchantmentRankingsPerLevel[enchant.name]) !== null && _a !== void 0 ? _a : enchantmentRankingsPerLevel.other) * enchant.lvl; }).reduce((a, b) => a + b, 0));
    }
    emitWrapper(func, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.currentlyEquipping)
                return;
            this.currentlyEquipping = true;
            yield func(...args);
            this.currentlyEquipping = false;
        });
    }
    unequipArmor(waitTicks) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.autoEquip)
                return this.bot.chat("I can't remove my armor: autoEquip is active.");
            for (let i = 0; i < armorPieces.length; i++) {
                yield this.bot.waitForTicks(waitTicks !== null && waitTicks !== void 0 ? waitTicks : this.waitTick);
                yield this.bot.unequip(armorPieces[i]);
            }
        });
    }
    equipArmor(waitTicks) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < armorPieces.length; i++) {
                yield this.bot.waitForTicks(this.waitTick);
                yield this.armorPiece(armorPieces[i]);
            }
        });
    }
    checkForNoArmor() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < armorPieces.length; i++) {
                let piece = armorPieces[i];
                if (!this.bot.inventory.slots[this.bot.getEquipmentDestSlot(piece)]) {
                    yield this.bot.waitForTicks(this.waitTick);
                    yield this.armorPiece(piece);
                }
            }
        });
    }
    // This is messy but works on every version. 
    // If there's a better way to get an item from an entity on the ground, let me know.
    armorFromGround(item) {
        var _a;
        let metadata = item.metadata.find(obj => Object.keys(obj).some(key => key.includes("Id")));
        //@ts-expect-error
        let key = metadata[Object.keys(metadata).find(key => key.includes("Id"))];
        let rawitem = this.items[key];
        //@ts-expect-error
        let place = (_a = armorPlacement[rawitem.name]) !== null && _a !== void 0 ? _a : armorPlacement.other;
        if (armorPieces.includes(place))
            this.armorPiece(place);
    }
    armorPiece(target, callback, manual = false) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            callback = callback || ((e) => { });
            const bestChoices = this.bot.inventory
                .items()
                .filter((item) => item.name in armorRankings)
                .filter((item) => !this.bannedArmor.includes(item.name))
                //@ts-expect-error
                .filter((item) => armorPlacement[item.name] === target)
                .sort((a, b) => this.calculateWorth(b.name, b.enchants) - this.calculateWorth(a.name, a.enchants));
            if (bestChoices.length === 0) {
                if (!manual)
                    return callback(null);
                else
                    return callback(new Error('No Armor found.'));
            }
            const bestArmor = bestChoices[0];
            const currentArmor = this.bot.inventory.slots[this.bot.getEquipmentDestSlot(target)];
            if (this.calculateWorth((_a = currentArmor === null || currentArmor === void 0 ? void 0 : currentArmor.name) !== null && _a !== void 0 ? _a : "other", currentArmor === null || currentArmor === void 0 ? void 0 : currentArmor.enchants) > this.calculateWorth(bestArmor.name, bestArmor.enchants)) {
                if (!manual) {
                    return callback(null);
                }
                else {
                    return callback(new Error('Better armor already equipped.'));
                }
            }
            try {
                const requiresConfirmation = this.bot.inventory.requiresConfirmation;
                if (this.ignoreInventoryCheck)
                    this.bot.inventory.requiresConfirmation = false;
                //@ts-expect-error
                yield this.bot.equip(bestArmor, armorPlacement[bestArmor.name]);
                this.bot.inventory.requiresConfirmation = requiresConfirmation;
            }
            catch (error) {
                return callback(error);
            }
            return callback(null);
        });
    }
    onHealthArmorCheck() {
        if (!this.enabled || !this.autoEquip)
            return;
        try {
            this.emitWrapper(this.checkForNoArmor);
        }
        catch (e) { }
    }
    selfArmorCheck(who) {
        if (!this.enabled || who !== this.bot.entity || !this.autoEquip)
            return;
        try {
            this.emitWrapper(this.checkForNoArmor);
        }
        catch (e) { }
    }
    playerCollectCheck(who, item) {
        return __awaiter(this, void 0, void 0, function* () {
            if (who.username !== this.bot.username || !this.checkOnItemPickup)
                return;
            try {
                yield this.bot.waitForTicks(1);
                this.armorFromGround(item);
            }
            catch (e) { }
        });
    }
}
exports.autoArmor = autoArmor;
//# sourceMappingURL=index.js.map