import {
    ATTRIBUTE_MAP,
    RACE_MAP,
    TRADITION_MAP,
} from "./data/maps.js"
import {
    SPELL_ENHANCEMENT_MAP,
    LITURGY_ENHANCEMENT_MAP
} from "./data/enhancements.js"

import { ITEM_TYPE_MAP } from "./data/items.js"
import {SPELL_MAP} from "./data/spells.js"
import {LITURGY_MAP} from "./data/liturgies.js"
import DSAItem from "../../systems/dsa5/modules/item/item-dsa5.js"

const locales = {
    "en": "en-US",
    "de": "de-DE"
}
var library
var localeData
var altLocaleData
var importErrors

async function getLocaleData(locale) {
    let response = await fetch(`modules/optolith-to-foundry/data/optolith-data-${locales[locale]}.json`)
    localeData = await response.json()

    // load 'de' data as backup in case a file with german-only content is imported
    if (locale == 'en') {
        response = await fetch(`modules/optolith-to-foundry/data/optolith-data-${locales['de']}.json`)
        altLocaleData = await response.json()    
    }

}

function localise(prefix,item,property='name') {
    try {
        var itemName = localeData[prefix][item][property]
        return itemName
    } catch (error) {
        console.warn(`Couldn't find \'${game.i18n.lang}\' translation for $${prefix}.${item}.${property}`)
        try {
            var itemName = altLocaleData[prefix][item][property]
            if (property == 'name') {
                itemName = `[de] ${itemName}`
            }
            return itemName
        } catch (error) {
            console.error(`Couldn't find any translation for $${prefix}.${item}.${property}`)
            return (property == 'name') ? item : null
        }
    }
    
}

function parseSkills(data, prefix) {

    var items = []
    data.forEach(s => {
        var item = {}
        let skillName = localise(prefix,s[0])
        item["name"] = skillName
        item["data"] = {
            "talentValue": {
                "value": s[1]
            }
        }
        items.push(item)
    });
    return items
}

function getSource(prefix,item) {
    let source
    const sourceData = localise(prefix,item,"source")
    if (sourceData != null) {
        let sources = []
        for (let src of sourceData) {
            try {
                var bookName = localise('Books',src.id)
              }
              catch(err) {
                var bookName = src.id
              }
            sources.push(`${bookName} <small>(Page: ${src.firstPage}</small>)`)
        }
        source = sources.join('<br>')
    } else {
        source = "Unknown"
    }
    return source
}


function parseSpells(data) {
    var items = []
    for (let spell of data) {
        let item = {}
        item.displayName = item.itemName = localise('Spells',spell[0])
        let type  = SPELL_MAP[spell[0]] ?? "spell"
        item.type = type
        item.data = {
            talentValue: {
                value: spell[1]
            }
        }
        item.source = getSource('Spells',spell[0])
        items.push(item)
    }
    return items
}

function parseLiturgies(data) {
    var items = []
    for (let spell of data) {
        let item = {}
        item.displayName = item.itemName = localise('LiturgicalChants',spell[0])
        let type  = LITURGY_MAP[spell[0]] ?? "liturgy"
        item.type = type
        item.data = {
            talentValue: {
                value: spell[1]
            }
        }
        item.source = getSource('LiturgicalChants',spell[0])
        items.push(item)
    }
    return items

}

function parseBlessings(data) {
    var items = []
    for (let item of data) {
        let newItem = {}
        newItem.displayName = newItem.itemName = localise('Blessings',item)
        newItem.type = "blessing"
        newItem.source = getSource('Blessings',item)
        items.push(newItem)
    }
    return items
}

function parseCantrips(data) {
    var items = []
    for (let item of data) {
        let newItem = {}
        newItem.displayName = newItem.itemName = localise('Cantrips',item)
        newItem.type = "magictrick"
        newItem.source = getSource('Cantrips',item)
        items.push(newItem)
    }
    return items
}


