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
		send_to_server(gremlin_query, 'editGraph', null, message);
		console.log(gremlin_query)
		console.log("Add Vertex")
		window.alert("Vertex Added Succesfully")
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
		send_to_server(gremlin_query, 'editGraph', null, message);
		console.log("Edit Vertex")
		window.alert("Vertex Edited Succesfully")
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
		send_to_server(gremlin_query, 'editGraph', null, message);console.log(gremlin_query)
		console.log("Add Edge")
		window.alert("Edge Added Succesfully")
		editGraph();
		}
	}
	
	
	
	function send_to_server(gremlin_query,query_type,active_node,message, callback){

	let server_address = $('#server_address').val();
		let server_port = $('#server_port').val();
		let COMMUNICATION_PROTOCOL = $('#server_protocol').val();
			if (COMMUNICATION_PROTOCOL == 'REST'){
				let server_url = "http://"+server_address+":"+server_port;
				run_ajax_request(gremlin_query,server_url,query_type,active_node,message,callback);
			}
			else if (COMMUNICATION_PROTOCOL == 'websocket'){
				let server_url = "ws://"+server_address+":"+server_port+"/gremlin"
				run_websocket_request(gremlin_query,server_url,query_type,active_node,message,callback);
			}
			else {
				console.log('Bad communication protocol. Check configuration file. Accept "REST" or "websocket" .')
			}
				
	}
	
	function run_ajax_request(gremlin_query,server_url,query_type,active_node,message, callback){
		// while busy, show we're doing something in the messageArea.
		$('#messageArea').html('<h3>(loading)</h3>');

		// Get the data from the server
		$.ajax({
			type: "POST",
			accept: "application/json",
			//contentType:"application/json; charset=utf-8",
			url: server_url,
			//headers: GRAPH_DATABASE_AUTH,
			timeout: REST_TIMEOUT,
			data: JSON.stringify({"gremlin" : gremlin_query}),
			success: function(data, textStatus, jqXHR){
							var Data = data.result.data;
			},
			error: function(result, status, error){
				console.log("Connection failed. "+status);
				$('#outputArea').html("<p> Can't access database using REST at "+server_url+"</p>"+
					"<p> Message: "+status+ ", "+error+" </p>"+
					"<p> Check the server configuration "+
					"or try increasing the REST_TIMEOUT value in the config file.</p>");
				$('#messageArea').html('');
			}
		});
	}
	
	
	function run_websocket_request(gremlin_query,server_url,query_type,active_node,message,callback){
		$('#messageArea').html('<h3>(loading)</h3>');

		var msg = { "requestId": uuidv4(),
			"op":"eval",
			"processor":"",
			"args":{"gremlin": gremlin_query,
				"bindings":{},
				"language":"gremlin-groovy"}}

		var data = JSON.stringify(msg);

		var ws = new WebSocket(server_url);
		ws.onopen = function (event){
			ws.send(data,{ mask: true});	
		};
		ws.onerror = function (err){
			console.log('Connection error using websocket');
			console.log(err);
			$('#outputArea').html("<p> Connection error using websocket</p>"
				+"<p> Cannot connect to "+server_url+ " </p>");
			$('#messageArea').html('');

		};
		ws.onmessage = function (event){
			var response = JSON.parse(event.data);
			var data = response.result.data;
			if (data == null){
				$('#outputArea').html(response.status.message);
				$('#messageArea').html('Server error. No data.');
				return 1;}
			//console.log(data)
			if(callback){
				callback(data);
			} else {
				handle_server_answer(data,query_type,active_node,message);
			}
		};		
	}