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
    // const SPELLS = await fetch('modules/optolith-to-foundry/data/spells.json').then((response) => {return response.json() })

    // const {
    //     SPELL_MAP
    // } = await import("./data/spells.js")
    var items = []
    for (let spell of data) {
        let item = {}
        let spellID = spell[0]
        // item.displayName = item.itemName = SPELLS[spell[0]].name
        item.displayName = item.itemName = game.i18n.localize(`SPELL.${spell[0]}.name`)
        item.type = "spell"
        item.data = {
            talentValue: {
                value: spell[1]
            }
        }
        let sourceData = game.i18n.localize(`SPELL.${spell[0]}.src`)
        let sources = []
        for (let src of sourceData) {
            sources.push(`${game.i18n.localize(`BOOK.${src.src}`)} <small>(Page: ${src.page}</small>)`)
        }
        // if (!SPELL_MAP[spell[0]]) {
        //     console.log(`Optolith to Foundry Importer | Couldn't map spell: ${spell[0]}`)
        // } else {
        //     item.customData = {
        //         characteristic1: {
        //             value: ATTRIBUTE_MAP[`${SPELL_MAP[spellID].check1}`]
        //         },
        //         characteristic2: {
        //             value: ATTRIBUTE_MAP[`${SPELL_MAP[spellID].check2}`]
        //         },
        //         characteristic3: {
        //             value: ATTRIBUTE_MAP[`${SPELL_MAP[spellID].check3}`]
        //         }
        //     }
        // }
        item.source = sources.join("<br>")
        items.push(item)
    }
    return items
}

async function parseLiturgies(data) {
    // const LITURGIES = await fetch('modules/optolith-to-foundry/data/liturgies.json').then((response) => {return response.json() })
    var items = []
    for (let spell of data) {
        let item = {}
        // console.log(spell[0])
        // spell[0] = "SPELL_58"
        let spellID = spell[0]
        item.displayName = item.itemName = game.i18n.localize(`LITURGY.${spell[0]}.name`)
        item.type = "liturgy"
        item.data = {
            talentValue: {
                value: spell[1]
            }
        }
        let sourceData = game.i18n.localize(`LITURGY.${spell[0]}.src`)
        let sources = []
        for (let src of sourceData) {
            sources.push(`${game.i18n.localize(`BOOK.${src.src}`)} <small>(Page: ${src.page}</i>)`)
        }
        items.push(item)
    }
    return items

}

async function parseBlessings(data) {
    // const BLESSINGS = await fetch('modules/optolith-to-foundry/data/blessings.json').then((response) => {return response.json() })

    var items = []
    for (let item of data) {
        let newItem = {}
        newItem.displayName = newItem.itemName = game.i18n.localize(`BLESSING.${item}.name`)
        newItem.type = "blessing"

        let sourceData = game.i18n.localize(`BLESSING.${item}.src`)
        let sources = []
        for (let src of sourceData) {
            sources.push(`${game.i18n.localize(`BOOK.${src.src}`)} <small>(Page: ${src.page}</i>)`)
        }
        items.push(newItem)
    }
    return items
}

