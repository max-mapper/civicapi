var map, po, geoJson, elements, selectedElement, datasets, currentFeatures, couchUrl = "nycapi.couchone.com", 
currentDataset = "dpr_parks";

// function getTransform(O){
//  gT="translate(0,0)"
//  if (O.getAttribute("transform")) {
//    gT=O.getAttribute("transform");
//  }
//  GT=gT.split(/[,\(\)]/)
//  return GT
// }

function pointGrab(n) {
  // console.log(n)
  window.removeEventListener("mousemove", arguments.callee, false);
  window.removeEventListener("mouseup", arguments.callee, false);
  geoJson.container().addEventListener("mousemove", pointDrag, false);
}

function pointDrag(evt) {
  console.log(evt)
  evt.preventDefault();
  geoJson.container().addEventListener("mouseup", stopPointDrag, false);
}

function stopPointDrag() {
  
}
//  var TP = document.getElementById("pt" + ptn);
//  var X = evt.clientX;
//  var Y = evt.clientY;
//  var pathstring="M ";
//  var GT = getTransform(Chosen);
//  var pX = parseInt(GT[1]);
//  var pY = parseInt(GT[2]);
//  X = evt.clientX -pX;
//  Y = evt.clientY - pY;
//  if (grid) {
//    X = Math.floor(X / gridsize) * gridsize + gridsize / 2;
//    Y = Math.floor(Y / gridsize) * gridsize + gridsize / 2;
//  }
//  UP = findPoints()
//  UP[ptn * 2] = X
//  UP[ptn * 2 + 1] = Y
//  for (i in UP) {
//    pathstring += UP[i] + " ";
//  }
//  pathstring += "z"
//  Chosen.setAttribute("d",pathstring);
//  TP.setAttribute("cx", X);
//  TP.setAttribute("cy", Y);
//  place.setAttribute("onmouseup", "stopPointDrag(evt," + ptn + ")");
// }

// function stopPointDrag(evt,ptn){
//  TP=document.getElementById("pt"+ptn);
//  TP.setAttribute("fill", "green");
//  pathstring="M "
//  place.setAttribute("onmousedown", "begin(evt)")
//  place.setAttribute("onmousemove", null);
//  place.setAttribute("onmouseup", null);
// }

function findPoints(chosen){
  var container = $(chosen).parent()[0];
	var pathData = chosen.getAttribute("d");
  pathData = pathData.slice(1);
  pathData = pathData.substr(0, pathData.length - 1);
	var points = pathData.split("L");
  for (var i in points) {
    var xy = points[i].split(',');
    var vertex = document.createElementNS(po.ns.svg,"ellipse");
    vertex.setAttribute("stroke-width", 1);
    vertex.setAttribute("stroke", "black");
    vertex.setAttribute("fill", "green");
    vertex.setAttribute("cx", xy[0])
    vertex.setAttribute("cy", xy[1]);
    vertex.setAttribute("rx", 4);
    vertex.setAttribute("ry", 4);
    vertex.setAttribute("onmousedown", "pointGrab('" + i + "')");
    container.appendChild(vertex);    
  }
}

function getDbs() {
  $.ajax({
    url: "http://" + couchUrl + "/nycapi/_design/civicapi/_view/datasets",
    dataType: 'jsonp',
    success: function(data){
      $.each(data.rows, function(i, data){
        $('#datasets').append('<option>' + data.key + '</option>');
      });
      $("#datasets").show().uniform();
    }
  })
  
  $('#datasets').live('change', function(){
    showDataset($(this).val());
  })
}

function showDataset(dataset) {
  currentDataset = dataset;
  $.ajax({
    url: "http://" + couchUrl + "/" + currentDataset + "/_design/geojson/_spatial/points",
    dataType: 'jsonp',
    data: {
      "bbox": map.extent()[0].lon + "," + map.extent()[0].lat + "," + map.extent()[1].lon + "," + map.extent()[1].lat
    },
    success: function(data){
      var features = $.map(data.rows, function(row) {
        return {"geometry": row.value.geometry, "properties": {"couchID": row.id}};
      });
      if (currentFeatures) map.remove(currentFeatures);
      currentFeatures = geoJson.features(features);
      map.add(currentFeatures);
    }
  });
}

