function renderImportDialog() {

    new Dialog({
        title: 'Import JSON file from Optolith',
        content: `
      <form>
        <div class="form-group">
          <label>JSON File</label>
          <input type='text' name='inputField'></input>
        </div>
      </form>`,
        buttons: {
            yes: {
                icon: "<i class='fas fa-check'></i>",
                label: `Import`
            }
        },
        default: 'yes',
        close: html => {
            let result = html.find('input[name=\'inputField\']');
            if (result.val() !== '') {
                let json = result.val()
                const obj = JSON.parse(json)
                var skills = Object.entries(obj.talents)
                skills.forEach(function (s) {
                    // console.log(`${skillMap[s[0]]}: ${s[1]}`)
                    const item = actor.data.items.find(i => i.name === skillMap[s[0]]);
                    const update = {
                        _id: item._id,
                        'data.talentValue.value': s[1]
                    };
                    const updated = actor.updateEmbeddedEntity("OwnedItem", update);
                    // console.log(update)
                    // var item = {}
                    // item["name"] = skillMap[s[0]]
                    // item["data"] = {"talentValue": {"value": s[1]}}
                    // items.push(item)
                    // console.log(item)
                });


            }
        }
    }).render(true);
}
import {
    ATTRIBUTE_MAP,
    RACE_MAP,
    SKILL_MAP,
    COMBAT_SKILL_MAP
} from "./data/maps.js"