function parseActivatables(data) {
    var advantages = []
    var disadvantages = []
    var specialAbilities = []

    for (let a of data) {
        let id = a[0]
        switch (id.substring(0, id.indexOf('_'))) {
            case "ADV":
                for (let i of a[1]) { // multiple of same advantage
                    i.id = id
                    i.type = "advantage"
                    advantages.push(i)
                }
                break
            case "DISADV":
                for (let i of a[1]) {
                    i.id = id
                    i.type = "disadvantage"
                    disadvantages.push(i)
                }
                break
            case "SA":
                for (let i of a[1]) {
                    i.id = id
                    i.type = "specialability"
                    specialAbilities.push(i)
                }
                break
        }
    }

    return {
        advantages: advantages,
        disadvantages: disadvantages,
        specialAbilities: specialAbilities
    }
}

function getOption(prefix,item,option) {
    let options = localise(prefix,item,"options")
    if (options) {
        for (let o of options) {
            if (o.id == option) {
                return o.name
            }
        }
    }
    console.error(`Couldn't find option ${prefix}.${item}.${option}`)
    return `${game.i18n.localize("UI.Option")} ${option}`
}

function parseAbility(data) {
    var abilities = []
    for (let a of data) {
        switch (a.type) {
            case "advantage":
                var PREFIX = "Advantages"
                break
            case "disadvantage":
                var PREFIX = "Disadvantages"
                break
            case "specialability":
                var PREFIX = "SpecialAbilities"
                break
        }
        const baseName = localise(PREFIX,a.id)
        var itemName = baseName
        var displayName = baseName
        var ability = {}
        let source
        let effect
        switch (a.id) { // handle special cases
            case "ADV_0": // Custom
                itemName = displayName = a.sid
                source = "Custom Advantage"
                break
            case "DISADV_0": // Custom
                itemName = displayName = a.sid
                source = "Custom Disadvantage"
                break
            case "SA_0": // Custom
                itemName = displayName = a.sid
                source = "Custom Ability"
                var cost = a.cost
                break
            case "DISADV_3": // Bound to Artifact
                itemName = baseName + ' ()'
                displayName = baseName
                break
            // case "ADV_50": // Spellcaster, needed for correct AE
            //     effect = "+20 AE"
            //     break
            // case "ADV_12": // Blessed, needed for correct KP
            //     effect = "+20 KP"
            //     break
            case "SA_9": // Skill Specialization, need to localize both options
                itemName = `${baseName} ()`
                var option1 = localise('Skills',a.sid)
                var option2 = "Unknown"
                for (let appl of localeData['Skills'][a.sid]['applications']) {
                    if (appl['id'] == a.sid2) {
                        option2 = appl.name
                    }
                }
                displayName = `${baseName} (${option1}: ${option2})`
                break
            case "SA_70": // Tradition (Guild Mage)
                var option1 = localise('Spells',a.sid)
                displayName = `${baseName} (${option1})`
                break
            case "DISADV_33": // Personality Flaw
                var option1 = getOption('Disadvantages',a.id,a.sid)
                itemName = `${baseName} (${option1})`
                displayName = `${baseName} (${option1}: ${a.sid2})`
                break
            case "SA_414": {// Spell Enhancement
                a.type = "spellextension"
                let enhancement = localise('SpellEnhancements',a.sid)
                let targetSpell = localise('SpellEnhancements',a.sid,'target')
                let spell = localeData['Spells'][targetSpell].name
                displayName = `${spell} - ${enhancement}`
                itemName = `${spell} - ${enhancement}`
                ability.data = {
                    source: spell,
                    category: SPELL_MAP[SPELL_ENHANCEMENT_MAP[a.sid]]
                }
                break
            }
            case "SA_663": {// Liturgy Enhancement
                a.type = "spellextension"
                let enhancement = localise('LiturgicalChantEnhancements',a.sid)
                let targetSpell = localeData['LiturgicalChantEnhancements'][a.sid]['target']
                let spell = localeData['LiturgicalChants'][targetSpell].name
                displayName = `${spell} - ${enhancement}`
                itemName = `${spell} - ${enhancement}`
                ability.data = {
                    source: spell,
                    category: LITURGY_MAP[LITURGY_ENHANCEMENT_MAP[a.sid]]
                }
                break
            }
            default:
                if (a.sid) {
                    itemName = baseName + ' ()'
                    if (typeof (a.sid) == "number") {
                        var option1 = getOption(PREFIX,a.id,a.sid)
                        displayName = `${baseName} (${option1})`
                    } else {
                        switch (a.sid.substring(0, a.sid.indexOf('_'))) {
                            case "TAL":
                                var option1 = localise('Skills',a.sid)
                                break
                            case "CT":
                                var option1 = localise('CombatTechniques',a.sid)
                                break
                            case "SPELL":
                                var option1 = localise('Spells',a.sid)
                                break
                            case "LITURGY":
                                var option1 = localise('LiturgicalChants',a.sid)
                                break
                            default:
                                var option1 = a.sid
                                break
                        }
                        displayName = `${baseName} (${option1})`
                    }
                }
                if (a.sid2) {
                    if (typeof (a.sid2) == "number") {
                        var option2 = getOption(PREFIX,a.id,a.sid2)
                    } else {
                        switch (a.sid2.substring(0, a.sid2.indexOf('_'))) {
                            case "TAL":
                                var option2 = localise('Skills',a.sid2)
                                break
                            case "CT":
                                var option2 = localise('CombatTechniques',a.sid2)
                                break
                            case "SPELL":
                                var option2 = localise('Spells',a.sid2)
                                break
                            case "LITURGY":
                                var option2 = localise('LiturgicalChants',a.sid2)
                                break
                            default:
                                var option2 = a.sid2
                                break
                        }
                    }
                    displayName = `${baseName} (${option1}: ${option2})`
                }
    
        }
        if (!source) {
            source = getSource(PREFIX,a.id)
        }
        if (game.dsa5.config.AbilitiesNeedingAdaption[itemName] &&  game.dsa5.config.AbilitiesNeedingAdaption[itemName].effect) {
            ability.effect = `${option1} ${game.dsa5.config.AbilitiesNeedingAdaption[itemName].effect}`
        }
        if (game.dsa5.config.vantagesNeedingAdaption[itemName] &&  game.dsa5.config.vantagesNeedingAdaption[itemName].effect) {
            ability.effect = `${option1} ${game.dsa5.config.vantagesNeedingAdaption[itemName].effect}`
        }

        ability.type = a.type
        ability.itemName = itemName
        ability.displayName = displayName
        ability.oID = a.id
        if (a.tier) {
            ability.value = a.tier
        }
        if (effect) {
            ability.effect = effect
        }
        if (source) {
            ability.source = source
        }
        if (cost) {
            ability.cost = cost
        }
        abilities.push(ability)

    }
    return abilities
}

