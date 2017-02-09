/*******************************************************************************
 * SOUSLESENS LICENSE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Claude Fauconnet claude.fauconnet@neuf.fr
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 ******************************************************************************/

var dbName;
var neoApiUrl = "../exportMongoToNeo";
var currentRequests;
var importType = "LINK";
// messageDivId=document.getElementById("message");

$(function () {

    loadSubgraphs("hist-antiq");


    $('form[name=new_post]').submit(function () {
        $.ajax({
            url: $(this).attr('action'),
            type: "post",
            data: $(this).serialize(),
            dataType: "Document",
            success: function (data, textStatus, jqXHR) {
                callback(data);
            },
            error: function (xhr, err, msg) {
                console.log(xhr);
                console.log(err);
                console.log(msg);
            }
        });
    });


});

function callMongo(urlSuffix, payload, callback) {
    if (!urlSuffix)
        urlSuffix = "";
    $.ajax({
        type: "POST",
        url: Gparams.mongoProxyUrl + urlSuffix,
        data: payload,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            callback(data);
        },
        error: function (xhr, err, msg) {
            console.log(xhr);
            console.log(err);
            console.log(msg);
        }
    });
}


function callExportToNeo(type, data, callback) {
    var subGraph = $("#subGraphSelect").val();
    var db = $("#dbSelect").val();
    var importSourceType = $("#importSourceType").val();
    if (!subGraph || subGraph.length == 0)
        subGraph = prompt("pas de subGraph selectionné , en céer un ? (necesaaire à l'export)");
    else if (!confirm("Export data to subGraph " + subGraph))
        return;
    if (!subGraph || subGraph.length == 0)
        return;
    var payload = {
        type: type,
        sourceType: importSourceType,
        subGraph: subGraph,
        data: JSON.stringify(data),
        dbName: db
    };
    $.ajax({
        type: "POST",
        url: Gparams.mongoToNeoUrl,
        data: payload,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            var xx = data;
            $("#message").html(data.result);
            $("#message").css("color", "green");
            if (callback)
                callback(null, data);
        },
        error: function (xhr, err, msg) {


            console.log(xhr);
            console.log(err);
            console.log(msg);
            if (err.result) {
                $("#message").html(err.result);
                $("#message").css("color", "red");

            }
            else {
                $("#message").html(err);

            }
            if (callback)
                callback(err, data);
        }
    });

}
function callNeoMatch(match, url, callback) {
    payload = {
        match: match
    };
    if (!url)
        url = Gparams.neo4jProxyUrl;

    $.ajax({
        type: "POST",
        url: url,
        data: payload,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            callback(data);
        },
        error: function (xhr, err, msg) {

            console.log(xhr);
            console.log(err);
            console.log(msg);
            if (err.result) {
                $("#message").html(err.result);
                $("#message").css("color", "red");
            }
            else
                $("#message").html(err);
        }

    });

}

function initDBs() {

    callMongo("", {listDatabases: 1,}, function (data) {
        data.databases.sort(function (a, b) {
            if (a.name > b.name)
                return 1;
            if (a.name < b.name)
                return -1;
            return 0;

        });
        for (var i = 0; i < data.databases.length; i++) {
            var str = data.databases[i].name;
            $("#dbSelect").append($('<option/>', {
                value: str,
                text: str
            }));
        }
    });
}
function onDBselect() {
    var dbName = $("#dbSelect").val();
    clearInputs('nodeInput');
    clearInputs('linkInput');
    callMongo("", {listCollections: 1, dbName: dbName}, function (data) {
        data.sort();
        for (var i = 0; i < data.length; i++) {
            var str = data[i];
            var str = data[i];
            $("#collSelect").append($('<option/>', {
                value: str,
                text: str
            }));
        }
        $("#dbSelect").val(dbName);
        loadRequests();
    });
}

