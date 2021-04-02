import {
    ATTRIBUTE_MAP,
    RACE_MAP,
    SKILL_MAP,
    COMBAT_SKILL_MAP
} from "./data/maps.js"
import DSAItem from "../../systems/dsa5/modules/item/item-dsa5.js"

var importErrors

function parseSkills(data, prefix) {

    var items = []
    data.forEach(s => {
        // console.log(`${skillMap[s[0]]}: ${s[1]}`)
        var item = {}
        item["name"] = game.i18n.localize(`${prefix}.${s[0]}`)
        item["data"] = {
            "talentValue": {
                "value": s[1]
            }
        }
        items.push(item)
        // console.log(item)
    });
    return items
}

async function parseSpells(data) {
    const SPELLS = await fetch('modules/optolith-to-foundry/data/spells.json').then((response) => {return response.json() })

    const {
        SPELL_MAP
    } = await import("./data/spells.js")
    var items = []
    for (let spell of data) {
        let item = {}
        // spell[0] = "SPELL_58"
        let spellID = spell[0]
        item.displayName = item.itemName = SPELLS[spell[0]].name
        item.type = "spell"
        item.data = {
            talentValue: {
                value: spell[1]
            }
        }
        let sourceData = SPELLS[spell[0]].src
        let sources = []
        for (let src of sourceData) {
            sources.push(`${game.i18n.localize(`BOOK.${src.src}`)} <small>(Page: ${src.page}</small>)`)
        }
        if (!SPELL_MAP[spell[0]]) {
            console.log(`Optolith to Foundry Importer | Couldn't map spell: ${spell[0]}`)
        } else {
            item.customData = {
                characteristic1: {
                    value: ATTRIBUTE_MAP[`${SPELL_MAP[spellID].check1}`]
                },
                characteristic2: {
                    value: ATTRIBUTE_MAP[`${SPELL_MAP[spellID].check2}`]
                },
                characteristic3: {
                    value: ATTRIBUTE_MAP[`${SPELL_MAP[spellID].check3}`]
                }
            }
        }
        item.source = sources.join("<br>")
        items.push(item)
    }
    return items
}

async function parseLiturgies(data) {
    const LITURGIES = await fetch('modules/optolith-to-foundry/data/liturgies.json').then((response) => {return response.json() })
    var items = []
    for (let spell of data) {
        let item = {}
        // console.log(spell[0])
        // spell[0] = "SPELL_58"
        let spellID = spell[0]
        item.displayName = item.itemName = LITURGIES[spell[0]].name
        item.type = "liturgy"
        item.data = {
            talentValue: {
                value: spell[1]
            }
        }
        let sourceData = LITURGIES[spell[0]].src
        let sources = []
        for (let src of sourceData) {
            sources.push(`${game.i18n.localize(`BOOK.${src.src}`)} <small>(Page: ${src.page}</i>)`)
        }
        items.push(item)
    }
    return items
    
}

async function parseBlessings(data) {
    const BLESSINGS = await fetch('modules/optolith-to-foundry/data/blessings.json').then((response) => {return response.json() })

    var items = []
    for (let item of data) {
        let newItem = {}
        newItem.displayName = newItem.itemName = BLESSINGS[item].name
        newItem.type = "blessing"
        items.push(newItem)
    }
    // console.log(items)
    return items
}

async function parseCantrips(data) {
    const CANTRIPS = await fetch('modules/optolith-to-foundry/data/cantrips.json').then((response) => {return response.json() })

    var items = []
    for (let item of data) {
        let newItem = {}
        newItem.displayName = newItem.itemName = CANTRIPS[item].name
        newItem.type = "magictrick"
        items.push(newItem)
    }
    // console.log(items)
    return items
}


