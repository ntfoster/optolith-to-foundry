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
    const {
        SPELL_MAP
    } = await import("./data/spells.js")
    var items = []
    for (let spell of data) {
        let item = {}
        // console.log(spell[0])
        // spell[0] = "SPELL_58"
        let spellID = spell[0]
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
            sources.push(`${game.i18n.localize(`BOOK.${src.src}`)} <i>(Page: ${src.page}</i>)`)
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

// Advntages, Disadvantages and Special Abilities
function parseActivatable(data) {
    var advantages = []
    data.forEach(d => {
        if (d[1].length > 0) {
            var type
            var id = d[0]
            var t = d[0].substring(0, d[0].indexOf('_'))
            // console.log(t)
            switch (t) {
                case "ADV":
                    type = "advantage"
                    break;
                case "DISADV":
                    type = "disadvantage"
                    break;
                case "SA":
                    type = "specialability"
                    break;
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
                    case "DISADV_1": // Afraid of, can be a mix of pre-defined and custom text
                        itemName = `${baseName} ()`
                        switch (typeof (i.sid)) {
                            case "number":
                                var option1 = game.i18n.localize(`${id}.options.${i.sid - 1}`)
                                if (i.sid2) {
                                    displayName = `${baseName} ${option1} (${i.sid2})`
                                } else{
                                    displayName = `${baseName} ${option1}`
                                }
                                break
                            default:
                                if (i.sid2) {
                                    displayName = `${baseName} ${i.sid} (${i.sid2})`
                                } else{
                                    displayName = `${baseName} ${i.sid}`
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
                        var option2 = game.i18n.localize(`SPEC.${i.sid}.${i.sid2}`)
                        displayName = `${displayName} (${option1}: ${option2})`
                        var effect = `${option1} FP2`
                        break
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
                                // source += ' ' + game.i18n.localize(`${src.src}.name`)+` <i>(Page: ${src.page}</i>)`
                                source += ` ${game.i18n.localize(`BOOK.${src.src}`)} <i>(Page: ${src.page}</i>)`
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
                sources.push(`${game.i18n.localize(`BOOK.${src.src}`)} <i>(Page: ${src.page}</i>)`)
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
                data: item.data
            }
            // console.log(newItem)
            await actor.createOwnedItem(newItem)
        }

    }
}

async function importFromJSON(json, showResults) {
    importErrors = []
    const data = JSON.parse(json)
    
    var attributes = data.attr.values
    var characteristics = {}
    attributes.forEach(function (attr) {
        var attributeName = ATTRIBUTE_MAP[attr.id]
        var advances = attr.value - 8
        characteristics[attributeName] = {
            // "species": species,
            "advances": advances
        }
    });
    // var improvedAttibuteMax = sheet.attr.attributeAdjustmentSelected


    var spells = await parseSpells(Object.entries(data.spells))
    // console.log(spells)

    var activatables = parseActivatable(Object.entries(data.activatable))
    // console.log(activatables)

    // parse belongings
    var belongings = await parseBelongings(Object.entries(data.belongings.items))
    // console.log(belongings)

    // setup base character data
    var charData = {}
    let race = data.r
    charData.name = data.name
    charData.type = "character"
    charData.data = {
        characteristics: characteristics,
        details: {
            experience: {
                total: data.ap.total
            },
            species: {
                value: `${game.i18n.localize(`RACE.${race}`)} (${game.i18n.localize(`RACEVARIANT.${data.rv}`)})`
            },
            gender: {
                // value: game.i18n.localize(`RACE.${data.sex}`) // can't find i18n data for sex
            },
            culture: {
                value: game.i18n.localize(`CULTURE.${data.c}`)
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

    // add activables TODO: refactor into function
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

    // add spells // TODO: localise
    await addItems(actor, spells, "Spells, rituals and cantrips")

    // add equipment // TODO: localise
    console.log(belongings)
    await addItems(actor, belongings, "Equipment")

    console.log(`Optolith to Foundry Importer | Finished creating actor id: ${actor.id} name: ${actor.data.name}`)
    let sheet = await actor.sheet.render(true)

    
    console.log(`Optolith to Foundry Importer | Items that were not found in compendium:`)
    console.log(importErrors)
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

    if (showResults && importErrors.length > 0) {
        new Dialog({
            title: "Import Results",
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
    if (importErrors.length > 0) {
        ui.notifications.warn(`${actor.data.name} imported with some unrecognised items`)
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

    const button = $(`<button title="${game.i18n.localize("Tooltip.import")}"><i class="fas fa-file-import"></i>${game.i18n.localize("Button.import")}</button>`);
    html.find(".header-actions").append(button);
    button.click(() => importFromOptolithDialog())
})