function onCollSelect() {
    var collectionName = $("#collSelect").val();
    $("#mongoCollectionNode").val(collectionName);
    $("#mongoCollectionRel").val(collectionName);
    var dbName = $("#dbSelect").val();

    callMongo("", {listFields: 1, dbName: dbName, collectionName: collectionName}, function (data) {

        fillSelectOptionsWithStringArray(fieldSelect, data);
        data.sort();
        for (var i = 0; i < data.length; i++) {
            var str = data[i];

            $("#collSelect").append($('<option/>', {
                value: str,
                text: str
            }));
        }
    });


}

function onFieldSelect() {
    var fieldName = $("#fieldSelect").val();
    $("#currentField").val(fieldName);
    /*
     * var inputId=$("input:focus").attr("id"); if(inputId)
     * $("#"+inputId).val(fieldName);
     */

}

function addToExportedFields() {
    var fieldSelect = $("#fieldSelect").val();
    var exportedFields = $("#exportedFields").val();
    if (exportedFields && exportedFields.length > 0)
        $("#exportedFields").val(exportedFields + ";" + fieldSelect);
    else
        $("#exportedFields").val(fieldSelect);

}
function setMongoField() {
    var fieldSelect = $("#fieldSelect").val();
    $("#mongoField").val(fieldSelect);

}

function setMongoLabelField() {
    var fieldSelect = $("#fieldSelect").val();
    $("#label").val("#" + fieldSelect);

}
function setMongoSourceField() {
    var fieldSelect = $("#fieldSelect").val();
    $("#mongoSourceField").val(fieldSelect);
}

function setMongoTargetField() {
    var fieldSelect = $("#fieldSelect").val();
    $("#mongoTargetField").val(fieldSelect);
}
function setNeoRelAttributeField() {
    var fieldSelect = $("#fieldSelect").val();
    $("#neoRelAttributeField").val(fieldSelect);
}
function validateMongoQuery(mongoQuery) {
    if (!mongoQuery || mongoQuery.length == 0) {
        mongoQuery = "{}";
        return mongoQuery;
    }
    else {
        try {

            mongoQuery = eval('(' + mongoQuery + ')');
            //  mongoQuery = JSON.stringify(mongoQuery);
            return JSON.stringify(mongoQuery);
        }
        catch (e) {
            $("#message").html("indalid json for field mongoQuery");
            return null;
        }
    }
}
function exportNeoNodes(execute, save) {
    importType = "NODE";
    var mongoDB = $("#dbSelect").val();
    var mongoCollectionNode = $("#mongoCollectionNode").val();
    var exportedFields = $("#exportedFields").val();
    var mongoField = $("#mongoField").val();
    var label = $("#label").val();
    var mongoQuery = $("#mongoQuery").val();
    var subGraph = $("#subGraphSelect").val();
    var distinctValues = $("#distinctValues").prop('checked');
    var mongoIdField = $("#mongoIdField").val();

    mongoQuery = validateMongoQuery(mongoQuery);
    if (!mongoQuery)
        return;


    var query = "action=exportMongo2NeoNodes";

    var data = {
        mongoDB: mongoDB,
        mongoCollection: mongoCollectionNode,
        exportedFields: exportedFields,
        mongoField: mongoField,
        distinctValues: distinctValues,
        mongoIdField: mongoIdField,
        label: label,
        mongoQuery: mongoQuery,
        subGraph: subGraph
    };

    var message = "";
    for (var key in data) {
        if (!data[key] || data[key] == "") {
            if (key != "exportedFields" && key != "distinctValues")
                message += "<br>" + key + " cannot be empty";
        }

    }
    $("#exportMessageNodes").html(message);
    if (message.length > 0)
        return;

    $("#exportParams").val(JSON.stringify(data).replace(/,/, ",\n"));
    if (save)
        saveRequest(JSON.stringify(data).replace(/,/, ",\n"));
    if (execute) {
        $("#exportResultDiv").html("");
        callExportToNeo("node", data);
    }


}
function exportNeoLinks(execute, save) {
    importType = "LINK";
    var mongoDB = $("#dbSelect").val();
    var mongoCollectionRel = $("#mongoCollectionRel").val();
    var mongoSourceField = $("#mongoSourceField").val();
    var neoSourceLabel = $("#neoSourceLabel").val();
    var mongoTargetField = $("#mongoTargetField").val();
    var neoTargetLabel = $("#neoTargetLabel").val();
    var relationType = $("#relationType").val();
    var neoRelAttributeField = $("#neoRelAttributeField").val();
    var mongoQueryR = $("#mongoQueryR").val();
    var subGraph = $("#subGraphSelect").val();

    mongoQueryR = validateMongoQuery(mongoQueryR);

    var data = {
        mongoDB: mongoDB,
        mongoCollection: mongoCollectionRel,
        mongoSourceField: mongoSourceField,
        neoSourceLabel: neoSourceLabel,
        mongoTargetField: mongoTargetField,
        neoTargetLabel: neoTargetLabel,
        relationType: relationType,
        neoRelAttributeField: neoRelAttributeField,
        mongoQueryR: mongoQueryR,
        subGraph: subGraph
    };
    var message = "";
    for (var key in data) {
        if (key.indexOf("mongoQuery") == 0 & data[key] == "")
            data[key] = "{}";

        if (!data[key] || data[key] == "") {
            if (key != "neoRelAttributeField")
                message += "<br>" + key + " cannot be empty";
        }

    }
    $("#exportMessageLinks").html(message);
    if (message.length > 0)
        return;

    $("#exportParams").val(JSON.stringify(data).replace(/,/, ",\n"));

    if (save)
        saveRequest(JSON.stringify(data).replace(/,/, ",\n"));
    if (execute) {
        $("#exportResultDiv").html("");
        callExportToNeo("relation", data);
    }


}