async function parseBelongings(data) {
    const {
        ITEM_TYPE_MAP,
        ITEM_CATEGORY_MAP
    } = await import("./data/items.js");
    var items = []
    for (const item of data) {
        let newItem = {}
        let itemID = item[1].template
        if (itemID) {
            if (!item[1].isTemplateLocked) {
                console.warn(`custom item:  ${item[1].name}`)
                newItem.custom = true
                newItem.displayName = newItem.itemName = item[1].name
                newItem.source = "Custom Item"
            } else {
                newItem.displayName = newItem.itemName = localise('Items',itemID)
                newItem.source = getSource('Items',itemID)
            }
    
            if (!(newItem.type = ITEM_TYPE_MAP[item[1].gr])) {
                newItem.type = "equipment"
            }
        } else {
            newItem.displayName = newItem.itemName = item[1].name
            newItem.source = "Custom Item"
            if (!(newItem.type = ITEM_TYPE_MAP[item[1].gr])) {
                newItem.type = "equipment"
            }
        }
        newItem.data = {
            quantity: {
                value: item[1].amount
            },
            equipmentType: {
                value: ITEM_CATEGORY_MAP[item[1].gr]
            },

        }
        items.push(newItem)
    }
    return items
}

function createCustomItem(item) {
    // add custom item
    let newItem = {
        name: item.displayName,
        type: item.type,
        img: DSAItem.defaultImages[item.type],
        data: {
            ...item.data,
            ...{
                description: {
                    value: `<p>Source:</p><p>${item.source}</p>`
                },
                weight: {
                    value: 0 // workaround bug with rangeweapons
                }
            }
        }
    }
    if (item.value) {
        newItem.data.step = {
            value: item.value
        }
    }
    if (item.effect) {
        newItem.data.effect = {
            value: item.effect
        }
    }
    if (item.cost) {
        newItem.data.cost = {
            value: item.cost
        }
    }
    return newItem
}

function getBestItem(items) {
    for (let item of items) {
        if (item.pack.startsWith('dsa5-core.')) {
            continue
        } else {
            // TODO implement a proper pack hierarchy.
            console.log(`Choosing ${item.name} from pack: ${item.pack}`)
            return item
        }

    }
}

