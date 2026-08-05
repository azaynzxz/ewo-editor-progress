#target photoshop
app.bringToFront();

String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, '');
};

function main() {
    var win = new Window("dialog", "Script to PSD Generator");
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];

    // Auto-detect files in the script's folder
    var scriptFile = new File($.fileName);
    var scriptFolder = scriptFile.parent;
    
    var psdFiles = scriptFolder.getFiles("*.psd");
    var jsonFiles = scriptFolder.getFiles("*.json");
    
    var psdFile = psdFiles.length > 0 ? psdFiles[0] : null;
    var jsonFile = jsonFiles.length > 0 ? jsonFiles[0] : null;
    var outputFolder = scriptFolder;

    win.add("statictext", undefined, "1. Template PSD:");
    var btnPsd = win.add("button", undefined, "Select Template PSD");
    var txtPsd = win.add("statictext", undefined, psdFile ? psdFile.fsName : "No PSD selected", {truncate: 'middle'});
    txtPsd.characters = 40;

    win.add("statictext", undefined, "2. Script Annotations JSON:");
    var btnJson = win.add("button", undefined, "Select JSON File");
    var txtJson = win.add("statictext", undefined, jsonFile ? jsonFile.fsName : "No JSON selected", {truncate: 'middle'});
    txtJson.characters = 40;

    win.add("statictext", undefined, "3. Output Folder:");
    var btnOutput = win.add("button", undefined, "Select Output Folder");
    var txtOutput = win.add("statictext", undefined, outputFolder ? outputFolder.fsName : "No Folder selected", {truncate: 'middle'});
    txtOutput.characters = 40;

    btnPsd.onClick = function() {
        var f = File.openDialog("Select Template PSD", "*.psd,*.psdt");
        if (f) { psdFile = f; txtPsd.text = psdFile.fsName; }
    }

    btnJson.onClick = function() {
        var f = File.openDialog("Select JSON File", "*.json");
        if (f) { jsonFile = f; txtJson.text = jsonFile.fsName; }
    }

    btnOutput.onClick = function() {
        var f = Folder.selectDialog("Select Output Folder");
        if (f) { outputFolder = f; txtOutput.text = outputFolder.fsName; }
    }

    var btnProcess = win.add("button", undefined, "Process and Generate PSDs");
    btnProcess.onClick = function() {
        if (!psdFile || !jsonFile || !outputFolder) {
            alert("Please select the PSD, JSON, and Output Folder first!");
            return;
        }
        win.close();
        processFiles(psdFile, jsonFile, outputFolder);
    }

    win.show();
}

function processFiles(psdFile, jsonFile, outputFolder) {
    jsonFile.open("r");
    var jsonStr = jsonFile.read();
    jsonFile.close();
    
    var data;
    try {
        data = eval("(" + jsonStr + ")");
    } catch(e) {
        alert("Failed to parse JSON.");
        return;
    }
    
    if (!data || data.length === 0) {
        alert("JSON is empty.");
        return;
    }

    var templateDoc;
    try {
        templateDoc = app.open(psdFile);
    } catch(e) {
        alert("Failed to open PSD template.");
        return;
    }
    
    var originalRulerUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;

    var processedCount = 0;

    for (var i = 0; i < data.length; i++) {
        var scene = data[i];
        
        // Duplicate the document for this scene
        var doc = templateDoc.duplicate("S" + scene.scene_id);
        app.activeDocument = doc;
        
        var layerId = findLayerByName(doc, "#scene_id");
        var layerStart = findLayerByName(doc, "#start_dialog");
        var layerEnd = findLayerByName(doc, "#end_dialog");
        var layerActions = findLayerByName(doc, "#actions");
        
        if (layerId && layerId.typename === "ArtLayer" && layerId.kind == LayerKind.TEXT) {
            layerId.textItem.contents = "#" + scene.scene_id;
        }
        
        var words = scene.scene_text ? scene.scene_text.split(/\s+/) : [];
        if (layerStart && layerStart.typename === "ArtLayer" && layerStart.kind == LayerKind.TEXT) {
            if (words.length >= 2) {
                layerStart.textItem.contents = words[0] + " " + words[1];
            } else {
                layerStart.textItem.contents = scene.scene_text || "";
            }
        }
        
        if (layerEnd && layerEnd.typename === "ArtLayer" && layerEnd.kind == LayerKind.TEXT) {
            if (words.length >= 2) {
                layerEnd.textItem.contents = words[words.length - 2] + " " + words[words.length - 1];
            } else {
                layerEnd.textItem.contents = scene.scene_text || "";
            }
        }
        
        if (layerActions && layerActions.typename === "ArtLayer" && layerActions.kind == LayerKind.TEXT) {
            var actionsArr = [];
            if (scene.actions && scene.actions.length > 0) {
                for (var j = 0; j < scene.actions.length; j++) {
                    var act = scene.actions[j];
                    var actNum = act.id.replace("S", "");
                    actionsArr.push("#" + actNum + " " + act.text);
                }
                layerActions.textItem.contents = actionsArr.join("\r");
            } else {
                layerActions.textItem.contents = "";
            }
        }
        
        // Merge the targeted layers into layer 'x'
        var mergeGroup = doc.layerSets.add();
        mergeGroup.name = "x";
        
        var layersMoved = 0;
        if (layerId) { layerId.move(mergeGroup, ElementPlacement.INSIDE); layersMoved++; }
        if (layerStart) { layerStart.move(mergeGroup, ElementPlacement.INSIDE); layersMoved++; }
        if (layerEnd) { layerEnd.move(mergeGroup, ElementPlacement.INSIDE); layersMoved++; }
        if (layerActions) { layerActions.move(mergeGroup, ElementPlacement.INSIDE); layersMoved++; }
        
        if (layersMoved > 0) {
            var mergedLayer = mergeGroup.merge();
            mergedLayer.name = "x";
        } else {
            mergeGroup.remove(); // if none of the specific layers exist, just remove the empty group
        }
        
        var outFileName = "S" + scene.scene_id + ".psd";
        var outFile = new File(outputFolder + "/" + outFileName);
        
        var psdSaveOptions = new PhotoshopSaveOptions();
        psdSaveOptions.embedColorProfile = true;
        psdSaveOptions.alphaChannels = true;
        psdSaveOptions.annotations = true;
        
        doc.saveAs(outFile, psdSaveOptions, true, Extension.LOWERCASE);
        doc.close(SaveOptions.DONOTSAVECHANGES);
        
        processedCount++;
    }
    
    templateDoc.close(SaveOptions.DONOTSAVECHANGES);
    app.preferences.rulerUnits = originalRulerUnits;
    
    alert("Done! Processed and saved " + processedCount + " PSDs.");
}

function findLayerByName(parent, name) {
    for (var i = 0; i < parent.layers.length; i++) {
        var layer = parent.layers[i];
        if (layer.name.toLowerCase() === name.toLowerCase()) {
            return layer;
        } else if (layer.typename === "LayerSet") {
            var found = findLayerByName(layer, name);
            if (found) return found;
        }
    }
    return null;
}

main();