function afterImport(data) {
    $("#message").html(data.message);
    $("#exportResultDiv").append(data.message + "<br>");

    /*	$("#tabs-center").tabs({
     active : 1
     });*/
}


function loadLabels(subGraphName) {// not used

    return;


    var match = "Match (n) where n.subGraph=\"" + subGraphName
        + "\" return distinct labels(n)[0] as label";
    callNeoMatch(match, null, function (data) {

        if (data && data.length > 0) {// } && results[0].data.length >
            var labels = []
            for (var i = 0; i < data.length; i++) {
                var value = data[i].label;
                labels.push(value);

            }
            labels.splice(0, 0, "");
            //     fillSelectOptionsWithStringArray(labelsSelect, labels)

        }
    });

};

function loadSubgraphs(defaultSubGraph) {
    var match = "Match (n)  return distinct n.subGraph as subGraph";
    callNeoMatch(match, null, function (data) {
        if (data && data.length > 0) {// } && results[0].data.length >
            var subgraphs = []
            for (var i = 0; i < data.length; i++) {
                var value = data[i].subGraph;
                subgraphs.push(value);
            }
            subgraphs.splice(0, 0, "");
            fillSelectOptionsWithStringArray(subGraphSelect, subgraphs);
            if (subGraphSelect)
                fillSelectOptionsWithStringArray(subGraphExportSelect, subgraphs)
        }
    });


};


function deleteRequest() {
    var request = $("#requests").val();
    if (confirm("delete request :" + request)) {
        callMongo("", {
            delete: 1,
            dbName: $("#dbSelect").val(),
            collectionName: "requests_" + $("#subGraphSelect").val(),
            query: {name: request},
        }, function (result) {
            $("#requests option:contains(" + request + ")").remove();
        });
    }
}