function parseActivatables(data) {
    var advantages = []
    var disadvantages = []
    var specialAbilities = []

    for (let a of data) {
        let id = a[0]
        switch(id.substring(0, id.indexOf('_'))) {
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

    return {advantages: advantages, disadvantages: disadvantages, specialAbilities: specialAbilities}
}

function parseAbility(data) {
    var abilities = []
    for (let a of data) {
        switch(a.type) {
            case "advantage":
                var PREFIX = "ADVANTAGE"
                break
            case "disadvantage":
                var PREFIX = "DISADVANTAGE"
                break
            case "specialability":
                var PREFIX = "ABILITY"
                break
        }
        var baseName = game.i18n.localize(`${PREFIX}.${a.id}.name`)
        var itemName = baseName
        var displayName = baseName
        var ability = {}
        switch (a.id) { // handle special cases
            case "ADV_0": // Custom
                itemName = displayName = a.sid
                var source = "Custom Advantage"
                break
            case "DISADV_0": // Custom
                itemName = displayName = a.sid
                var source = "Custom Disadvantage"
                break
            case "SA_0": // Custom
                itemName = displayName = a.sid
                var source = "Custom Ability"
                var cost = a.cost
                break
            case "ADV_50": // Spellcaster, needed for correct AE
                var effect = "+20 AE"
                break
            case "ADV_12": // Blessed, needed for correct KP
                var effect = "+20 KP"
                break
            case "SA_9": // Skill Specialization, need to localize both options
                itemName = `${baseName} ()`
                var option1 = game.i18n.localize(`SKILL.${a.sid}`)
                var option2 = game.i18n.localize(`SPECIALISATION.${a.sid}.${a.sid2}`)
                displayName = `${baseName} (${option1}: ${option2})`
                var effect = `${option1} FP2`
                break
            case "DISADV_34":
            case "SA_12": // Terrain Knowledge 
            case "SA_28": // Writing
            case "SA_87": // Aspect Knowledge // These have pre-defined options that Foundry doesn't have pre-made items for
                itemName = `${itemName} ()`
                var option1 = game.i18n.localize(`${a.id}.options.${a.sid - 1}`)
                displayName = `${baseName} (${option1})`
                break
            default:
                if (a.sid) {
                    if (typeof (a.sid) == "number") {
                        var option1 = game.i18n.localize(`${PREFIX}.${a.id}.options.${a.sid - 1}`)
                        itemName = displayName = `${baseName} (${option1})`
                    } else {
                        switch (a.sid.substring(0, a.sid.indexOf('_'))) {
                            case "TAL":
                                var option1 = game.i18n.localize(`SKILL.${a.sid}`)
                                break
                            case "CT":
                                var option1 = game.i18n.localize(`COMBATSKILL.${a.sid}`)
                                break
                            case "SPELL":
                                var option1 = game.i18n.localize(`SPELL.${a.sid}.name`)
                                break
                            default:
                                var option1 = a.sid
                                break
                        }
                        if (!baseName.includes('(')) {
                            itemName = `${baseName} ()`
                        }
                        displayName = `${baseName} (${option1})`
                    }
                }
                if (a.sid2) {
                    var option2 = a.sid2
                    displayName = `${baseName} (${option1}: ${option2})`
                }
        }
        if (!source) {
            var sources = []
            let sourceData = game.i18n.localize(`${PREFIX}.${a.id}.src`)
            for (let src of sourceData) {
                sources.push(`${game.i18n.localize(`BOOK.${src.src}`)} <small>(Page: ${src.page}</small>)`)
            }
            var source = sources.join('<br>')
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

// Advntages, Disadvantages and Special Abilities
function parseActivatable(data) {
    var advantages = []
    data.forEach(d => {
        if (d[1].length > 0) {
            var type
            var id = d[0]
            var t = d[0].substring(0, d[0].indexOf('_'))
            var baseName
            // console.log(t)
            switch (t) {
                case "ADV":
                    type = "advantage"
                    break
                case "DISADV":
                    type = "disadvantage"
                    break
                case "SA":
                    type = "specialability"
                    break
            }
            d[1].forEach(i => {
                var baseName = game.i18n.localize(`${id}.name`)
                var itemName = baseName
                var displayName = baseName
                var advantage = {}
                switch (id) {
                    // Special cases that need handling
                    case "ADV_0": // Custom
                        itemName = displayName = i.sid
                        var source = "Custom Advantage"
                        break
                    case "DISADV_0": // Custom
                        itemName = displayName = i.sid
                        var source = "Custom Disadvantage"
                        break
                    case "ADV_50": // Spellcaster, needed for correct AE
                        var effect = "+20 AE"
                        break
                    case "ADV_12": // Blessed, needed for correct KP
                        var effect = "+20 KP"
                        break
                    case "DISADV_50":
                    case "DISADV_1": // Afraid of, can be a mix of pre-defined and custom text
                        itemName = `${baseName} ()`
                        switch (typeof (i.sid)) {
                            case "number":
                                var option1 = game.i18n.localize(`${id}.options.${i.sid - 1}`)
                                if (i.sid2) {
                                    displayName = `${baseName} (${option1}: ${i.sid2})`
                                } else{
                                    displayName = `${baseName} (${option1})`
                                }
                                break
                            default:
                                if (i.sid2) {
                                    displayName = `${baseName} (${i.sid}: ${i.sid2})`
                                } else{
                                    displayName = `${baseName} (${i.sid})`
                                }
                                break
                        }
                        break
                    case "SA_0": // Custom
                        itemName = displayName = i.sid
                        var cost = i.cost
                        var source = "Custom Ability"
                        break
                    case "SA_9": // Skill Specialization, need to localize both options
                        itemName = `${itemName} ()`
                        var option1 = game.i18n.localize(`SKILL.${i.sid}`)
                        var option2 = game.i18n.localize(`SPECIALISATION.${i.sid}.${i.sid2}`)
                        displayName = `${displayName} (${option1}: ${option2})`
                        var effect = `${option1} FP2`
                        break
                    case "DISADV_34":
                    case "SA_12": // Terrain Knowledge 
                    case "SA_28": // Writing
                    case "SA_87": // Aspect Knowledge // These have pre-defined options that Foundry doesn't have pre-made items for
                        itemName = `${itemName} ()`
                        var option1 = game.i18n.localize(`${id}.options.${i.sid - 1}`)
                        displayName = `${baseName} (${option1})`
                        break
                    default:
                        if (i.sid) {
                            if (typeof (i.sid) == "number") {
                                var option1 = game.i18n.localize(`${id}.options.${i.sid - 1}`)
                                itemName = displayName = `${baseName} (${option1})`
                            } else {
                                switch (i.sid.substring(0, i.sid.indexOf('_'))) {
                                    case "TAL":
                                        var option1 = game.i18n.localize(`SKILL.${i.sid}`)
                                        break
                                    case "CT":
                                        var option1 = game.i18n.localize(`COMBATSKILL.${i.sid}`)
                                        break
                                    case "SPELL":
                                        var option1 = game.i18n.localize(`SPELL.${i.sid}.name`)
                                        break
                                    default:
                                        var option1 = i.sid
                                        break
                                }
                                if (!baseName.includes('(')) {
                                    itemName = `${baseName} ()`
                                }
                                displayName = `${baseName} (${option1})`
                            }
                            /*
                            } else if (i.sid.startsWith("TAL_")) { // Incompetant
                                var option1 = game.i18n.localize(`SKILL.${i.sid}`)
                                displayName = `${displayName} (${option1})`
                                itemName = itemName = itemName + ' ()'
                            } else {
                                var option1 = i.sid
                                itemName = itemName + ' ()'
                                displayName = `${displayName} (${option1})`
                            }
                            */
                        }
                        if (i.sid2) {
                            var option2 = i.sid2
                            displayName = `${baseName} (${option1}: ${option2})`
                        }
                        if (type == "specialability") {
                            var source = ""
                            let sourceData = game.i18n.localize(`${id}.src`)
                            for (let src of sourceData) {
                                // source += ' ' + game.i18n.localize(`${src.src}.name`)+` <small>(Page: ${src.page}</small>)`
                                source += ` ${game.i18n.localize(`BOOK.${src.src}`)} <small>(Page: ${src.page}</small>)`
                            }
                        } else {
                            source = ""
                        }
                }
                advantage.type = type
                advantage.itemName = itemName
                advantage.displayName = displayName
                if (i.tier) {
                    advantage.value = i.tier
                }
                if (effect) {
                    advantage.effect = effect
                }
                if (source) {
                    advantage.source = source
                }
                if (cost) {
                    advantage.cost = cost
                }

                // advantage = {
                //     type: type,
                //     itemName: itemName,
                //     displayName: displayName,
                //     value: level,
                //     source: source
                // }

                advantages.push(advantage)


            })
            //     break
            // case "SA":
            //     var displayName = game.i18n.localize(`${id}.name`)
            //     var ability = {
            //         type: type,
            //         displayName: displayName,
            //         itemName: displayName,
            //     }
            //     advantages.push(ability)
            //     break
            // }

        }
    });
    return advantages
}
async function parseBelongings(data) {
    const {ITEM_TYPE_MAP, ITEM_CATEGORY_MAP} = await import("./data/items.js");
    var items = []
    for (const item of data) {
        let newItem = {}
        let itemID = item[1].template
        if (itemID) {
            newItem.displayName = item[1].name
            newItem.itemName = game.i18n.localize(`ITEM.${itemID}.name`)
            if (!(newItem.type = ITEM_TYPE_MAP[item[1].gr])) {
                newItem.type = "equipment"
            }
            let sourceData = game.i18n.localize(`ITEM.${itemID}.src`)
            let sources = []
            for (let src of sourceData) {
                sources.push(`${game.i18n.localize(`BOOK.${src.src}`)} <small>(Page: ${src.page}</small>)`)
            }
            newItem.source = sources.join("<br>")
        } else {
            newItem.displayName = newItem.itemName = item[1].name
            newItem.source = "Custom Item"
            if (!(newItem.type = ITEM_TYPE_MAP[item[1].gr])) {
                newItem.type = "equipment"
            }
        }
        // newItem.quantity = item[1].amount
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

// TODO: get all suitable compendiums (see DSA utility), rather than specifying single one
async function addItems(actor, items, compendium) {
    var pack = await game.packs.entries.find(p => p.metadata.label == compendium);
    if (pack) {
        let index = await pack.getIndex()
        for (let item of items) {
            let newItem = {}
            // ignore case and match
            let entry = index.find(i =>
                i.name.localeCompare(item.itemName, undefined, {
                    sensitivity: 'accent'
                }) === 0
            )
            if (entry) {
                newItem = await pack.getEntry(entry._id)
                newItem.name = item.displayName
                if (item.data) {
                    newItem.data = {
                        ...newItem.data,
                        ...item.data
                    }
                }
            } else {
                // console.warn("Couldn't find item in compendium: " + item.itemName)
                importErrors.push({type: item.type, displayName: item.displayName, itemName: item.itemName, source: item.source})
                // add custom item
                newItem = {
                    name: item.displayName,
                    type: item.type,
                    img: DSAItem.defaultImages[item.type],
                    data: {
                        ...item.data,
                        ...item.customData,
                        ...{
                            description: {
                                value: `<p>Source:</p><p>${item.source}</p>`
                            }
                        }
                    }
                }
            }
            await actor.createOwnedItem(newItem)
        }
    } else {
        console.warn("No such compendium: " + compendium)
        importErrors.push({ itemName: item.itemName, displayName: item.displayName, type: item.type, source: item.source})
        for (let item of items) {
            // add custom item
            let newItem = {
                name: item.displayName,
                type: item.type,
                img: DSAItem.defaultImages[item.type],
                data: {
                    ...item.data,
                    ...item.customData,
                    ...{
                        description: {
                            value: `<p>Source:</p><p>${item.source}</p>`
                        }
                    }
                }
        }
            // console.log(newItem)
            await actor.createOwnedItem(newItem)
        }

    }
}

async function importFromJSON(json, showResults) {
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


    var spells = await parseSpells(Object.entries(data.spells))
    // console.log(spells)

    var cantrips = await parseCantrips(data.cantrips) // array not object
 
    var liturgies = await parseLiturgies(Object.entries(data.liturgies))

    const allActivatables = parseActivatables(Object.entries(data.activatable))
    // console.log(allActivatables)

    var allAdvantages = parseAbility(allActivatables.advantages)
    console.log(allAdvantages)

    var allDisadvantages = parseAbility(allActivatables.disadvantages)
    console.log(allDisadvantages)

    var allAbilities = parseAbility(allActivatables.specialAbilities)
    console.log(allAbilities)


    // var activatables = parseActivatable(Object.entries(data.activatable))
    // console.log(activatables)

    var blessings = await parseBlessings(data.blessings) // array not object

    // parse belongings
    var belongings = await parseBelongings(Object.entries(data.belongings.items))
    // console.log(belongings)

    // can use IDs if they don't change
    var money = []
    money.push({id:"OCRi6UuKBIHCbZuF", quantity: data.belongings.purse.d})
    money.push({id:"xN0OtnyZqB4BaWAX", quantity: data.belongings.purse.s})
    money.push({id:"G4piFlEAWb2stJCn", quantity: data.belongings.purse.h})
    money.push({id:"NDf42upvVWmHi8Ty", quantity: data.belongings.purse.k})


    // setup base character data
    var charData = {}
    let race = data.r
    charData.name = data.name
    charData.type = "character"
    if (data.rv) {
        var species = `${game.i18n.localize(`RACE.${race}`)} (${game.i18n.localize(`RACEVARIANT.${data.rv}`)})`
    } else {
        var species = game.i18n.localize(`RACE.${race}`)
    }
    charData.data = {
        characteristics: characteristics,
        details: {
            experience: {
                total: data.ap.total
            },
            species: {
                value: species
            },
            gender: {
                // value: game.i18n.localize(`RACE.${data.sex}`) // can't find i18n data for sex
            },
            culture: {
                value: game.i18n.localize(`CULTURE.${data.c}`)
            },
            career: {
                value: `${data.p == "P_0" ? data.professionName : game.i18n.localize(`PROFESSION.${data.p}`)}`
                // value: game.i18n.localize(`PROFESSION.${data.p}`)
            },
            socialstate: {
                value: game.i18n.localize(`SOCIALSTATUS.${data.pers.socialstatus}`)
            },
            family: {
                value: data.pers.family
            },
            age: {
                value: data.pers.age
            },
            haircolor: {
                value: game.i18n.localize(`HAIRCOLOR.${data.pers.haircolor}`)
            },
            eyecolor: {
                value: game.i18n.localize(`EYECOLOR.${data.pers.eyecolor}`)
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
            biography: {
                value: `Birthdate: ${data.pers.dateofbirth} ${data.pers.title ? `<br>Title: ${data.pers.title}` : ""}`
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

    let actor = await CONFIG.Actor.entityClass.create(charData, {
        renderSheet: false
    })
    // console.log(actor)

    /* 
    * Use the following if skill IDs change
    * 
    // update skills by finding skill name
    for (let s of skills) {
        let item = actor.data.items.find(i => i.name === s.name)
        const update = {
            _id: item._id,
            'data.talentValue.value': s.data.talentValue.value
        }
        const updated = actor.updateEmbeddedEntity("OwnedItem", update);
    }
    */

    // update skills using using IDs in SKILL_MAP
    for (let s of Object.entries(data.talents)) {
        const update = {
            _id: SKILL_MAP[s[0]],
            'data.talentValue.value': s[1]
        }
        actor.updateEmbeddedEntity("OwnedItem", update);
    }
    // update combat techniques using IDs in COMBAT_SKILL_MAP
    for (let s of Object.entries(data.ct)) {
        const update = {
            _id: COMBAT_SKILL_MAP[s[0]],
            'data.talentValue.value': s[1]
        }
        actor.updateEmbeddedEntity("OwnedItem", update);
    }

    // update money by ID
    for(let coin of money) {
        const update = {
            _id: coin.id,
            'data.quantity.value': (coin.quantity ? coin.quantity : 0)
        }
        actor.updateEmbeddedEntity("OwnedItem", update);
    }

    let allVantages = allAdvantages.concat(allDisadvantages)
    await addItems(actor, allVantages, "Disadvantages and Advantages")

    await addItems(actor, allAbilities, "Special Abilities")

/*
    // add activatables TODO: refactor into function
    let advantages = activatables.filter(a => a.type.includes("advantage"))
    for (let a of advantages) {
        var pack = await game.packs.entries.find(p => p.metadata.label == "Disadvantages and Advantages");
        if (pack) {
            var index = await pack.getIndex();
            var advantage = index.find(i => i.name == a.itemName)
            if (advantage) {
                let item = await pack.getEntry(advantage._id)
                item.name = a.displayName
                if (a.value > item.data.max.value) {
                    item.data.step = {
                        value: item.data.max.value
                    }
                } else {
                    item.data.step = {
                        value: a.value
                    }
                }
                await actor.createOwnedItem(item)
            } else {
                // console.warn(`Can't find ${a.itemName} in compendium`)
                importErrors.push({type: a.type, displayName: a.displayName, itemName: a.itemName, source: a.source})

                let newItem = await actor.createOwnedItem({
                    name: a.displayName,
                    type: a.type,
                    data: {
                        description: {
                            value: a.source,
                        },
                        APValue: {
                            value: a.cost
                        },
                        effect: {
                            value: a.effect
                        },
                        step: {
                            value: a.value
                        }
                    }
                })

            }
        } else {
            await actor.createOwnedItem({
                name: a.displayName,
                type: a.type,
                data: {
                    description: {
                        value: a.source,
                    },
                    APValue: {
                        value: a.cost
                    },
                    effect: {
                        value: a.effect
                    },
                    step: {
                        value: a.value
                    }
                }
            })
            // console.log(newItem)

        }
    }

    // add special abilities  // TODO: refactor into function
    let abilities = activatables.filter(a => a.type == "specialability")
    for (let a of abilities) {
        var pack = await game.packs.entries.find(p => p.metadata.label == "Special Abilities");
        if (pack) {
            var index = await pack.getIndex();
            var ability = index.find(i => i.name == a.itemName)
            if (ability) {
                let item = await pack.getEntry(ability._id)
                item.name = a.displayName
                if (a.value > item.data.maxRank.value) {
                    item.data.step = {
                        value: item.data.maxRank.value
                    }
                } else {
                    item.data.step = {
                        value: a.value
                    }
                }
                await actor.createOwnedItem(item)
            } else {
                // console.warn(`Can't find ${a.itemName} in compendium`)
                importErrors.push({type: a.type, displayName: a.displayName, itemName: a.itemName, source: a.source})
                let newItem = await actor.createOwnedItem({
                    name: a.displayName,
                    type: "specialability",
                    data: {
                        category: {
                            value: "general"
                        },
                        description: {
                            value: a.source,
                        },
                        APValue: {
                            value: a.cost
                        },
                        step: {
                            value: a.tier
                        }
                    }
                })

            }
        } else {
            await actor.createOwnedItem({
                name: a.displayName,
                type: "specialability",
                data: {
                    category: {
                        value: "general"
                    },
                    description: {
                        value: a.source,
                    },
                    APValue: {
                        value: a.cost
                    },
                    step: {
                        value: a.tier
                    }
                }
            })
            // console.log(newItem)
        }
    }
*/

    // add spells // TODO: localise, and don't require specific compendium
    await addItems(actor, spells, "Spells, rituals and cantrips")

    await addItems(actor, cantrips, "Spells, rituals and cantrips")

    await addItems(actor, blessings, "Liturgies, ceremonies and blessings")

    await addItems(actor, liturgies, "Liturgies, ceremonies and blessings")

    // add equipment // TODO: localise
    await addItems(actor, belongings, "Equipment")

    // TODO: localse
    importErrors.sort()
    let importErrorsList = []
    for (let error of importErrors) {
        importErrorsList.push(`<tr><td><i>${error.type}</i></td><td><b>${error.displayName}</b></td><td>${error.source}</td></tr>`)
    }
    let importErrorsMessage = `<p>The following items could not be found in the compendium and may need to be manually adjusted:</p>
        <table>
        <tr><th>Type</th><th>Name</th><th>Source</th></tr>
        ${importErrorsList.join('')}
        </table>
        `
    
    actor.update(
        {
            "data.status.wounds.value": actor.data.data.status.wounds.initial + actor.data.data.characteristics["ko"].value * 2
    })

    console.log(`Optolith to Foundry Importer | Finished creating actor id: ${actor.id} name: ${actor.data.name}`)
    let sheet = await actor.sheet.render(true)

    
    if (importErrors.length > 0) {
        console.log(`Optolith to Foundry Importer | Items that were not found in compendium:`)
        console.log(importErrors)
        ui.notifications.warn(`${actor.data.name} imported with some unrecognised items`)
        actor.update({"data.details.notes.value": actor.data.data.details.notes.value+'<br>'+importErrorsMessage})

    } else {
        ui.notifications.info(`${actor.data.name} imported successfully`)
    }

    if (showResults && importErrors.length > 0) {
        new Dialog({
            title: `Import Results for ${actor.name}`,
            content: importErrorsMessage,
            buttons: {
                ok: {
                    icon: "<i class='fas fa-check'></i>",
                    label: `OK`
                }
            },
            default: 'ok'
        }, {
            width: 700
        }).render(true)
    }

}



// TODO: localise
function importFromOptolithDialog() {
    new Dialog({
        title: `Import Optolith File`,
        content: `
            <form autocomplete="off" onsubmit="event.preventDefault();">
                <p class="notes">You may import a hero from a JSON file exported from Optolith.</p>
                <p class="notes">This operation will create a new Actor.</p>
                <div class="">
                    <p><label for="data">Optolith JSON file</label><br>
                    <input type="file" name="data"/></p>
                    <p>
                        <label for="results">Show results?</label>
                        <input type="checkbox" name="results"/>
                    </p>
                </div>
            </form>
            `,
        buttons: {
            import: {
                icon: '<i class="fas fa-file-import"></i>',
                label: "Import",
                callback: html => {
                    const form = html.find("form")[0];
                    if (!form.data.files.length) return ui.notifications.error("You did not upload a data file!")
                    var showResults // TODO: do a better job with optional paramenters!
                    if (form.results.checked ) { showResults = true } else { showResults = false }
                    // showResults = true
                    readTextFromFile(form.data.files[0]).then(json => importFromJSON(json, showResults));
                }
            },
            no: {
                icon: '<i class="fas fa-times"></i>',
                label: "Cancel"
            }
        },
        default: "import"
    }, {
        width: 400
    }).render(true);
}

Hooks.on("renderActorDirectory", (app, html, data) => {
    // TODO: check user has permission to create Actor
    const button = $(`<button title="${game.i18n.localize("Tooltip.import")}"><i class="fas fa-file-import"></i>${game.i18n.localize("Button.import")}</button>`);
    html.find(".header-actions").append(button);
    button.click(() => importFromOptolithDialog())
})