function findMatch(itemName,items) {
    let matches = items.filter(i => i.name.toLowerCase() == itemName.toLowerCase() )
    if (matches.length == 1) { 
        return matches[0] 
    } else if (matches.length > 1) {
        return getBestItem(matches)
    } else {
        return null
    }
}

async function getItem(item) {
    let search = item.displayName
    let results = await library.findCompendiumItem(search,item.type)
    if (results.length == 0) {
        search = item.itemName
        results = await library.findCompendiumItem(search,item.type)
    }

    let match = findMatch(search, results)
    if (!match) {
        switch (item.type) {
            case 'meleeweapon':
                match = findMatch(search+' (2H)',results)
                break;
            default:
                match = null
                break;
        }
    }
    return match
}

function addTradition(tradition, actor) {
    let traditionName = tradition.name.match(/Tradition \((.+)\)/)[1]
    if (traditionName.startsWith("Guild Mage")) traditionName = "Guild Mage"
    if (traditionName.startsWith("Gildenmagier")) traditionName = "Gildenmagier"

    let regex = (game.i18n.lang == 'en')? /(?:The primary attribute of \w+ Tradition|This Tradition’s primary attribute) is (\w+)/ : /Leiteigenschaft \w+ Tradition ist (\w+)\./ 
    let result = tradition.system.description.value.match(regex)
    if (result) {
        
        for (let a in localeData['Attributes']) {
            if (localeData['Attributes'][a]['name'] == result[1]) {
                var primaryAttribute = ATTRIBUTE_MAP[a]
                if (TRADITION_MAP.hasOwnProperty(traditionName)) {
                    traditionName = TRADITION_MAP[traditionName]
                }

                if (tradition.system.category.value == 'clerical') {
                    actor.update({
                        "data.guidevalue.clerical": primaryAttribute,
                        "data.tradition.clerical": traditionName
                    })
                } else {
                    actor.update({
                        "data.guidevalue.magical": primaryAttribute,
                        "data.tradition.magical": traditionName
                })
                }
            }
        }
    }

}