function saveRequest(json) {
    var subGraph = $("#subGraphSelect").val();
    var query = "action=saveQuery";
    var mongoDB = $("#dbSelect").val();
    var mongoDB = $("#dbSelect").val();
    //var json = $("#exportParams").val();
    if (json.indexOf("relationType") > -1) {
        json = json.replace("mongoCollection", "mongoCollectionRel");
    }
    if (json.indexOf("label") > -1) {
        json = json.replace("mongoCollection", "mongoCollectionNode");
    }

    json = json.replace('"mongoDB":"' + mongoDB + '",', "");// on ne stoke pas la base
    var jsonObj = JSON.parse(json);
    var name = "";
    var type = "";
    if (json.indexOf("relationType") > -1) {
        type = "relation";
        name = "Rels_" + $("#subGraphSelect").val() + "." + $("#neoSourceLabel").val()
            + "->" + $("#neoTargetLabel").val() + ":" + jsonObj.relationType;

    }
    if (json.indexOf("label") > -1) {
        type = "node";
        name += "Nodes_" + $("#subGraphSelect").val() + "." + $("#label").val();
    }


    data = {
        mongoDB: mongoDB,
        type: type,
        request: json,
        name: name,
        date: new Date()
    }
    var query = {name: name};
    if (mongoDB == "csv") {
        if (!currentRequests)
            currentRequests = {};
        data.name = data.name;
        currentRequests[name] = data;
        var path = "./uploads/requests_" + $("#collSelect").val() + ".json";
        var paramsObj = {


            path: path,
            store: true,
            data: currentRequests
        }
        $.ajax({
            type: "POST",
            url: "/jsonFileStorage",
            data: paramsObj,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                setMessage(data.result, "green");
                return;
            },

            error: function (xhr, err, msg) {
                console.log(xhr);
                console.log(err);
                console.log(msg);
            },

        });


    } else {
        callMongo("", {
            updateOrCreate: 1,
            dbName: mongoDB,
            collectionName: "requests",
            query: JSON.stringify(query),
            data: JSON.stringify(data)
        }, function (result) {

            loadRequests()
        });

    }
}

function loadRequests() {
    var dbName = $("#dbSelect").val();
    var subGraph = $("#subGraphSelect").val();

    if ($("#importSourceType").val() == "CSV") {
        var path = "./uploads/requests_" + $("#collSelect").val() + ".json";
        var paramsObj = {
            path: path,
            retreive: true,

        }
        $.ajax({
            type: "POST",
            url: "/jsonFileStorage",
            data: paramsObj,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                if (!data)
                    return;
                var currentRequestsObj = data;
                var requestsArray = [];

                for (var key in data) {

                    requestsArray.push(data[key]);

                }
                currentRequests = [];
                for (var key in currentRequestsObj) {

                    var obj = currentRequestsObj[key];
                    currentRequests.push(obj);
                }
                fillSelectOptions(requests, requestsArray, "name", "name");
                setRequestSubGraphFilterOptions();
            },

            error: function (xhr, err, msg) {
                console.log(xhr);
                console.log(err);
                console.log(msg);
            },

        });
    }
    else {
        callMongo("", {
            find: 1,
            dbName: dbName,
            collectionName: "requests",
            mongoQuery: "{}"
        }, function (data) {


            data.sort(function (a, b) {
                if (a.name > b.name)
                    return 1;
                if (a.name < b.name)
                    return -1;
                return 0;
            });
            currentRequests = data;
            for (var i = 0; i < currentRequests.length; i++) {
                if (currentRequests[i].request) {
                    currentRequests[i].request = JSON.parse(currentRequests[i].request);
                }
            }
            fillSelectOptions(requests, currentRequests, "name", "name");
            setRequestSubGraphFilterOptions();


        });
    }


}

function setRequestSubGraphFilterOptions() {
    var requestSubGraphs = [];
    for (var i = 0; i < currentRequests.length; i++) {
        if (currentRequests[i].request) {
            var obj = currentRequests[i].request;
            if (obj && requestSubGraphs.indexOf(obj.subGraph) < 0) {
                requestSubGraphs.push(obj.subGraph);
            }

        }

    }
    requestSubGraphs.splice(0, 0, "")
    fillSelectOptionsWithStringArray(requestsFilter, requestSubGraphs);
}

function filterRequests(select) {
    var subGraph = $(select).val();
    var filteredRequests = [];
    for (var i = 0; i < currentRequests.length; i++) {
        if (subGraph == "" | currentRequests[i].request.subGraph == subGraph) {
            filteredRequests.push(currentRequests[i]);
        }
    }
    fillSelectOptions(requests, filteredRequests, "name", "name");
}

