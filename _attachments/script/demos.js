var map, datasets, currentDemo;
var couchUrl = "nycapi.couchone.com";
var currentDataset = "dpr_parks";
var currentFeatures = [];

function getDbs() {
  $.ajax({
    url: "http://" + couchUrl + "/nycapi/_design/civicapi/_view/datasets",
    dataType: 'jsonp',
    success: function(data){
      datasets = data.rows;
      $.each(datasets, function(i, data){
        $('#datasets').append('<option>' + data.key + '</option>');
      });
      $("#datasets").show().uniform();
    }
  })
}

function showCurrentDataset() {
  demos[currentDemo].showDataset(currentDataset);
}

function fetchFeatures(bbox, callback) {
  $.ajax({
    url: "http://nycapi.com/" + currentDataset + "/geojson",
    dataType: 'jsonp',
    data: {
      "bbox": bbox
    },
    success: callback
  });
}

function clearMap() {
  currentFeatures = [];
  $('#map').html('');
  map = null;
}

var demos = {
  googleMapsDemo: {
		clearMap: function() {
			if (currentFeatures) {
				$.each(currentFeatures, function(i, currentFeature) {
				  currentFeature.setMap(null);
				})
				currentFeatures = [];
			}
		},

		showFeatures: function(geojson) {
      if (!geojson) return;  
			demos.googleMapsDemo.clearMap();
			$.each(geojson, function(i, feature){
			  var gFeature = new GeoJSON(feature, null);
  			currentFeatures.push(gFeature);
  			gFeature.setMap(map);  			  
			})
		}, 

		bboxFor: function(map) {
		  return map.getBounds().getSouthWest().lng() + "," +
      		   map.getBounds().getSouthWest().lat() + "," +
      		   map.getBounds().getNorthEast().lng() + "," +
      		   map.getBounds().getNorthEast().lat()
		}, 

		init: function() {
		  clearMap();
    	map = new google.maps.Map(document.getElementById('map'),{
  			zoom: 17,
  			center: new google.maps.LatLng(40.7143528, -74.0059731),
  			mapTypeId: google.maps.MapTypeId.ROADMAP
  		});
  		
  		function fetch() {
  		  fetchFeatures(demos.googleMapsDemo.bboxFor(map), function(data) {
          var features = $.map(data.rows, function(row){
            return $.extend(row.value.geometry, {properties: {id: row.value.id}});
          })
          demos.googleMapsDemo.showFeatures(features);
        });
  		}

  		google.maps.event.addListener(map, "dragend", function(){
        fetch();
      }); 
      
      setTimeout(fetch, 1000);
		}
  },
  polyMapsDemo: {
    // map, po, geoJson, elements, selectedElement, datasets, currentFeatures, 
    showDataset: function(dataset) {
      var bbox = map.extent()[0].lon + "," + map.extent()[0].lat + "," + map.extent()[1].lon + "," + map.extent()[1].lat;
      currentDataset = dataset;
      fetchFeatures(bbox, function(data){
        var features = $.map(data.rows, function(row) {
          return {"geometry": row.value.geometry, "properties": {"couchID": row.id}};
        });
        if (currentFeatures && currentFeatures.length > 0) map.remove(currentFeatures);
        currentFeatures = geoJson.features(features);
        map.add(currentFeatures);
      })
    },
    
    init: function() {
      clearMap();
      demos.polyMapsDemo.po = org.polymaps;
      var po = org.polymaps;
      
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
    		.addEventListener("mouseover", demos.polyMapsDemo.onMouseOver, false);		

    	geoJson.container()
    		.addEventListener("mouseout", demos.polyMapsDemo.onMouseOut, false);

    	geoJson.container()
    		.addEventListener("mousemove", demos.polyMapsDemo.onMouseMove, false);

    	geoJson.container()
    		.addEventListener("click", demos.polyMapsDemo.onMouseClick, false);

      showCurrentDataset();

      map.add(po.compass()
          .pan("none"));
    },
    
    // dataFor: function(element) {
    //   var match;
    //   $.each(elements, function(i,el) {
    //     if (el.element == element) {
    //       match = el;
    //       return;
    //     }
    //   });
    //   return match;
    // },

    // onMouseClick: function(e) {
    //  if (selectedElement) {
    //    selectedElement.setAttribute("class", "hover");
    //  }
    // 
    //  e.target.setAttribute("class", "selected");
    // 
    //  selectedElement = e.target;
    //  fetchMetadata(dataFor(e.target).data.properties.couchID);
    // },
    // 
    // onMouseOver: function(e) {
    //        if (e.target != selectedElement) e.target.setAttribute("class", "hover");
    //        updateHoverWindow();
    // },
    // 
    // onMouseOut: function(e) {
    //   if (e.target != selectedElement) e.target.setAttribute("class", "");  
    //   hideHoverWindow();     
    // },
    // 
    // initializeUI: function() {
    //  initializeInfoWindow();
    //  hideHoverWindow();
    //  $(this).mousemove(onMouseMove);
    // },
    // 
    // formatMetadata: function(data) {
    //   out = '<dl>';
    //   $.each(data, function(key, val) {
    //     if (typeof(val) == 'string' && key[0] != '_') {
    //       out = out + '<dt>' + key + '<dd>' + val;
    //     } else if (typeof(val) == 'object' && key != "geometry" && val != null) {
    //       if (key == 'properties') {
    //         $.each(val, function(attr, value){
    //           out = out + '<dt>' + attr + '<dd>' + value;
    //         })
    //       } else {
    //         out = out + '<dt>' + key + '<dd>' + val.join(', ');
    //       }
    //     }
    //   });
    //   out = out + '</dl>';
    //   return out;
    // },
    // 
    // fetchMetadata: function(docid) {
    //   $.ajax({
    //     url: "http://" + couchUrl + "/" + currentDataset + "/" + docid,
    //     dataType: 'jsonp',
    //     success: function(data){
    //       updateInfoWindow(data);
    //     }
    //   })
    // },
    // 
    // initializeInfoWindow: function() {
    //  $("#infoClose").click(closeInfoWindow);
    // },
    // 
    // updateInfoWindow: function(data) {
    //  $("#info").show("fast");
    //  $("#infoTitle").html('Details');
    //  $("#infoDescription").html(formatMetadata(data));
    // },
    // 
    // closeInfoWindow: function() {
    //  $("#info").hide("fast");
    //  selectedElement.setAttribute("class", "");  
    //  selectedElement = null;
    // },
    // 
    // updateHoverWindow: function() {
    //  $("#hoverLabel").show().html("View more info");
    // },
    // 
    // hideHoverWindow: function() {
    //  $("#hoverLabel").hide();
    // },
    // 
    // onMouseMove: function(e) {
    //  $("#hoverLabel").css('top',  e.pageY + 10);
    //  $("#hoverLabel").css('left', e.pageX + 10);
    // }
    
  },
  openLayersDemo: {
    // TODO
  }
}

$(function(){
  $('.demo').click(function(e) {
    $('.instructions').hide()
    $('#map').show();
    if(!datasets) getDbs();
    currentDemo = e.target.id + 'Demo';
    demos[currentDemo].init(); 
  });
  
  $('#datasets').live('change', function(){
    currentDataset = $(this).val();
    showCurrentDataset();
  })
})