async function addFromLibraryV2(actor, items, index, types) {
    for (let item of items) {

        // let search = item.displayName
        // let result = await index.findCompendiumItem(search,item.type)
        // if (result.length == 0) {
        //     search = item.itemName
        //     result = await index.findCompendiumItem(search,item.type)
        // }
    
        // // TODO: if weapon, try " (2H)"" after name
        // if (result.length > 0) {
        //     if (result.length == 1) {
        //         result = result[0]
        //     } else {

        //         // need to filter because findCompendiumItem() doesn't match name exactly
        //         let matches = result.filter(i => i.name.toLowerCase() == item.displayName.toLowerCase() || i.name.toLowerCase() == item.itemName.toLowerCase())
        //         if (matches.length > 0) {
        //             if (matches.length == 1) {
        //                 result = matches[0]
        //             } else if (matches.length > 1) {
        //                 let packs = []
        //                 for (let p of result) {
        //                     packs.push(p.pack)
        //                 }
        //                 console.warn(`Multiple matches found for ${item.displayName}: ${packs}`)

        //                 for (let i of result) {
        //                     if (i.pack.startsWith('dsa5-core.')) {
        //                         continue
        //                     } else {
        //                         console.warn(`Choosing pack: ${i.pack}`)
        //                         result = i
        //                         break
        //                     }
        //                 }
        //             }
        //         } else { // multiple items but no exact match, can't be certain
        //             console.warn(`Multiple matches found for ${item.displayName}`)
        //             importErrors.push({
        //                 itemName: item.itemName,
        //                 displayName: item.displayName,
        //                 type: item.type,
        //                 source: item.source
        //             })
        //             // add custom item
        //             let newItem = createCustomItem(item)
        //             await actor.createEmbeddedDocuments("Item",[newItem])
        //             continue
        //         }
        
        //     }
        let result = await getItem(item)
        if (result) {
            var newData = JSON.parse(JSON.stringify(result))
            newData.name = item.displayName
            if (newData.system.maxRank && item.value > newData.system.maxRank.value) {
                newData.system.step = {
                    value: newData.system.maxRank.value
                }
            } else {
                newData.system.step = {
                    value: item.value
                }
            }
            if (item.data) {
                newData.system = {
                    ...newData.system,
                    ...item.data
                }
            }
            if (item.effect) {
                newData.system.effect = item.effect
            }
            await actor.createEmbeddedDocuments("Item",[newData])

            // if adding a Religious/Magical Tradition, try to add the primary attribute
            let tradition = item.displayName.match(/Tradition \((.+)\)/)
            if (tradition) {
                // console.warn('Adding a tradition')
                // console.warn(`Tradition name: ${tradition[1]}`)
            addTradition(newData,actor)
            // if (item.displayName.startsWith('Tradition')) {
                // let regex = (game.i18n.lang == 'en')? /The primary attribute of \w+ Tradition is (\w+)\./ : /Leiteigenschaft \w+ Tradition ist (\w+)\./ 
                // let result = newData.data.description.value.match(regex)
                // if (result) {
                //     for (let a in localeData['Attributes']) {
                //         if (localeData['Attributes'][a]['name'] == result[1]) {
                //             var primaryAttribute = ATTRIBUTE_MAP[a]
                //             var traditionName = (TRADITION_MAP[tradition[1]]) ? TRADITION_MAP[tradition[1]] : tradition[1]
                //             if (newData.data.category.value == 'clerical') {
                //                 actor.update({
                //                     "data.guidevalue.clerical": primaryAttribute,
                //                     "data.tradition.clerical": traditionName
                //                 })
                //             } else {
                //                 actor.update({
                //                     "data.guidevalue.magical": primaryAttribute,
                //                     "data.tradition.magical": traditionName
                //             })
                //             }
                //         }
                //     }
                // } else {
                //     importErrors.push({
                //         itemName: item.itemName,
                //         displayName: item.displayName,
                //         type: item.type,
                //         source: item.source
                //     })
                // }
            }

        } else {
            importErrors.push({
                itemName: item.itemName,
                displayName: item.displayName,
                type: item.type,
                source: item.source
            })
            // add custom item
            let newItem = createCustomItem(item)
            await actor.createEmbeddedDocuments("Item",[newItem])
        }
    }

}

