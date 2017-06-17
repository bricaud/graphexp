
var graphShapes = (function(){
	"use strict";

	var default_node_size = 15;
	var default_stroke_width = 2;
	var default_node_color = "#80E810"

	function node_size(d){
		if ('size' in d) {return d.size;}
		else {return default_node_size;}
	}

	function node_stroke_width(d){
		if ('stroke_width' in d) {return d.stroke_width;}
		else {return default_stroke_width;}
	}

	function node_color(d){
		if ('color' in d) {return d.color;}
		else {return default_node_color;}
	}

	function node_title(d){
		if ('node_title' in d){return d.node_title}
		else {return d.label}
	}

	function node_text(d){
		if ('node_text' in d){return d.node_text}
		else {return d.id}
	}

	function node_subtext(d){
		if ('node_subtext' in d){return d.node_subtext}
		else {return d.label}
	}

	/////////////////////////////////////////////////////////////
	// decorate the node
	function decorate_node(node,with_active_node){
	// the node layout is defined here
	// function for drawing the node size according to the node degree

		var color_scale = d3.scaleOrdinal(d3.schemeCategory10);
		var color_list = {"Artist": "#E81042", "Concert": "#80e810", "Band": "#10DDE8"};
		var color_list = {"Artist": "blue", "Concert": "green", "Band": "orange"};
		var color_list = {"Artist": color_scale(1), "Band": color_scale(2), "Concert": color_scale(3)};
		//var color_list = {"Artist": color_scale(7), "Band": color_scale(8), "Concert": color_scale(9)};
		//color assignment
		//var get_color = {"gpe": "#E81042", "person": "#80e810", "org": "#10DDE8"};



		node.moveToFront();

		var node_base_circle = node.append("circle").classed("base_circle",true)
			//.attr("r", 12)
			.attr("r",node_size)
			//.attr("fill", function(d) { return color(d.group); })
			.style("stroke-width",node_stroke_width)
			.style("stroke","black")
			.attr("fill", node_color);

		//node_base_circle.transition();

		node_base_circle.append("title").text(node_title);


		var text_name = node.append("text").classed("text_details",true)
		  //.attr("x", 12)
		  .attr("x",function(d){return node_size(d)+2;})
		  //.attr("y", ".31em")
		  .text(node_text)
		  .style("visibility", "hidden");

		var text_date = node.append("text").classed("text_details",true)
		  //.attr("x", 12)
		  //.attr("y", 15)
		  .attr("x",function(d){return node_size(d)+2;})
		  .attr("y",node_size)
		  .text(node_subtext)
		  .style("visibility", "hidden");

		//  var node_pin = node.append("circle").classed("Pin",true)
		//      .attr("r", node_size)
		//      .attr("transform", function(d) { return "translate("+node_size(d)/2+","+(-node_size(d)/2)+")"; })
		//      .attr("fill", function(d) { return color(d.labelV); })
		//      .moveToBack()

		var node_pin = node.append("circle").classed("Pin",true)
			.attr("r", function(d){return node_size(d)/2;})
			.attr("transform", function(d) { return "translate("+(node_size(d)*3/4)+","+(-node_size(d)*3/4)+")"; })
			.attr("fill", node_color)
			.moveToBack()
			.style("visibility", "hidden");

		// spot the active node and draw a circle around it
		if(with_active_node){
		  d3.selectAll(".node").each(function(d){
			if(d.id==with_active_node){
			  var n_radius = Number(d3.select(this).select(".base_circle").attr("r"))+6;
			  console.log(d3.select(this).select("circle").attr("r"))
			  console.log(n_radius)
			  d3.select(this)
				.append("circle").classed("Active",true)
				.attr("r", n_radius)
				.attr("fill", node_color)
				.attr("opacity",0.3)
				.moveToBack();
				//.attr("transform", function(d) { return "translate(-12,-12)"; })
				//.attr("fill", function(d) { return color(d.labelV); });
				//.append("circle").classed("Active",true)
				//.attr("r", 4)
				//.attr("transform", function(d) { return "translate(-12,-12)"; })
				//.attr("fill", function(d) { return color(d.labelV); });
			}
		  });
		}
	}

	///////////////////////////////////////
	// https://github.com/wbkd/d3-extended
	d3.selection.prototype.moveToFront = function() {
	// move the selection to the front  
	return this.each(function(){
	  this.parentNode.appendChild(this);
	});
	};
	////////////////////////////////////
	d3.selection.prototype.moveToBack = function() {
	// move the selection to the back  
	return this.each(function() { 
	  var firstChild = this.parentNode.firstChild; 
	  if (firstChild) { 
		this.parentNode.insertBefore(this, firstChild); 
	  } 
	});
	};


	//////////////////////////////////////////////
	function show_names(){
  		var text_to_show = d3.selectAll(".text_details");
  		var input = document.getElementById ("showName");
  		var isChecked = input.checked;
  		if (isChecked) text_to_show.style("visibility", "visible");
  		else {text_to_show.style("visibility", "hidden");}
	}	
	return {
		show_names:show_names,
		decorate_node:decorate_node,
		node_color:node_color
	};

})();
