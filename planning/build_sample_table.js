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

var counter = 0;
var promises = [];
var headers = []

function build_columns(columns){
	
	for(var i = 0; i < columns.length; i++) {
		promises.push(function(){
			col = columns[i]
			var header = {"label":col["label"]}
			header.row_span = 1
			header.col_span = 1
			header.row = 1
			if(col.hasOwnProperty("children")){
				counter++
				console.log("header", [header])
				console.log(col["children"])
				var children = promises.push(drill_down([header],col["children"]))
			}
			return headers.push(header)
			})
		promises.push(function(){
				if(typeof children !== "undefined"){
					for(var j = 0; j < children.length; j++){
						headers.push(children[i])
					}
				}
			});
	}
	Q.all(promises).then(console.log(promises))

}

	// promises.push(console.log(headers))

function drill_down(parents,children){
	var output = [];
	console.log("counter",counter);
	console.log("parents",parents);
	console.log("children",children);	
	for(var i = 0; i < children.length; i++){
		if(!children[i].hasOwnProperty("children")){
			for(var j = 0; j < parents.length; j++){
				parents[j].col_span++
				parents[j].row += j
			}
			var header = {"label":children[i]["label"], "col_span":1,"row_span":1,"row":j}
			output.push(header)
		}
		else{
			counter++
			parents.push(children[i])
			drill_down(parents, children[i]["children"])
		}
	}
	return output;
}

function build_rows(rows){

}

function build_footnotes(footnotes){

}