// const ATTRIBUTE_MAP = import("./data/attributes.json")
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
                var displayName = game.i18n.localize(`${id}.name`)
                var itemName = displayName
                var tempName = displayName
                var advantage = {}
                switch (id) {
                    case "ADV_0":
                        itemName = displayName = i.sid
                        var source = "Custom Advantage"
                        break
                    case "DISADV_0":
                        itemName = displayName = i.sid
                        var source = "Custom Disadvantage"
                        break
                    case "ADV_50": //Spellcaster
                        var effect = "+20 AE"
                        itemName = displayName
                        break
                    case "SA_0":
                        itemName = displayName = i.sid
                        var cost = i.cost
                        var source = "Custom Ability"
                        break
                    case "SA_9": // Skill Specialization
                        itemName = itemName + ' ()'
                        var option1 = game.i18n.localize(`SKILL.${i.sid}`)
                        var option2 = game.i18n.localize(`SPEC.${i.sid}.${i.sid2}`)
                        displayName = `${displayName} (${option1}: ${option2})`
                        var effect = `${option1} FP2`
                        break
                    default:
                        if (i.sid) {
                            if (typeof (i.sid) == "number") {
                                var option1 = game.i18n.localize(`${id}.options.${i.sid - 1}`)
                                itemName = displayName = `${displayName} (${option1})`
                            } else if (i.sid.startsWith("TAL_")) { // Incompetant
                                var option1 = game.i18n.localize(`SKILL.${i.sid}`)
                                displayName = `${displayName} (${option1})`
                                itemName = itemName = itemName + ' ()'
                            } else {
                                var option1 = i.sid
                                itemName = itemName + ' ()'
                                displayName = `${displayName} (${option1})`
                            }
                        }
                        if (i.sid2) {
                            var option2 = i.sid2
                            displayName = `${tempName} (${option1}: ${option2})`
                        }
                        if (type == "specialability") {
                            var source = "<b>Source:</b>"
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

async function importFromJSON(json) {
    const data = JSON.parse(json)
    var attributes = data.attr.values
    var characteristics = {}
    attributes.forEach(function (attr) {
        var attributeName = ATTRIBUTE_MAP[attr.id]
        // var char = {name:foundry_name,value:att.value}
        // var species = (impAttr == att.id) ? 1 : 0
        var advances = attr.value - 8
        characteristics[attributeName] = {
            // "species": species,
            "advances": advances
        }
    });
    // var improvedAttibuteMax = sheet.attr.attributeAdjustmentSelected


    // var skills = parseSkills(Object.entries(data.talents), "SKILL")
    // var combatSkills = parseSkills(Object.entries(data.ct), "COMBATSKILL")
    // TODO: spells

    // skills = skills.concat(combatSkills)
    // console.log(skills)
    // console.log(Object.entries(data.activatable))
    var activatables = parseActivatable(Object.entries(data.activatable))
    console.log(activatables)
    // console.log(activatables)

    // parseRace
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
                value: game.i18n.localize(`RACE.${race}`)
            }
        },
        status: {
            wounds: {
                initial: RACE_MAP[race].lp,
                value: (characteristics['ko'].advances + 8) * 2 + RACE_MAP[race].lp // set to max health
            },
            soulpower: {
                initial: RACE_MAP[race].spi
            },
            toughness: {
                initial: RACE_MAP[race].tou
            },
            speed: {
                initial: RACE_MAP[race].mov
            }
        }
    }
    // console.log(charData)

    let actor = await CONFIG.Actor.entityClass.create(charData, {
        renderSheet: false
    })
    // Actordsa5.create() doesn't return an actor, need to workaround
    // actor = game.actors.entities.find(a => a.name == data.name)
    // actor = game.actors.entities.pop()
    console.log(actor)
    // update skills
    // skills.forEach(function (s) {
    //     console.log(`Trying skill: ${s.name} with value: ${s.data.talentValue.value}`)
    //     let item = actor.data.items.find(i => i.name === s.name);
    //     console.log(item)
    //     const update = {
    //         _id: item._id,
    //         'data.talentValue.value': s.data.talentValue.value
    //     }
    //     // console.log(update)
    //     const updated = actor.updateEmbeddedEntity("OwnedItem", update);
    // })

    // for (let s of skills) {
    //     let item = actor.data.items.find(i => i.name === s.name)
    //     const update = {
    //         _id: item._id,
    //         'data.talentValue.value': s.data.talentValue.value
    //     }
    //     const updated = actor.updateEmbeddedEntity("OwnedItem", update);
    // }

    for (let s of Object.entries(data.talents)) {
        const update = {
            _id: SKILL_MAP[s[0]],
            'data.talentValue.value': s[1]
        }
        actor.updateEmbeddedEntity("OwnedItem", update);
    }
    for (let s of Object.entries(data.ct)) {
        const update = {
            _id: COMBAT_SKILL_MAP[s[0]],
            'data.talentValue.value': s[1]
        }
        actor.updateEmbeddedEntity("OwnedItem", update);
    }


    // add activables
    let advantages = activatables.filter(a => a.type.includes("advantage"))
    for (let a of advantages) {
        var pack = await game.packs.entries.find(p => p.metadata.label == "Disadvantages and Advantages");
        if (pack) {
            var index = await pack.getIndex();
            var advantage = index.find(i => i.name == a.itemName)
            if (advantage) {
                let item = await pack.getEntry(advantage._id)
                item.name = a.displayName
                await actor.createOwnedItem(item)
            } else {
                console.warn(`Can't find ${a.itemName} in compendium`)
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
                        }
                    }
                })

            }
        } else {
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
                    }
                }
            })
            // console.log(newItem)

        }
    }

    // add special abilities
    let abilities = activatables.filter(a => a.type == "specialability")
    for (let a of abilities) {
        var pack = await game.packs.entries.find(p => p.metadata.label == "Special Abilities");
        if (pack) {
            var index = await pack.getIndex();
            var ability = index.find(i => i.name == a.itemName)
            if (ability) {
                let item = await pack.getEntry(ability._id)
                item.name = a.displayName
                if (a.effect) {
                    item.data.effect.value = a.effect
                }
                await actor.createOwnedItem(item)
            } else {
                console.warn(`Can't find ${a.itemName} in compendium`)
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
                        }
                    }
                })

            }
        } else {
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
                    }
                }
            })
            // console.log(newItem)
        }
    }
    console.log("Finished setting up sheet")
    actor.sheet.render(true)

}



/* -------------------------------------------- */

function importFromOptolithDialog() {
    new Dialog({
        title: `Import Optolith File`,
        content: `<form autocomplete="off" onsubmit="event.preventDefault();">
        <p class="notes">You may import a hero from a JSON file exported from Optolith.</p>
        <p class="notes">This operation will create a new Actor.</p>
        <div class="form-group">
            <label for="data">Source Data</label>
            <input type="file" name="data"/>
        </div>
    </form>`,
        buttons: {
            import: {
                icon: '<i class="fas fa-file-import"></i>',
                label: "Import",
                callback: html => {
                    const form = html.find("form")[0];
                    if (!form.data.files.length) return ui.notifications.error("You did not upload a data file!");
                    readTextFromFile(form.data.files[0]).then(json => importFromJSON(json));
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