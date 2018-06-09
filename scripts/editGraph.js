	function editGraph() {
		var x = document.getElementById("editGraph")
		if(x.style.display == "none"){
			x.style.display = "block";
		}
		else{
			x.style.display ="none" ;
		}
		document.getElementById("addVertexForm").style.display='none';
		document.getElementById("editVertexForm").style.display='none';
		document.getElementById("addEditEdgeForm").style.display='none';

	}
	
	function addVertexForm() {
		document.getElementById("addVertexForm").style.display='block';
		document.getElementById("editVertexForm").style.display='none';
		document.getElementById("addEditEdgeForm").style.display='none';
	}
		
	function editVertexForm() {
		document.getElementById("addVertexForm").style.display='none';
		document.getElementById("editVertexForm").style.display='block';
		document.getElementById("addEditEdgeForm").style.display='none';
	}

	
	function addEditEdgeForm() {
		document.getElementById("addVertexForm").style.display='none';
		document.getElementById("editVertexForm").style.display='none';
		document.getElementById("addEditEdgeForm").style.display='block';

	}
		
	function addVertex()  {
		
		let vertexLabel = $('#vertexLabel').val();
		let vertexPropertyName = $('#vertexPropertyName').val();
		//vertexPropertyName = vertexPropertyName.replace(/\s/g,'');
		let vertexPropertyValue = $('#vertexPropertyValue').val();
		//vertexPropertyValue = vertexPropertyValue.replace(/\s/g,'');
		propertyName = vertexPropertyName.split(",");
		propertyValue = vertexPropertyValue.split(",");
		var valueLen = propertyValue.length;
		var nameLen = propertyName.length;
		if(nameLen != valueLen){
			alert("Please enter same number of property name and property value")
		}
		else{
			document.getElementById('vertexLabel').value='';
			document.getElementById('vertexPropertyName').value='';
			document.getElementById('vertexPropertyValue').value='';
			var gremlin_query = "g.addV('"+vertexLabel+"')"
			for(count =0; count<nameLen; count++){
				gremlin_query=gremlin_query+".property('"+propertyName[count]+"' , '" + propertyValue[count]+ "')"
			}
		var message=""
		graphioGremlin.send_to_server(gremlin_query, 'editGraph', null, message);
		console.log(gremlin_query)
		console.log("Add Vertex")
		//window.alert("Vertex Added Succesfully")
		editGraph();
		}
	}
	
	function editVertex()  {
		
		let vertexId = $('#vertexId').val();
		let vertexPropertyName_1 = $('#vertexPropertyName_1').val();
	//	vertexPropertyName_1 = vertexPropertyName_1.replace(/\s/g,'');
		let vertexPropertyValue_1 = $('#vertexPropertyValue_1').val();
	//	vertexPropertyValue_1 = vertexPropertyValue_1.replace(/\s/g,'');
		propertyName = vertexPropertyName_1.split(",");
		propertyValue = vertexPropertyValue_1.split(",");
		var valueLen = propertyValue.length;
		var nameLen = propertyName.length;
		if(nameLen != valueLen){
			alert("Please enter same number of property name and property value")
		}
		else{
			document.getElementById('vertexId').value='';
			document.getElementById('vertexPropertyName_1').value='';
			document.getElementById('vertexPropertyValue_1').value='';
			var gremlin_query = "g.V('"+vertexId+"')"
			for(count =0; count<nameLen; count++){
				gremlin_query=gremlin_query+".property('"+propertyName[count]+"' , '" + propertyValue[count]+ "')"
		}
		console.log(gremlin_query)
		var message=""
		graphioGremlin.send_to_server(gremlin_query, 'editGraph', null, message);
		console.log("Edit Vertex")
		//window.alert("Vertex Edited Succesfully")
		editGraph();
		}
	}
	
	function addEditEdge()  {
		
		let edgeLabel = $('#edgeLabel').val();
		let sourceVertexId = $('#sourceVertexId').val();
		let targetVertexId = $('#targetVertexId').val();		
		let edgePropertyName = $('#edgePropertyName').val();
		//edgePropertyName = edgePropertyName.replace(/\s/g,'');
		let edgePropertyValue = $('#edgePropertyValue').val();
		//edgePropertyValue = edgePropertyValue.replace(/\s/g,'');
		propertyName = edgePropertyName.split(",");
		propertyValue = edgePropertyValue.split(",");
		var valueLen = propertyValue.length;
		var nameLen = propertyName.length;
		if(nameLen != valueLen){
			alert("Please enter same number of property name and property value")
		}
		else{
			document.getElementById('edgeLabel').value='';
			document.getElementById('edgePropertyName').value='';
			document.getElementById('edgePropertyValue').value='';
			var gremlin_query = "g.V('"+sourceVertexId+"').addE('"+edgeLabel+"').to(V('" +targetVertexId+"'))"
			for(count =0; count<nameLen; count++){
				gremlin_query=gremlin_query+".property('"+propertyName[count]+"' , '" + propertyValue[count]+ "')"
			}
		gremlin_query=gremlin_query+".iterate()";
		var message="";
		graphioGremlin.send_to_server(gremlin_query, 'editGraph', null, message);console.log(gremlin_query)
		console.log("Add Edge")
		//window.alert("Edge Added Succesfully")
		editGraph();
		}
	}
	
	