function loadRequest(requestName, changeTab) {

    if (!requestName)
        requestName = $("#requests").val();
    if (requestName.startsWith("Node"))
        clearInputs("nodeInput");
    if (requestName.startsWith("Rel"))
        clearInputs("linkInput");
    var requests = [];

    if (Array.isArray(currentRequests))// case Mongo
        requests = currentRequests
    else {// case CSV
        for (var key in currentRequests) {
            requests.push(currentRequests[key]);
        }
    }

    for (var i = 0; i < requests.length; i++) {
        if (requests[i].name == requestName) {
            var obj = requests[i].request;

            for (var key in obj) {

                $("#" + key).val(obj[key]);
                if (key == "distinctValues" && obj[key] == true) {
                    $("#distinctValues").prop('checked', 'checked');
                }

            }
            if (changeTab && requestName.startsWith("Node"))
                $("#tabs-center").tabs({
                    active: 1
                });
            else if (changeTab && requestName.startsWith("Rel"))
                $("#tabs-center").tabs({
                    active: 2
                });

            return;
        }
    }
}


function eraseNeoSubgraph(subGraph) {
    if (!subGraph)
        subGraph = $("#subGraphSelect").val();
    var ok = confirm("Voulez vous vraiment effacer le subGraph " + subGraph);
    if (!ok)
        return;

    var match = 'MATCH (n)-[r]-(m) where n.subGraph="' + subGraph + '" delete  r';

    callNeoMatch(match, null, function (data) {
        var match = 'MATCH (n)where n.subGraph="' + subGraph + '" delete n';
        callNeoMatch(match, null, function (data) {
            $("#message").html("subGraph=" + subGraph + "deleted");
            $("#message").css("color", "red");
            $(graphDiv).html("");
            $('#labelsSelect')
                .find('option')
                .remove()
                .end()

        });
    });
}


function refreshNeo() {
    $("#exportResultDiv").html("");
    var subGraph = $("#subGraphSelect").val();
    if (!subGraph || subGraph.length == 0) {
        subGraph = alert("pas de subgraph !!");

        // if (!subGraph || subGraph.length == 0)
        return;
    }

    var requestFilters = [];
    var requestCbxes = $("[name=exportNameCbx]");
    for (var i = 0; i < requestCbxes.length; i++) {
        if (requestCbxes[i].checked) {
            requestFilters.push(requestCbxes[i].value);
        }
    }


    var requestsToExcecute = [];
    for (var i = 0; i < requestFilters.length; i++) {
        for (var j = 0; j < currentRequests.length; j++) {
            if (currentRequests[j].name == requestFilters[i]) {
                requestsToExcecute.push(currentRequests[j].name);
            }
        }

    }
    callExportToNeo("batch", requestsToExcecute, function (error, result) {
        var str = "<B>IMPORT SUMMARY</B>:<br><ul>"
        for (var i = 0; i < result.result.length; i++) {
            str += "<li>" + result.result[i] + "</li>";

        }
        str += "</ul>"
        $("#exportResultDiv").html(str);
    });

    /* var xx = currentRequests;
     for (var i = 0; i < requestFilters.length; i++) {
     for (var j = 0; j < currentRequests.length; j++) {
     if (currentRequests[j].name == requestFilters[i]) {
     loadRequest(requestFilters[i], false)
     if (requestFilters[i].startsWith("Nodes_")) {
     exportNeoNodes(true, false);
     }
     if (requestFilters[i].startsWith("Rels_")) {
     exportNeoLinks(true, false);
     }

     }

     }

     }*/


}


function submitMatchNeo(query, callback) {
    var payload = {
        "statements": [{
            "statement": query
        }]
    };
    paramsObj = {
        mode: "POST",
        urlSuffix: "db/data/transaction/commit",
        payload: JSON.stringify(payload)
    }

    console.log("QUERY----" + JSON.stringify(payload));
    $.ajax({
        type: "POST",
        url: neoApiUrl,
        data: paramsObj,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {

            if (!data || data.length == 0) {
                // setMessage("No results", blue);
                return;
            }
            var errors = data.errors;

            if (errors && errors.length > 0) {
                return;
            }
            callback(data);

        },
        error: function (xhr, err, msg) {
            console.log(xhr);
            console.log(err);
            console.log(msg);
        },

    });
}

