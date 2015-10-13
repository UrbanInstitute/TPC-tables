#Bugs

**JSON creation. Not a large enough sample to safely generalize errors, but I've seen the following problems**

###Nesting columns not being parsed
<table>
<tr><th colspan =2>Foo</th></tr>
<tr><th>*Bar1*</th><th>*Bar2*</th>
<tr><td>data1</td><td>*data2*</td></tr>
</table>
In this example, Bar1 (header), Bar2 (header) and data2 (column) are completely absent from the JSON. Foo (header) and data1 (data) are in the JSON.

###Non-consistent nesting in JSONS.
For example, from [this feed](http://tpctables-stg.urban.org/node/33148/table_feed), \_Single\_2 but not \_Single\_1 contains this incorrect JSON (with a header cell nested under itself). As shown in the [table view here](http://tpctables-stg.urban.org/427-distribution-table-demo/adjusted), the nested column should be "Number (thousands)"

```
 {
 header_title: "Tax Units",
	 header_cell:{
		 data: "Tax Units"
 ...
 	},
	nested: {
		1: {
			header_title: "Tax Units",
			header_cell: {
			data: "Tax Units"
	 ...
		}
 }
 }
```

###Blank rows not handled:
<table>
<tr><th colspan =3>Foo</th></tr>
<tr><td>label1</td><td>data2</td><td>data3</td></tr>
<tr><td>label2</td><td colspan = 2></td></tr>
<tr><td>label3</td><td>data4</td><td>data5</td></tr>
</table>

In this example, the empty row adjacent to label2 is not represented in the JSON. To be consistent with the rest of the structure, I believe there should be a blank cell in the data2 column and the label2 row with, in this case, a colspan of 2. That sound right?

#Questions/ feature requests

- For now, **we don't have an API** for the JSONs. If I'm remembering right we'd talked about **not** having a full RESTful API (which we certainly don't need, for the JSON -> HTMl process!), but the following 2 features would be great:


###Enabling CORS on the current JSON feeds
(e.g. http://tpctables-stg.urban.org/node/1701/table_feed). Currently [table.js](app/js/table.js) and [simple.js](app/js/table.js) rely on JSON data files and manually choosing table id's etc. For testing purposes, I was thinking of parsing a querystring like:
```
/simple.html?node=1701&table=1787
```
 Which would make testing easier. This would require CORS enabled on tpctables-stg, I believe. Happy to help with any solution (or keep current JSON file solution if that works for you).

###JSON endpoints
Down to road, it'd be useful to have JSON endpoints for book, sheet, and table, in order to create tabbed book layouts similar to what are currently in the backend of the Drupal tool. Is that straightforward to implement? Current JSON endpoint is just for sheet, so we can easily get table. The only thing really missing is a book **endpoint**.

#Assumptions about JSON structure

**I make the following assumptions about JSON structure in the JS, if any of the assumptions are wrong I'm happy to add extra logical checks to handle edge cases etc.**

- 1st column, which includes row labels, is a non-nested column
- all `header_cell` objects always contain the keys: `data, class, colspan, data-row,data-col,data-notesymbol,rowspan`
- all objects in `data_cells` and `label_cells` contain the keys: `data, class, colspan, data-row,data-col,data-notesymbol,rowspan`
- `colspan` and `rowspan` either == `"1"` or == `null` for vals with no special col/rowspan
- objects in `table_data` objects EITHER have `nested` property OR `data_cells` property


#Parent page requirments

- The parent page will need to include the [pym.js](https://github.com/nprapps/pym.js) library, in order to create responsive iframes. If the library is included somwhere on the page, then table embed code will look like:

```html
<div id="table"></div>
<script>
    var pymParent = new pym.Parent('table', 'http://url.for.tables/index.html?tableID=foo', {});
</script>
```
 (So CMS's etc can't strip js)

-  **IF** links inside the iframe need to open outside of the iframe (e.g. if I create "book" level iframe embeds), then the following attribute would be required on the parent page:
```html
<base target="_blank" />
```

 Which  would possibly be an issue if the parent had set another, different `base` attribute.