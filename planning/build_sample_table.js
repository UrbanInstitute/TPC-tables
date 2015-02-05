d3.json("complex_table.json", function(error, json) {
  if (error) return console.warn(error);
  build_table(json);
});

var table = d3.select("body").append("table"),
        thead = table.append("thead"),
        tbody = table.append("tbody");

function build_table(json){
	var components = decompose_json(json)
	build_title(components.title);
	build_columns(components.columns);
	build_rows(components.rows);
	build_footnotes(components.footnotes);
}

function decompose_json(json){
	var tmp_table = json["tables"][0];
	var components = {
		"title": tmp_table["title"],
		"columns": tmp_table["columns"],
		"rows": tmp_table["rows"],
		"footnotes": tmp_table["footnotes"],
		"conditional styles": tmp_table["conditional styles"]
	}
	return components
}

function build_title(title){

}

function build_columns(columns){
	var row_depth = 1;
	var header_obj = [];
	for(var i = 0; i < columns.length; i++) {
		var col = columns[i]
		// var col_obj = []
		// col_obj.push([col["label"]])
		var c = has_children([],col)
		header_obj.push(c)
	}

	console.log(header_obj)

	function has_children(col_obj, col){
		var children = col["children"]
		// console.log("col",col)
		// console.log("children",children)

		if(children){
			var tmp = []
			col_obj.push(col["label"])

			for(var i = 0; i< children.length; i++){
				tmp.push(children[i]["label"])
			}
			col_obj.push(tmp)

			for(var i = 0; i< children.length; i++){
				has_children(col_obj,children)
			}

		}
		else{
			col_obj.push(col["label"])
		}
		return col_obj
	}
	
}

function build_rows(rows){

}

function build_footnotes(footnotes){

}

