// @ts-nocheck
const mineflayer = require('mineflayer')
const autoarmor = require('../index')

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

const bot = mineflayer.createBot({
    host: process.env.SERVER_HOST ?? "localhost",
    port: process.env.SERVER_PORT ?? 25565,
    username: 'autoarmor-test'
})

bot.loadPlugin(autoarmor)


bot.once('spawn', async () => {
    bot.chat('/kill')

    setTimeout(() => {
        bot.chat('/clear')
    }, 1 * 1000)


    for (let item of ["helmet", "chestplate", "leggings", "boots"]) {
        await sleep(1 * 1000)
        bot.chat('/give @s minecraft:iron_' + item)
        
    }

    bot.chat("/give @s minecraft:shield")
    await sleep(1 * 1000)

    bot.autoArmor.checkForNoArmor()



    await sleep(1 * 1000)

    
    let failCount = 0;


    for (let piece of ["head", "torso",  "legs" , "feet", "off-hand"]) {
        if (!bot.inventory.slots[bot.getEquipmentDestSlot(piece)]) {
            bot.chat(piece + " failed to equip!");
            failCount += 1
        }
    }

    bot.chat((failCount === 0 ? "Test succeeded!" : `Test failed.`)  + ` ${5 - failCount}/5 items equipped.`)
    return ;
})

bot.on('chat', (username, message) => {
    console.log(`<${username}> ${message}`)
})