$(function(){
  getDbs();
  po = org.polymaps;
    
  map = po.map()
      .container(document.getElementById("map").appendChild(po.svg("svg")))
      .center({lat: 40.7143528, lon: -74.0059731})
      .zoom(17)
      .zoomRange([0, 20])
      .add(po.interact());

  map.add(po.image()
      .url(po.url("http://{S}tile.cloudmade.com"
      + "/675b7177e2e14f2c85edf6455ad5cea4" // http://cloudmade.com/register
      + "/24968/256/{Z}/{X}/{Y}.png")
      .hosts(["a.", "b.", "c.", ""])));
  
  geoJson = po.geoJson();
  geoJson.on("load", function(e){ elements = e.features });
  
	geoJson.container()
		.addEventListener("mouseover", onMouseOver, false);		

	geoJson.container()
		.addEventListener("mouseout", onMouseOut, false);

	geoJson.container()
		.addEventListener("mousemove", onMouseMove, false);

	geoJson.container()
		.addEventListener("click", onMouseClick, false);
         
  showDataset(currentDataset);
          
  map.add(po.compass()
      .pan("none"));

  function dataFor(element) {
    var match;
    $.each(elements, function(i,el) {
      if (el.element == element) {
        match = el;
        return;
      }
    });
    return match;
  }

  function onMouseClick(e) {
    console.log(findPoints(e.target))
  	if (selectedElement) {
  		selectedElement.setAttribute("class", "hover");
  	}

  	e.target.setAttribute("class", "selected");

  	selectedElement = e.target;
  	fetchMetadata(dataFor(e.target).data.properties.couchID);
  }

  function onMouseOver(e) {
	  if (e.target != selectedElement) e.target.setAttribute("class", "hover");
	  updateHoverWindow();
  }
  
  function onMouseOut(e) {
    if (e.target != selectedElement) e.target.setAttribute("class", "");  
    hideHoverWindow();     
  }

  function initializeUI() {
  	initializeInfoWindow();
  	hideHoverWindow();
  	$(this).mousemove(onMouseMove);
  }
  
  function formatMetadata(data) {
    out = '<dl>';
    $.each(data, function(key, val) {
      if (typeof(val) == 'string' && key[0] != '_') {
        out = out + '<dt>' + key + '<dd>' + val;
      } else if (typeof(val) == 'object' && key != "geometry" && val != null) {
        if (key == 'properties') {
          $.each(val, function(attr, value){
            out = out + '<dt>' + attr + '<dd>' + value;
          })
        } else {
          out = out + '<dt>' + key + '<dd>' + val.join(', ');
        }
      }
    });
    out = out + '</dl>';
    return out;
  }
  
  function fetchMetadata(docid) {
    $.ajax({
      url: "http://" + couchUrl + "/" + currentDataset + "/" + docid,
      dataType: 'jsonp',
      success: function(data){
        updateInfoWindow(data);
      }
    })
  }
  
  function initializeInfoWindow() {
  	$("#infoClose").click(closeInfoWindow);
  }

  function updateInfoWindow(data) {
  	$("#info").show("fast");
  	$("#infoTitle").html('Details');
  	$("#infoDescription").html(formatMetadata(data));
  }

  function closeInfoWindow() {
  	$("#info").hide("fast");
  	selectedElement.setAttribute("class", "");  
  	selectedElement = null;
  }

  function updateHoverWindow() {
  	$("#hoverLabel").show().html("View more info");
  }

  function hideHoverWindow() {
  	$("#hoverLabel").hide();
  }

  function onMouseMove(e) {
  	$("#hoverLabel").css('top',  e.pageY + 10);
  	$("#hoverLabel").css('left', e.pageX + 10);
  }

  initializeUI();
})