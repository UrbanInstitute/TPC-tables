function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    console.log('Query variable %s not found', variable);
}


d3.json("http://tpctables-stg.urban.org/node/1701/table_feed", function(resp){
	var table = resp["tables"]["1787"]["table_data"]
//Top level keys are col numbers, but bc of nesting number of keys != number of columns
//however largest(integer) key == number of columns
	var colCount = Math.max.apply(null, Object.keys(table).map(function(n){ return parseInt(n)+1 }))
	var rows =[]

	var initializer = table[0]
	var initRows = parseInt(initializer["header_cell"]["data-row"])
	for(var i = 0; i < initRows+1; i++){
		rows.push(new Array(colCount))
	}
	// console.log(writeCell(initializer["header_cell"], "header"))
	var tmp = rows[initRows]
	tmp.splice(0, 0, writeCell(initializer["header_cell"], "header"));
	for (ind in initializer["label_cells"]){
		var cell = initializer["label_cells"][ind]
		var row = parseInt(cell["data-row"])
		if(row < rows.length){
			tmp = rows[row]
			tmp.splice(0,0,writeCell(cell, "label"))
			// rows[row][0] = 
		}else{
			for(var j = rows.length; j < row+1; j++){
				rows.push(new Array(colCount))
				if(j == row){
					// console.log(rows, row, initRows)
					tmp = rows[row]
					tmp.splice(0,0,writeCell(cell, "label"))
					// rows[row][0] = writeCell(cell, "label")
				}
			}
		}
	}

	// console.log(rows)
	buildRows(rows, table)

})

function buildRows(rows, table){
	for(obj in table){
		if(table.hasOwnProperty(obj)){
			if (parseInt(obj)==0){
				continue
			}else{
				var data = table[obj]
				var header = data["header_cell"]
				var tmp = rows[parseInt(header["data-row"])]
				tmp.splice(parseInt(header["data-col"]), 0, writeCell(header, "header"))
				// rows[parseInt(header["data-row"])][parseInt(header["data-col"])] = writeCell(header, "header")
				if(data.hasOwnProperty("nested")){
					buildRows(rows, data["nested"])
				}
				else{
					for(c in data["data_cells"]){
						if( (data["data_cells"]).hasOwnProperty(c)){
							var cell = data["data_cells"][c]
							var tmp = rows[parseInt(cell["data-row"])]
							tmp.splice(parseInt(cell["data-col"]), 0, writeCell(cell, "data"))
							// rows[parseInt(cell["data-row"])][parseInt(cell["data-col"])] = writeCell(cell, "data")
						}
					}
				}
			}
		}
	}
	window.setTimeout(function(){
		buildTable(rows)}, 10);
}

function buildTable(rows){
	rows = rows.filter(function(n){
		n = n.filter(function(m){
			return m != undefined;
		})
		return n.length > 0;
	}); 

	var table = d3.select("#testTable")
	if(table.selectAll("tr")[0].length == 0){
		for(var r = 0; r < rows.length; r++){
			var row = rows[r]
			// console.log(row)
			var rowObj = table.append("tr")
			for(var c = 0; c < row.length; c++){
				console.log(c, row, row[c])
				var cell = row[c];
				// console.log(c, row, cell)
				if(cell == undefined){
					continue;
				}
				else if(cell.tag == "th"){
					rowObj.append("th")
						.datum(cell)
						.attr("rowspan", cell.rowspan)
						.attr("colspan", cell.colspan)
						.text(cell.value)
				}
				else{
					rowObj.append("td")
						.datum(cell)
						.attr("rowspan", cell.rowspan)
						.attr("colspan", cell.colspan)
						.text(cell.value)
				}
			}
		}
	}
}

function addRow(rows, colCount){
	rows.push(new Array(colCount))
}

function writeCell(cell, type){
	var obj = {}
	var tag = (type == "header") ? "th" : "td";
	obj.tag = tag
	var classes = cell["class"]
	var newClasses = []
	for(var i =0; i< classes.length; i++){
		if(classes[i] == "" || isNaN(classes[i]) == false){
			continue
		}else{
			newClasses.push(classes[i])

		}
	}
	obj["classes"] = newClasses
	if(parseInt(cell["colspan"]) != 1 && cell["colspan"] != null){ obj.colspan = cell.colspan }
	if(parseInt(cell["rowspan"]) != 1 && cell["rowspan"] != null){ obj.rowspan = cell.rowspan }
	obj["data-row"] = cell["data-row"]
	obj["data-col"] = cell["data-col"]
	obj["value"] = cell["data"]
	return obj
}
// function writeCell(cell, type){
// 	var tag = (type == "header") ? "th" : "td";
// 	var output = "<" + tag + " class=\"" 
// 	// console.log(cell)
// 	var classes = cell["class"]
// 	for(var i =0; i< classes.length; i++){
// 		if(classes[i] == "" || isNaN(classes[i]) == false){
// 			continue
// 		}else{
// 			output += classes[i]
// 		}
// 		output += " "
// 	}
// 	output = output.trim()
// 	output += "\""
// 	if(parseInt(cell["colspan"]) != 1 && cell["colspan"] != null){ output += " colspan=\"" + cell["colspan"] + "\" "}
// 	if(parseInt(cell["rowspan"]) != 1 && cell["rowspan"] != null){ output += " rowspan=\"" + cell["rowspan"] + "\" "}
// 	output += " data-row=\"" + cell["data-row"] + "\" "
// 	output += " data-col=\"" + cell["data-col"] + "\" "
// 	output += ">" + cell["data"] + "</" + tag + ">"
// 	return output
// }