function initBatchNeoRefresh(type) {
    var requestNames = [];
    var i = 0;
    $("#requests option").each(function (d) {
        if (this.text.indexOf(type) == 0)
            requestNames.push(this.text);
    });

    var str = "";
    var checked = "";//"' checked='checked' ";
    var onclick = " onclick='startQueryFilterMode() '"
    onclick = "";
    var noChecked = "";
    str += "<table>"

    str += "<tr align='center' class='italicSpecial'><td ><span class='bigger'>Noeuds</span></td><td>Inclure<br><input type='checkbox' id='#comuteAllFiltersNodesInclude' onchange='comuteAllFilters(this)'></td>" +
        "</tr>";
    for (var i = 0; i < requestNames.length; i++) {
        str += "<tr align='center'>";
        str += "</td><td>" + requestNames[i];
        str += "<td><input type='checkbox' name='exportNameCbx' value='"
            + requestNames[i] + "'" + onclick + checked + "/> "

        str += "<td></tr>";
    }
    str += "<tr><td colspan='3' >&nbsp;</B></td></td></tr>";

    str += "</table>"
    $("#exportNamesDiv").html(str);
    $("#refreshNeoButton").css("visibility", "visible");
    $("#exportNamesDiv").css("visibility", "visible");

}

function comuteAllFilters(caller) {
    var str = $(caller).attr("id");
    var status = $(caller).prop("checked");

    function comuteAll(cbxs, mode) {
        var relCbxes = $("[name=" + cbxs + "]");
        for (var i = 0; i < relCbxes.length; i++) {
            $(relCbxes[i]).prop("checked", mode);
        }

    }

    if (str == "#comuteAllFiltersNodesInclude")
        comuteAll("exportNameCbx", status);

}

function onSubGraphSelect(select, showgraph) {

    var value = $("#subGraphSelect").val();
    $('#subGraph').val(value);
    if (value == "")
        return;
    loadLabels($('#subGraphSelect').val());
    var subGraph = $("#subGraphSelect").val();
    if (showgraph) {
        drawNeoModel(subGraph);
        $("#tabs-center").tabs({
            active: 3
        });
    }
}

function onLabelSelect(select) {
    var value = $(select).val();
    $('#label').val(value);

}

function addSubGraph() {
    var newSubGraph = prompt("New Subgraph name ");
    if (!newSubGraph || newSubGraph.length == 0)
        return;

    $("#subGraphSelect").append($('<option>', {
        text: newSubGraph,
        value: newSubGraph
    }));

    $("#subGraphSelect").val(newSubGraph);
}

function clearInputs(name) {
    $("[name=" + name + "]").val("");

}

function submitCsvForm() {

    $.ajax({
        url: $('#uploadCcvForm').attr('action'),
        type: "post",
        data: $('#uploadCcvForm').serialize(),
        dataType: "Document",
        success: function (data, textStatus, jqXHR) {
            callback(data);
        },
        error: function (xhr, err, msg) {
            console.log(xhr);
            console.log(err);
            console.log(msg);
        }
    });

}


function setImportSourceType() {
    dbSelect.options = [];
    collSelect.options = [];
    fieldSelect.options = [];
    var type = $("#importSourceType").val();
    if (type == "CSV") {
        $("#importCSVdiv").css("visibility", "visible");
        $("#importMongoDiv").css("visibility", "hidden");
        $(".dbInfos").css("visibility", "visible");

    } else if (type == "MongoDB") {
        initDBs();
        $("#importCSVdiv").css("visibility", "hidden");
        $("#importMongoDiv").css("visibility", "visible");
        $(".dbInfos").css("visibility", "visible");

    }

}