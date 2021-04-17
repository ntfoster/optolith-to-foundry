import {
    ATTRIBUTE_MAP,
    RACE_MAP,
} from "./data/maps.js"
import {
    SPELL_ENHANCEMENT_MAP,
    LITURGY_ENHANCEMENT_MAP
} from "./data/enhancements.js"
import {SPELL_MAP} from "./data/spells.js"
import {LITURGY_MAP} from "./data/liturgies.js"
import DSAItem from "../../systems/dsa5/modules/item/item-dsa5.js"

var importErrors

function parseSkills(data, prefix) {

    var items = []
    data.forEach(s => {
        // console.log(`${skillMap[s[0]]}: ${s[1]}`)
        var item = {}
        item["name"] = game.i18n.localize(`${prefix}.${s[0]}.name`)
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

function getSource(item) {
    let source
    const sourceData = game.i18n.localize(`${item}.src`)
    if (typeof sourceData == 'object') {
        let sources = []

        for (let src of sourceData) {
            sources.push(`${game.i18n.localize(`BOOK.${src.src}.name`)} <small>(Page: ${src.page}</small>)`)
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
        item.displayName = item.itemName = game.i18n.localize(`SPELL.${spell[0]}.name`)
        let type  = SPELL_MAP[spell[0]] ?? "spell"
        item.type = type
        item.data = {
            talentValue: {
                value: spell[1]
            }
        }
        item.source = getSource(`SPELL.${spell[0]}`)
        items.push(item)
    }
    return items
}

function parseLiturgies(data) {
    var items = []
    for (let spell of data) {
        let item = {}
        item.displayName = item.itemName = game.i18n.localize(`LITURGICALCHANT.${spell[0]}.name`)
        let type  = LITURGY_MAP[spell[0]] ?? "liturgy"
        item.type = type
        item.data = {
            talentValue: {
                value: spell[1]
            }
        }
        item.source = getSource(`LITURGICALCHANT.${spell[0]}`)
        items.push(item)
    }
    return items

}

function parseBlessings(data) {
    var items = []
    for (let item of data) {
        let newItem = {}
        newItem.displayName = newItem.itemName = game.i18n.localize(`BLESSING.${item}.name`)
        newItem.type = "blessing"
        newItem.source = getSource(`BLESSING.${item}`)
        items.push(newItem)
    }
    return items
}

function parseCantrips(data) {
    var items = []
    for (let item of data) {
        let newItem = {}
        newItem.displayName = newItem.itemName = game.i18n.localize(`CANTRIP.${item}.name`)
        newItem.type = "magictrick"
        newItem.source = getSource(`CANTRIP.${item}`)
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

function parseAbility(data) {
    var abilities = []
    for (let a of data) {
        switch (a.type) {
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
        const baseName = game.i18n.localize(`${PREFIX}.${a.id}.name`)
        var itemName = baseName
        var displayName = baseName
        var ability = {}
        var source
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
            case "ADV_50": // Spellcaster, needed for correct AE
                effect = "+20 AE"
                break
            case "ADV_12": // Blessed, needed for correct KP
                effect = "+20 KP"
                break
            case "SA_9": // Skill Specialization, need to localize both options
                itemName = `${baseName} ()`
                var option1 = game.i18n.localize(`SKILL.${a.sid}.name`)
                var option2 = game.i18n.localize(`SKILL.${a.sid}.applications.${a.sid2}`)
                displayName = `${baseName} (${option1}: ${option2})`
                effect = `${option1} FP2`
                break
            case "SA_70": // Tradition (Guild Mage)
                var option1 = game.i18n.localize(`SPELL.${a.sid}.name`)
                displayName = `${baseName} (${option1})`
                break
            case "DISADV_33": // Personality Flaw
                var option1 = game.i18n.localize(`DISADVANTAGE.${a.id}.options.${a.sid - 1}`)
                itemName = `${baseName} (${option1})`
                displayName = `${baseName} (${option1}: ${a.sid2})`
                break
            case "SA_414": {// Spell Enhancement
                a.type = "spellextension"
                let enhancement = game.i18n.localize(`SPELLENHANCEMENT.${a.sid}.name`)
                let spell = game.i18n.localize(`SPELL.${SPELL_ENHANCEMENT_MAP[a.sid]}.name`)
                displayName = `${spell} - ${enhancement}`
                itemName = `${spell} - ${enhancement}`
                ability.data = {
                    source: spell,
                    category: "spell"
                }
                break
            }
            case "SA_663": {// Liturgy Enhancement
                a.type = "spellextension"
                let enhancement = game.i18n.localize(`LITURGICALCHANTENHANCEMENT.${a.sid}.name`)
                let spell = game.i18n.localize(`LITURGICALCHANT.${LITURGY_ENHANCEMENT_MAP[a.sid]}.name`)
                displayName = `${spell} - ${enhancement}`
                itemName = `${spell} - ${enhancement}`
                ability.data = {
                    source: spell,
                    category: "liturgy"
                }
                break
            }
            default:
                if (a.sid) {
                    itemName = baseName + ' ()'
                    if (typeof (a.sid) == "number") {
                        var option1 = game.i18n.localize(`${PREFIX}.${a.id}.options.${a.sid - 1}`)
                        displayName = `${baseName} (${option1})`
                    } else {
                        switch (a.sid.substring(0, a.sid.indexOf('_'))) {
                            case "TAL":
                                var option1 = game.i18n.localize(`SKILL.${a.sid}.name`)
                                break
                            case "CT":
                                var option1 = game.i18n.localize(`COMBATTECHNIQUE.${a.sid}.name`)
                                break
                            case "SPELL":
                                var option1 = game.i18n.localize(`SPELL.${a.sid}.name`)
                                break
                            default:
                                var option1 = a.sid
                                break
                        }
                        // if (!baseName.includes('(')) {
                        //     itemName = `${baseName} ()`
                        // }
                        displayName = `${baseName} (${option1})`
                    }
                }
                if (a.sid2) {
                    var option2 = a.sid2
                    displayName = `${baseName} (${option1}: ${option2})`
                }
        }
        if (!source) {
            source = getSource(`${PREFIX}.${a.id}`)
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
            newItem.displayName = newItem.itemName = game.i18n.localize(`ITEM.${itemID}.name`)
            if (!(newItem.type = ITEM_TYPE_MAP[item[1].gr])) {
                newItem.type = "equipment"
            }
            let sourceData = game.i18n.localize(`ITEM.${itemID}.src`)
            let sources = []
            for (let src of sourceData) {
                sources.push(`${game.i18n.localize(`BOOK.${src.src}.name`)} <small>(Page: ${src.page}</small>)`)
            }
            newItem.source = sources.join("<br>")
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

async function addFromLibrary(actor, items, index, types) {
    if(!types) {
		var types = []
	}
    for (let item of items) {
        let entry = index.find(i => // case-insensitive match
            i.document.data.name.localeCompare(item.displayName, undefined, {
                sensitivity: 'accent'
            }) === 0 && (i.document.data.type == item.type || types.includes(item.type))
        )
        if (entry) {
            // console.log(`Found entry: ${entry.document.data.name}`)
        } else if (entry = index.find(i => // case-insensitive match
            i.document.data.name.localeCompare(item.itemName, undefined, {
                sensitivity: 'accent'
            }) === 0 && (i.document.data.type == item.type || types.includes(item.type))
        )) {
            // console.log(`Found entry by itemName: ${entry.document.data.name}`);
        }
        if (entry) {
            let newData = JSON.parse(JSON.stringify(entry.document.data)) // deep copy, not shallow
            newData.name = item.displayName
            if (newData.data.maxRank && item.value > newData.data.maxRank.value) {
                newData.data.step = {
                    value: newData.data.maxRank.value
                }
            } else {
                newData.data.step = {
                    value: item.value
                }
            }
            if (item.data) {
                newData.data = {
                    ...newData.data,
                    ...item.data
                }
            }

            await actor.createOwnedItem(newData)

        } else {
            // console.log(`Couldn't find item: ${item.type} - ${item.itemName}`)
            importErrors.push({
                itemName: item.itemName,
                displayName: item.displayName,
                type: item.type,
                source: item.source
            })
            // add custom item
            let newItem = createCustomItem(item)
            await actor.createOwnedItem(newItem)
        }
    }
}

// TODO: get all suitable compendiums (see DSA utility), rather than specifying single one
async function addItems(actor, items, tags) {
    // console.log(items)
    let pack = await game.packs.entries.find(function (p) {
        if (p.metadata.system == "dsa5" && p.metadata.tags) {
            // console.log(`searching pack ${p.metadata.label} for ${tags}`)
            let match = true
            for (let tag of tags) {
                if (!p.metadata.tags.includes(tag)) {
                    match = false
                    // console.log(`couldn't find ${tag} in ${p.metadata.label}`)
                } else {
                    // console.log(`found ${tag} in ${p.metadata.label}`)
                }
            }
            return match
        } else {
            return false
        }
    })
    if (pack) {
        let index = await pack.getIndex()
        for (const item of items) {
            let newItem = {}
            // ignore case and match
            var entry = index.find(i =>
                i.name.localeCompare(item.displayName, undefined, {
                    sensitivity: 'accent'
                }) === 0
            )
            if (!entry) { // try different version of name
                entry = index.find(i =>
                    i.name.localeCompare(item.itemName, undefined, {
                        sensitivity: 'accent'
                    }) === 0
                )
            }
            if (entry) {
                newItem = await pack.getEntry(entry._id)
                newItem.name = item.displayName

                if (newItem.data.maxRank && item.value > newItem.data.maxRank.value) {
                    newItem.data.step = {
                        value: newItem.data.maxRank.value
                    }
                } else {
                    newItem.data.step = {
                        value: item.value
                    }
                }
                if (item.data) {
                    newItem.data = {
                        ...newItem.data,
                        ...item.data
                    }
                }
            } else {
                // console.warn("Couldn't find item in compendium: " + item.itemName)
                importErrors.push({
                    type: item.type,
                    displayName: item.displayName,
                    itemName: item.itemName,
                    source: item.source
                })
                // add custom item
                newItem = createCustomItem(item)
            }
            try {
                await actor.createOwnedItem(newItem)
            } catch (e) {
                console.error(e)
                ui.notifications.error(e)
            }
        }
    } else {
        console.log(`Optolith to Foundry Importer | No compendium pack with tags ${tags}:`)
        for (const item of items) {
            importErrors.push({
                itemName: item.itemName,
                displayName: item.displayName,
                type: item.type,
                source: item.source
            })
            // add custom item
            let newItem = createCustomItem(item)
            try {
                await actor.createOwnedItem(newItem)
            } catch (e) {
                console.error(e)
                ui.notifications.error(e)
                console.log(newItem)
            }
        }
    }
}
async function importFromJSON(json, options) {

    await game.dsa5.itemLibrary.buildEquipmentIndex()
    const index = game.dsa5.itemLibrary.equipmentIndex

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

    var skills = parseSkills(Object.entries(data.talents),"SKILL")
    var combatSkills = parseSkills(Object.entries(data.ct),"COMBATTECHNIQUE")

    var spells = parseSpells(Object.entries(data.spells))
    // console.log(spells)

    var cantrips = parseCantrips(data.cantrips) // array not object
    // array not object

    var blessings = parseBlessings(data.blessings) // array not object
    // array not object

    var liturgies = parseLiturgies(Object.entries(data.liturgies))

    const allActivatables = parseActivatables(Object.entries(data.activatable))

    var allAdvantages = parseAbility(allActivatables.advantages)

    var allDisadvantages = parseAbility(allActivatables.disadvantages)

    var allAbilities = parseAbility(allActivatables.specialAbilities)

    // parse belongings
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
        var species = `${game.i18n.localize(`RACE.${race}.name`)} (${game.i18n.localize(`RACEVARIANT.${data.rv}.name`)})`
    } else {
        var species = game.i18n.localize(`RACE.${race}.name`)
    }

    if (data.p == "P_0") {
        var profession = data.professionName
    } else {
        var profession = game.i18n.localize(`PROFESSION.${data.p}.name`)
        if (typeof profession == "object") {
            profession = game.i18n.localize(`PROFESSION.${data.p}.name.${data.sex}`)
        }
    }

    var charData = {}
    charData.name = data.name
    charData.type = "character"
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
                value: game.i18n.localize(`SEX.${data.sex}`)
            },
            culture: {
                value: `${data.c ? game.i18n.localize(`CULTURE.${data.c}.name`) : ""}`
            },
            career: {
                value: profession
            },
            socialstate: {
                value: `${data.pers.socialstatus ? game.i18n.localize(`SOCIALSTATUS.${data.pers.socialstatus}.name`) : ""}`
            },
            family: {
                value: data.pers.family
            },
            age: {
                value: data.pers.age
            },
            haircolor: {
                value: `${data.pers.haircolor ? game.i18n.localize(`HAIRCOLOR.${data.pers.haircolor}.name`) : ""}`
            },
            eyecolor: {
                value: `${data.pers.eyecolor ? game.i18n.localize(`EYECOLOR.${data.pers.eyecolor}.name`) : ""}`
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
            biography: { //TODO: localise
                value: `${ data.pers.dateofbirth ? `Birthdate: ${data.pers.dateofbirth}` : ""} ${data.pers.title ? `<br>Title: ${data.pers.title}` : ""} `
                // value: `Birthdate: ${data.pers.dateofbirth} ${data.pers.title ? `<br>Title: ${data.pers.title}` : ""}`
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

    actor = await CONFIG.Actor.entityClass.create(charData, {
        renderSheet: false
    })
    // console.log(actor)

    /* 
    * Use the following if skill IDs change
    */
    // update skills by finding skill name
    for (let s of skills) {
        let item = actor.data.items.find(i => i.name === s.name && i.type == "skill")
        const update = {
            _id: item._id,
            'data.talentValue.value': s.data.talentValue.value
        }
        await actor.updateOwnedItem(update);
    }

    for (let s of combatSkills) {
        let item = actor.data.items.find(i => i.name === s.name && i.type == "combatskill")
        const update = {
            _id: item._id,
            'data.talentValue.value': s.data.talentValue.value
        }
        await actor.updateEmbeddedEntity("OwnedItem", update);
    }

    // // update skills using using IDs in SKILL_MAP
    // for (let s of Object.entries(data.talents)) {
    //     let locale = game.i18n.lang
    //     switch (locale) {
    //         case "en":
    //             var id = en_SKILL_MAP[s[0]]
    //             break
    //         case "de":
    //             var id = de_SKILL_MAP[s[0]]
    //             break
    //     }
    //     const update = {
    //         _id: id,
    //         'data.talentValue.value': s[1]
    //     }
    //     // actor.updateEmbeddedEntity("OwnedItem", update);
    //     await actor.updateOwnedItem(update)
    // }
    // // update combat techniques using IDs in COMBAT_SKILL_MAP
    // for (let s of Object.entries(data.ct)) {
    //     switch (game.i18n.lang) {
    //         case "en":
    //             var id = en_COMBAT_SKILL_MAP[s[0]]
    //             break
    //         case "de":
    //             var id = de_COMBAT_SKILL_MAP[s[0]]
    //             break
    //     }
    //     const update = {
    //         _id: id,
    //         'data.talentValue.value': s[1]
    //     }
    //     // actor.updateEmbeddedEntity("OwnedItem", update);
    //     await actor.updateOwnedItem(update)
    // }

    // update money by ID
    for (let coin of money) {
        const update = {
            _id: coin.id,
            'data.quantity.value': (coin.quantity ? coin.quantity : 0)
        }
        await actor.updateOwnedItem(update);
    }

    let allVantages = allAdvantages.concat(allDisadvantages)

    await addFromLibrary(actor, allVantages, index)
    await addFromLibrary(actor, allAbilities, index)    
    await addFromLibrary(actor, spells, index, ["spell", "ritual"])
    await addFromLibrary(actor, cantrips, index)
    await addFromLibrary(actor, blessings, index)
    await addFromLibrary(actor, liturgies, index, ["liturgy", "ceremony"])
    await addFromLibrary(actor, belongings, index, ["equipment"])

    // await addItems(actor, allVantages, ["advantages, "disadvantages"])
    // await addItems(actor, allAbilities, ["specialabilities"])
    // await addItems(actor, spells, ["spells"])
    // await addItems(actor, cantrips, ["magictricks"])
    // await addItems(actor, blessings, ["liturgies"])
    // await addItems(actor, liturgies, ["blessings"])
    // await addItems(actor, belongings, ["equipment"])

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
        "data.status.wounds.value": actor.data.data.status.wounds.initial + actor.data.data.characteristics["ko"].value * 2
    })

    console.log(`Optolith to Foundry Importer | Finished creating actor id: ${actor.id} name: ${actor.data.name}`)
    let sheet = await actor.sheet.render(true)


    if (importErrors.length > 0) {
        console.log(`Optolith to Foundry Importer | Items that were not found in Library:`)
        console.log(importErrors)
        ui.notifications.warn(`${actor.data.name} ${game.i18n.localize('UI.ImportResultsUnrecognised')}`)
        if (options.addResultsToNotes) {
            actor.update({
                "data.details.notes.value": actor.data.data.details.notes.value + '<br>' + importErrorsMessage
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
        ui.notifications.info(`${actor.data.name} ${game.i18n.localize('UI.ImportResultsSuccess')}`)
    }

}



// TODO: localise
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
                    // TODO: do a better job with optional paramenters!
                    // if (form.popup.checked ) { showResults = true } else { showResultsDialog = false }
                    // var showResultsDialog = form.popup.checked
                    // var addToNotes = form.notes.checked
                    var options = {
                        showResultsDialog: form.popup.checked,
                        addResultsToNotes: form.notes.checked
                    }
                    // showResults = true
                    readTextFromFile(form.data.files[0]).then(json => importFromJSON(json, options));
                }
            },
            no: {
                icon: '<i class="fas fa-times"></i>',
                label: `${game.i18n.localize('Cancel')}`
            }
        },
        default: "import"
    }, {
        width: 400
    }).render(true);
}

Hooks.on("renderActorDirectory", (app, html, data) => {
    // TODO: check user has permission to create Actor
    if (game.user.can("create")) {
        const button = $(`<button title="${game.i18n.localize("UI.ImportFile")}"><i class="fas fa-file-import"></i>${game.i18n.localize("UI.Import")}</button>`);
        html.find(".header-actions").append(button);
        button.click(() => importFromOptolithDialog())
    }
})