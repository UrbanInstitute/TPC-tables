d3.json("data/sample2.json", function(resp){
	var table = resp["tables"]["1787"]["table_data"]
//Top level keys are col numbers, but bc of nesting number of keys != number of columns
//however largest(integer) key == number of columns
	var colCount = Math.max.apply(null, Object.keys(table).map(function(n){ return parseInt(n) }))
	var rows =[]

	var initializer = table[0]
	console.log(initializer, colCount)
	var initRows = parseInt(initializer["header_cell"]["data-row"])
	for(var i = 0; i < initRows; i++){
		rows.push(new Array(colCount))
	}
	console.log(writeTH(initializer["header_cell"]))
})

function addRow(rows, colCount){
	rows.push(new Array(colCount))
}

function writeTH(header_cell){
	th = "<th class=\"" 
	var classes = header_cell["class"]
	for(var i =0; i< classes.length; i++){
		if(classes[i] == "" || isNaN(classes[i]) == false){
			continue
		}else{
			th += classes[i]
		}
		th += " "
	}
	th = th.trim()
	th += "\""
	if(parseInt(header_cell["colspan"]) != 1){ th += " colspan=\"" + header_cell["colspan"] + "\" "}
	if(parseInt(header_cell["rowspan"]) != 1){ th += " rowspan=\"" + header_cell["rowspan"] + "\" "}
	th += " data-row=\"" + header_cell["data-row"] + "\" "
	th += " data-col=\"" + header_cell["data-col"] + "\" "
	th += ">" + header_cell["data"] + "</th>"
	return th
}