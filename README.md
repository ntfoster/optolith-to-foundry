# Optolith to Foundry Importer
A module for [Foundry Virtual Tabletop](https://foundryvtt.com/) to import The Dark Eye/Das Schwarze Auge characters from the [Optolith](https://optolith.app/) character creator

This is an early work in progress and there is likely a large number of issues and many feature stills to be implemented. I have not yet tested all possible options in Optolith annd there will be some options that are not supported yet, but the most common ones should hopefully work.

Please submit an issue if you find anything which does not work correctly. If you can include a copy of the console log as well that would be very helpful as well (Open console with F12, go to the Console tab, Right click in the console > Save as).

## Installation

You can install this module by using the following URL in the 'Manifest URL' box on the Install Module screen.
```
https://github.com/ntfoster/optolith-to-foundry/releases/latest/download/module.json
```
Remember to activate the module once you have launched a world (Game Settings tab > Manage Modules).

## Usage
If you are logged in as a user with permission to create new Actors, there will be an Import button at the top of the Actors Directory tab. This will open a dialog box for you to upload a JSON file from your computer. Once import is complete, the character sheet for the newly imported Actor will pop up.

If you have the Core Rules module installed, (Dis)advantages, abilities, spells, liturgies and items available in that module will be imported from the Compendium, with some exceptions. Items that are not imported will still be added to the character sheet, but without descriptions or rules, etc. These will need to be manually checked and corrected if necessary.

A list of items which were not imported from the Compendium, along with the source book they appear in, can be displayed with the following options:
- **Show Popup**: Display the list of items which were not imported from the compendium in a dialog box. Note: this currently sometimes appears *underneath* the character sheet
- **Add to Notes**: Adds the list of items which were not automatically imported from the compendium to the Notes section of the character sheet.

No matter which options are picked, the list of items which were not imported is output to the console (F12) as an array. Look for the following line followed by an array of items: `Optolith to Foundry Importer | Items that were not found in compendium:`

## Rules modules ##
Rules modules are availabe from Ulisses from the [German F-SHOP](https://www.f-shop.de/virtual-tabletops/) and soon to be from the [English F-SHOP](https://www.ulissesf-shop.com/)

## Known issues
- **Currently only works with one set of data modules** (e.g. Core Data) and will likely break if you have more installed.
- Some items don't have the exact same names in Optolith and Foundry and won't automatically import
- Some of the German UI translation is currently machine-generated. **Es tut mir leid, mein Deutsch ist nicht so gut!**

## Future plans
- Support for multiple data modules
- Automatially set values for Mage/Priest Traditions to set correct AE/KP
- Import stats for custom items created in Optolith
- Assign correct category to items not imported from Compendium
- Better translation
- Import avatar image if present in Optolith JSON file
- Import pets
- ...and more
