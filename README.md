# Graphexp: graph explorer with D3.js

Graphexp is a web interface to explore and display a graph stored in the Gremlin graph database via the Gremlin server. Graphexp is under the Apache 2.0 licence.

![graphexp](https://github.com/bricaud/graphexp/blob/master/images/graphexp2.png "Graph exploration")



## Configuration

To use Graph Explorer, you need a [Gremlin server](http://tinkerpop.apache.org/) running with REST protocol and a *recent* web browser to display the visualization.
On your web browser, just access the file `graphexp.html`.

If the access to the Gremlin server is not `localhost:8182`, the address can be configured in `graphConf.js`.

![graphexpzoom](https://github.com/bricaud/graphexp/blob/master/images/graphexpzoom.png "Exploration of the Tinkerpop modern graph")


## Getting started

### Intalling a Gremlin server

If have not yet installed a gremlin server, download the last release of the [Gremlin server](http://tinkerpop.apache.org/) and follow the [documentation](http://tinkerpop.apache.org/docs/current/reference/#gremlin-server). In the server folder just run
```
bin/gremlin-server.sh conf/gremlin-server-rest-modern.yaml
```
or on windows
```
bin/gremlin-server.bat conf/gremlin-server-rest-modern.yaml
```
This default server comes with a small graph database of 6 nodes.
The server shoud start on port `8182`.


Alternatively, if you have Docker installed on your machine, you may run a Docker container with an already configured Gremlin server. You can find one on [this page](https://hub.docker.com/r/bricaud/gremlin-server-rest/). This server have a graph database containing a demo graph: the tree of life, with 35960 nodes and 35959 edges. You can download it and run it using
```
docker pull bricaud/gremlin-server-rest
docker run -p 8182:8182 -it --name gremlin-server-rest bricaud/gremlin-server-rest
```

### Graphexp guidelines
To display a node, type in a property name and value, then click on the search button.
Leaving a blank field and keyword will display the full graph (do not display the full graph if the graph is large!).
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

## Tutorial with the tree of life
Once your gremlin server is up and running (from the [Docker repository](https://hub.docker.com/r/bricaud/gremlin-server-REST/)), click on the `get graph info` button. Information should appear on the left side of the page, like on the following image.
![graphexptol1](https://github.com/bricaud/graphexp/blob/master/images/graphexptol1.png "Graph exploration Tree of life")

This graph has a single type of nodes (label 'vertex') and a single type of edges (label 'edge'). Each node is a species (taxon) of the earth, and directed edges represent the link ancestor-descendant.
The different node properties are displayed on the left. 
* `CHILDCOUNT` the number of descendent nodes
* `name` the name of the species
* `HASPAGE` whether there is an page of information on the [Tree Of Life Project website](http://tolweb.org/tree/home.pages/downloadtree.html)
* `ID` Tree of Life Project unique id
* `CONFIDENCE` confidence in classification, from confident (0) to less confident (1) and (2)
* `EXTINCT` wether the node is extinct (2) or not (0)
* `LEAF` the node is a leaf of the tree (1) or the node does not represent a leaf (it has or will have descendent nodes on the Tree of Life) (0)
* `PHYLESIS` (0) monophylectic, (1) uncertain, (2) not monophylectic

On the top navigation bar, choose the field `name`, enter 'Dinosauria' as name in the input and click on the `Search` button. A single node, corresponding to the Dinosaurs group, should appear in the middle of the page. Click on the node to display node details on the right and its ancestors and descendants on the graph. 
Check the box `name` on the left bar to display the node names.
You should see appearing the two orders of dinosaurs `Sauriscia` and `Ornithischia`, as in the [Wikipedia dinosaur page](https://en.wikipedia.org/wiki/Dinosaur_classification) and an additional `none` node which is the ancestor. This latter node is a taxon that have ancestors and descendants but do not have a name. Note that there are different version of the tree of life and it is always evolving as researchers find new species.
![graphexptol2](https://github.com/bricaud/graphexp/blob/master/images/graphexptol2.png "Graph exploration Tree of life")
You may now enjoy the exploration of the dinosaur order by clicking on nodes and following ascendant and descendant lines. The oldest nodes will vanish as you explore the data and if you want more nodes to be displayed, just increase the number of layers on the top navigation bar.

You may also color the nodes according to the values of some of their properties by clicking on the color tab on the left side. The color scale is computed using the range of values of the nodes already displayed and a palette of 20 colors. You should refresh the color after a few steps of exploration.

![graphexptol3](https://github.com/bricaud/graphexp/blob/master/images/graphexptol3.png "Graph exploration Tree of life")

If you want to explore the world of insects, you may start with the taxon 'Insecta' and follow the links.