async function importFromJSON(json, options) {

    library = game.dsa5.itemLibrary
    // await game.dsa5.itemLibrary.buildEquipmentIndex()
    // const index = game.dsa5.itemLibrary.equipmentIndex

    let actor = null
    importErrors = []
    const data = JSON.parse(json)

    const ATTR_IDS = ["mu", "kl", "in", "ch", "ff", "ge", "ko", "kk"]
    var characteristics = {}

    for (let attr of ATTR_IDS) {
        characteristics[attr] = {
            advances: 0
        }
    }

    for (let attr of data.attr.values) {
        var attributeID = ATTRIBUTE_MAP[attr.id]
        var advances = attr.value - 8
        characteristics[attributeID] = {
            // "species": species,
            "advances": advances
        }
    }
    // var improvedAttibuteMax = sheet.attr.attributeAdjustmentSelected

    var skills = parseSkills(Object.entries(data.talents),"Skills")
    var combatSkills = parseSkills(Object.entries(data.ct),"CombatTechniques")

    var spells = parseSpells(Object.entries(data.spells))

    var cantrips = parseCantrips(data.cantrips) // array not object

    var blessings = parseBlessings(data.blessings) // array not object

    var liturgies = parseLiturgies(Object.entries(data.liturgies))

    const allActivatables = parseActivatables(Object.entries(data.activatable))

    var allAdvantages = parseAbility(allActivatables.advantages)

    var allDisadvantages = parseAbility(allActivatables.disadvantages)

    var allAbilities = parseAbility(allActivatables.specialAbilities)

    var belongings = await parseBelongings(Object.entries(data.belongings.items))

    // can use IDs if they don't change
    var money = [{
            id: "OCRi6UuKBIHCbZuF",
            quantity: data.belongings.purse.d
        },
        {
            id: "xN0OtnyZqB4BaWAX",
            quantity: data.belongings.purse.s
        },
        {
            id: "G4piFlEAWb2stJCn",
            quantity: data.belongings.purse.h
        },
        {
            id: "NDf42upvVWmHi8Ty",
            quantity: data.belongings.purse.k
        }
    ]

    // setup base character data
    let race = data.r
    if (data.rv) {
        var species = `${localise('Races',race)} (${localise('RaceVariants',data.rv)})`
    } else {
        var species = localise('Races',race)
    }

    if (data.p == "P_0") {
        var profession = data.professionName
    } else {
        var profession = localise('Professions',data.p)
        if (typeof profession == "object") {
            profession = profession[data.sex]
        }
    }

    var charData = {}
    charData.name = data.name
    charData.type = "character"
    charData.system = {
        characteristics: characteristics,
        details: {
            experience: {
                total: data.ap.total
            },
            species: {
                value: species
            },
            gender: {
                value: game.i18n.localize(`SEX.${data.sex}`)
            },
            culture: {
                value: `${data.c ? localise('Cultures',data.c) : ""}`
            },
            career: {
                value: profession
            },
            socialstate: {
                value: `${data.pers.socialstatus ? localise('SocialStatuses',data.pers.socialstatus) : ""}`
            },
            family: {
                value: data.pers.family
            },
            age: {
                value: data.pers.age
            },
            haircolor: {
                value: `${data.pers.haircolor ? localise('HairColors',data.pers.haircolor) : ""}`
            },
            eyecolor: {
                value: `${data.pers.eyecolor ? localise('EyeColors',data.pers.eyecolor) : ""}`
            },
            height: {
                value: data.pers.size
            },
            weight: {
                value: data.pers.weight
            },
            distinguishingmark: {
                value: data.pers.characteristics
            },
            Home: {
                value: data.pers.placeofbirth
            },
            biography: { // TODO: localise
                value: `${ data.pers.dateofbirth ? `Birthdate: ${data.pers.dateofbirth}` : ""} ${data.pers.title ? `<br>Title: ${data.pers.title}` : ""} `
            },
            notes: {
                value: data.pers.otherinfo
            }
        },
        status: {
            wounds: {
                initial: RACE_MAP[race].lp,
                advances: data.attr.lp,
                value: (characteristics['ko'].advances + 8) * 2 + RACE_MAP[race].lp // set to max LP
            },
            soulpower: {
                initial: RACE_MAP[race].spi,
            },
            toughness: {
                initial: RACE_MAP[race].tou
            },
            speed: {
                initial: RACE_MAP[race].mov
            },
            astralenergy: {
                advances: data.attr.ae
            },
            karmaenergy: {
                advances: data.attr.kp
            }
        }
    }

    actor = await CONFIG.Actor.documentClass.create(charData, {
        renderSheet: false
    })

    // update skills by finding skill name
    for (let s of skills) {
        let item = actor.items.find(i => i.name === s.name && i.type == "skill")
        if (item) {
            const update = {
                _id: item.id,
                'data.talentValue.value': s.data.talentValue.value
            }
            await actor.updateEmbeddedDocuments("Item",[update])
    
        } else {
            console.error(`Can't find skill: ${s.name}`)
        }
    }

    for (let s of combatSkills) {
        let item = actor.items.find(i => i.name === s.name && i.type == "combatskill")
        if (item) {
            const update = {
                _id: item.id,
                'data.talentValue.value': s.data.talentValue.value
            }
            await actor.updateEmbeddedDocuments("Item",[update])
    
        } else {
            console.error(`Can't find combat technique: ${s.name}`)
        }
    }

    // update money by ID
    for (let coin of money) {
        const update = {
            _id: coin.id,
            'data.quantity.value': (coin.quantity ? coin.quantity : 0)
        }
        await actor.updateEmbeddedDocuments("Item",[update]);
    }

    let allVantages = allAdvantages.concat(allDisadvantages)

    await addFromLibraryV2(actor, allVantages, library)
    await addFromLibraryV2(actor, allAbilities, library)    
    await addFromLibraryV2(actor, spells, library, ["spell", "ritual"])
    await addFromLibraryV2(actor, cantrips, library)
    await addFromLibraryV2(actor, blessings, library)
    await addFromLibraryV2(actor, liturgies, library, ["liturgy", "ceremony"])
    await addFromLibraryV2(actor, belongings, library, ["equipment"])

    importErrors.sort()
    let importErrorsList = []
    for (let error of importErrors) {
        importErrorsList.push(`<tr><td><i>${game.i18n.localize(`ITEMTYPE.${error.type}`)}</i></td><td><b>${error.displayName}</b></td><td>${error.source}</td></tr>`)
    }
    let importErrorsMessage = `<p>${game.i18n.localize('UI.ErrorResultIntro')}:</p>
        <table>
        <tr><th>${game.i18n.localize('UI.ItemType')}</th><th>${game.i18n.localize('UI.Name')}</th><th>${game.i18n.localize('UI.Source')}</th></tr>
        ${importErrorsList.join('')}
        </table>
        `

    actor.update({
        "data.status.wounds.value": actor.system.status.wounds.initial + actor.system.characteristics["ko"].value * 2,
        "data.status.astralenergy.value": actor.system.status.astralenergy.max,
        "data.status.karmaenergy.value": actor.system.status.karmaenergy.max
    })

    console.log(`Optolith to Foundry Importer | Finished creating actor id: ${actor.id} name: ${actor.name}`)
    let sheet = await actor.sheet.render(true)

    if (importErrors.length > 0) {
        console.log(`Optolith to Foundry Importer | Items that were not found in Library:`)
        console.log(importErrors)
        ui.notifications.warn(`${actor.name} ${game.i18n.localize('UI.ImportResultsUnrecognised')}`)
        if (options.addResultsToNotes) {
            actor.update({
                "data.details.notes.value": actor.system.details.notes.value + '<br>' + importErrorsMessage
            })
        }
        if (options.showResultsDialog) {
            new Dialog({
                title: `${game.i18n.localize('UI.ImportResultsTitle')} ${actor.name}`,
                content: importErrorsMessage,
                buttons: {
                    ok: {
                        icon: "<i class='fas fa-check'></i>",
                        label: `${game.i18n.localize('UI.OK')}`
                    }
                },
                default: 'ok'
            }, {
                width: 700
            }).render(true)
        }
    } else {
        ui.notifications.info(`${actor.name} ${game.i18n.localize('UI.ImportResultsSuccess')}`)
    }

}

