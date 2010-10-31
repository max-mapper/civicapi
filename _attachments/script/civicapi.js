var map, po, geoJson, elements, selectedElement, datasets, currentFeatures, couchUrl = "nycapi.couchone.com", currentDataset = "parks";
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
      .zoom(16)
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