async function parseCantrips(data) {
    // const CANTRIPS = await fetch('modules/optolith-to-foundry/data/cantrips.json').then((response) => {return response.json() })

    var items = []
    for (let item of data) {
        let newItem = {}
        newItem.displayName = newItem.itemName = game.i18n.localize(`CANTRIP.${item}.name`)
        newItem.type = "magictrick"

        let sourceData = game.i18n.localize(`CANTRIP.${item}.src`)
        let sources = []
        for (let src of sourceData) {
            sources.push(`${game.i18n.localize(`BOOK.${src.src}`)} <small>(Page: ${src.page}</i>)`)
        }
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
        var source = ""
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
            case "DISADV_3": // Bound to Artefact
                itemName = baseName + ' ()'
                displayName = baseName
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
            case "SA_70": // Tradition (Guild Mage)
                var option1 = game.i18n.localize(`SPELL.${a.sid}.name`)
                displayName = `${baseName} (${option1})`
                break
            case "DISADV_33": // Personality Flaw
                var option1 = game.i18n.localize(`DISADVANTAGE.${a.id}.options.${a.sid - 1}`)
                itemName = `${baseName} (${option1})`
                displayName = `${baseName} (${option1}: ${a.sid2})`
                break
                // case "DISADV_34":
                // case "SA_12": // Terrain Knowledge 
                // case "SA_28": // Writing
                // case "SA_87": // Aspect Knowledge // These have pre-defined options that Foundry doesn't have pre-made items for
                // itemName = `${itemName} ()`
                // var option1 = game.i18n.localize(`${a.id}.options.${a.sid - 1}`)
                // displayName = `${baseName} (${option1})`
                // break
            default:
                if (a.sid) {
                    itemName = baseName + ' ()'
                    if (typeof (a.sid) == "number") {
                        var option1 = game.i18n.localize(`${PREFIX}.${a.id}.options.${a.sid - 1}`)
                        displayName = `${baseName} (${option1})`
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
    let pack = await game.packs.entries.find(p => p.metadata.label == compendium);
    if (pack) {
        let index = await pack.getIndex()
        for (let item of items) {
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
            // console.log(newItem)
            await actor.createOwnedItem(newItem)
        }
    } else {
        console.warn("No such compendium: " + compendium)
        for (let item of items) {
            importErrors.push({
                itemName: item.itemName,
                displayName: item.displayName,
                type: item.type,
                source: item.source
            })
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
                    },
                    ...{
                        weight: {
                            value: 0 // bug with rangeweapons where weight isn't set
                        }
                    }
                }
            }
            try {
                await actor.createOwnedItem(newItem)
            } catch (e) {
                console.error(e)
                console.log(newItem)
            }
        }
    }
}
async function importFromJSON(json, options) {
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


    var spells = await parseSpells(Object.entries(data.spells))
    // console.log(spells)

    var cantrips = await parseCantrips(data.cantrips) // array not object

    var blessings = await parseBlessings(data.blessings) // array not object

    var liturgies = await parseLiturgies(Object.entries(data.liturgies))

    const allActivatables = parseActivatables(Object.entries(data.activatable))

    var allAdvantages = parseAbility(allActivatables.advantages)

    var allDisadvantages = parseAbility(allActivatables.disadvantages)

    var allAbilities = parseAbility(allActivatables.specialAbilities)


    // var activatables = parseActivatable(Object.entries(data.activatable))
    console.log(allDisadvantages)


    // parse belongings
    var belongings = await parseBelongings(Object.entries(data.belongings.items))
    // console.log(belongings)

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
        var species = `${game.i18n.localize(`RACE.${race}`)} (${game.i18n.localize(`RACEVARIANT.${data.rv}`)})`
    } else {
        var species = game.i18n.localize(`RACE.${race}`)
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
    for (let coin of money) {
        const update = {
            _id: coin.id,
            'data.quantity.value': (coin.quantity ? coin.quantity : 0)
        }
        actor.updateEmbeddedEntity("OwnedItem", update);
    }

    let allVantages = allAdvantages.concat(allDisadvantages)
    await addItems(actor, allVantages, "Disadvantages and Advantages")

    await addItems(actor, allAbilities, "Special Abilities")


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

    actor.update({
        "data.status.wounds.value": actor.data.data.status.wounds.initial + actor.data.data.characteristics["ko"].value * 2
    })

    console.log(`Optolith to Foundry Importer | Finished creating actor id: ${actor.id} name: ${actor.data.name}`)
    let sheet = await actor.sheet.render(true)


    if (importErrors.length > 0) {
        console.log(`Optolith to Foundry Importer | Items that were not found in compendium:`)
        console.log(importErrors)
        ui.notifications.warn(`${actor.data.name} imported with some unrecognised items`)
        if (options.addResultsToNotes) {
            actor.update({
                "data.details.notes.value": actor.data.data.details.notes.value + '<br>' + importErrorsMessage
            })
        }
        if (options.showResultsDialog) {
            new Dialog({ // TODO: localise
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
    } else {
        ui.notifications.info(`${actor.data.name} imported successfully`)
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
                <div class="form-group-stacked">
                    <p><label for="data">Optolith JSON file</label><br>
                    <input type="file" name="data"/></p>
                    <p>Results:</p>
                    <p>
                        <input type="checkbox" name="popup"/>
                        <label for="popup">Popup</label>
                    </p>
                    <p>
                        <input type="checkbox" name="notes" checked />
                        <label for="notes">Add to Character Notes</label>
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
    if (game.user.can("create")) {
        const button = $(`<button title="${game.i18n.localize("UI.Tooltip_Import")}"><i class="fas fa-file-import"></i>${game.i18n.localize("UI.Button_Import")}</button>`);
        html.find(".header-actions").append(button);
        button.click(() => importFromOptolithDialog())
    }
})