function importFromOptolithDialog() {
    new Dialog({
        title: `${game.i18n.localize('UI.ImportFile')}`,
        content: `
            <form autocomplete="off" onsubmit="event.preventDefault();">
                <p class="notes">${game.i18n.localize('UI.ImportDialogIntro')}.</p>
                <p class="notes">${game.i18n.localize('UI.ImportDialogNewActor')}.</p>
                <div class="form-group-stacked">
                    <p><label for="data">${game.i18n.localize('UI.jsonFile')}</label><br>
                    <input type="file" name="data"/></p>
                    <p>${game.i18n.localize('UI.Results')}:</p>
                    <p>
                        <input type="checkbox" name="popup"/>
                        <label for="popup">${game.i18n.localize('UI.showPopup')}</label>
                    </p>
                    <p>
                        <input type="checkbox" name="notes" checked />
                        <label for="notes">${game.i18n.localize('UI.addToNotes')}</label>
                    </p>


                </div>
            </form>
            `,
        buttons: {
            import: {
                icon: '<i class="fas fa-file-import"></i>',
                label: `${game.i18n.localize('UI.Import')}`,
                callback: html => {
                    const form = html.find("form")[0];
                    if (!form.data.files.length) return ui.notifications.error(`${game.i18n.localize('UI.noFileSelected')}`)
                    var options = {
                        showResultsDialog: form.popup.checked,
                        addResultsToNotes: form.notes.checked
                    }
                    readTextFromFile(form.data.files[0]).then(json => importFromJSON(json, options));
                }
            },
            no: {
                icon: '<i class="fas fa-times"></i>',
                label: `${game.i18n.localize('UI.Cancel')}`
            }
        },
        default: "import"
    }, {
        width: 400
    }).render(true);
}

Hooks.on("ready", (app, html, data) => {
    if (game.user.can("create")) {
        getLocaleData(game.i18n.lang)
        console.log(`Optolith to Foundry | Loaded data file for locale: ${game.i18n.lang}`)
    }
})

Hooks.on("renderActorDirectory", (app, html, data) => {
    if (game.user.can("create")) {
        const button = $(`<button title="${game.i18n.localize("UI.ImportFile")}"><i class="fas fa-file-import"></i>${game.i18n.localize("UI.Import")}</button>`);
        html.find(".header-actions").append(button);
        button.click(() => importFromOptolithDialog())
    }
})