# Graphexp: graph explorer with D3.js

Graphexp is a javascript interface to explore and display a graph stored in the Gremlin graphdatabase via the Gremlin server. Graphexp is under the Apache 2.0 licence.

## Configuration

To use graph Explorer, you need a [Gremlin server](http://tinkerpop.apache.org/) running with REST protocol and a *recent* web browser to display the visualization.
On your web browser, just access the file `graphexp.html`.

If the access to the Gremlin server is not `localhost:8182`, the address can be configured in `graphConf.js`.

## Getting started

If you do not have your own Gremlin server, you may use a docker container with a server ready to use.

To display a node, type in a property name and value, then click on the search button.
Leaving a blank field and keyword will display the full graph.
The node and edge properties can be automatically retrieved using the `get graph info` button. Pushing this button will also display some graph properties on the left side of the page.

When a node of the visualization is clicked, it will become 'active' with a circle surround it and its information will be display on the right side of the page. Moreover, this action will trigger the display of its neighbors.
Clicking on an edge will show its properties (without highlighting the edge). 

When appearing for the first time the nodes will be positioned following a force layout. Drag and drop can be used to pin them in a particular position. Once dragged the nodes will stay at their position. Drag and drop is allowed only for the nodes on the active layer (most recent layer) with no connection with nodes in other layers. See "Visualization concepts" section for more information on the layers.

## Visualization concept

The visualization is based on a concept of layers of visualisation. The idea is to progress in the graph as in a jungle. The clicked node will show its neighbors, opening new paths for the exploration. If not clicked, the other displayed nodes will vanish little by little as we progress in the exploration. Coming back in the exploration paths allowed. Before it completely disappears, a node can be clicked and it will become  active again. As in a jungle, you can not see the full jungle and there are so many things that you must focus on your direction and what is in front of you if you do not want to get lost.

During your exploration you can set up milestones by clicking on the small circle on the upper right side of a node. This will pin the node in time, preventing it to disappear.

You may also freeze the exploration, by ticking the appropriate checkbox. The evolution of the exploration will stop, allowing to gather information on the nodes displayed, without displaying their neighbors.

## Node and edge information

The Id and label of each node can be displayed by hovering the cursor over the node. The full information on the properties are displayed on the right of the page when clicking on the node or edges. Once the `get graph info` button has been clicked, a choice of properties to display appear on the left side.

## Node color

If a node property called 'color' exists in the node properties with an hexadecimal color code (string), it will be displayed automatically on the graph. Otherwise, the default node color can be set in the `graphConf.js` file.  The node color can be set interactively after the `get graph info` button has been pressed. A select tab appears on the left side bar allowing to set the color according to one of the property values present in the graph.

## Program description

The program uses:
* the D3.js library to visualize a graph in an interactive manner, [API Reference](https://github.com/d3/d3/blob/master/API.md),
* an ajax request (with Jquery) that query the graph database (Gremlin Tinkerpop via REST).

