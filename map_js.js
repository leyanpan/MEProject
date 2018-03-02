
// <editor-fold> Definition of constants
const MEproject_styles = [
  {
    stylers: [
      {
        color: "#ffffff"
      }
    ]
  }
]
const cluster_coordinates = [
  {name: 'Sydney', coordinates: {lat: -33.9, lng: 151.2}},
  {name: 'Melbourne', coordinates: {lat: -37.8, lng: 145}},
  {name: 'Perth', coordinates: {lat: -31.95, lng: 115.9}},
  {name: 'Darwin', coordinates: {lat: -12.5, lng: 131.0}},
  {name: 'Adelaide', coordinates: {lat: -34.9, lng: 138.6}},
  {name: 'Brisbane', coordinates: {lat: -27.5, lng: 153.0}},
  {name: 'Townsville', coordinates: {lat: -19.25, lng:146.8}},
  {name: 'North Island', coordinates: {lat: -39.6, lng: 176.0}},
  {name: 'South Island', coordinates: {lat: -43.8, lng: 171.0}}
]

const zoom_limit = 5;
const display_enum = {
    smiley_faces : 0,
    real_image : 1
  };

const lng_min = 112.6, lng_max = 179, lat_min = -47.1, lat_max = -9.6;
const inner_template = "<div style=\"background: #FAFAFA; height: auto; width: auto; border-radius: 5px;\">\n  <div style=\"height: auto; width: 360px; padding: 25px\">\n    <div style=\"height: 80px;\">\n      <div style=\"float: left;\n      background-image: url(__IMAGE__);\n      border-radius: 50%;\n      height: 100%;\n      width: 80px;\n      background-size:cover\"></div>\n      <div style=\"height: 100%; float:left;\">\n          <div style=\"height: 10px\"></div>\n          <div style=\"font-weight: 700; color: #676CB2; font-size: 16px; margin-top: 10px; font-family: 'Open Sans', sans-serif; margin-left: 5px; text-transform: uppercase\">__NAME__</div>\n          <div style=\"font-weight: 400; color: #5F5B5B; font-size: 14px; font-family: 'Roboto',sans-serif; margin-top: 5px; margin-left: 5px\">__TITLE__</div>\n      </div>\n    </div>\n    <div align=\"center\">\n      <img src=\"quotation-mark.png\" style=\"height: 40px;padding-top: 10px;padding-bottom: 10px\">\n    </div>\n    <div style=\"font-weight: 400; color: #5F5B5B; font-size: 14px; font-family: 'Roboto'; height:auto;\">\n      __COMMENT__\n  </div>\n</div>\n"
//</editor-fold>end of const definition

var customer_pins_list, smiley_faces_list, map;
//<editor-fold> start of definition of "Smile" class
function Smile(name, coordinates)
{
  this._name = name;
  this._coordinates = coordinates;
  this._count = 0;
  var image = {
    url: 'smiley_face.png',
    scaledSize: new google.maps.Size(40, 40),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(20, 20)
  };
  this._pin = new google.maps.Marker({
    position: coordinates,
    title: name,
    icon: image
  });
}

Smile.prototype.distance_squared = function(customer)
{
  return Math.pow(customer.location.lat - this._coordinates.lat, 2) + Math.pow(customer.location.lng - this._coordinates.lng, 2);
}

Smile.prototype.add_customer = function()
{
  //should include more information than this, but it is not necessary now
  this._count++;
}

Smile.prototype.display = function()
{
  if(!this._info) {
    this._info = new google.maps.InfoWindow({
      content: this._name + ": " + this._count + " great customer reviews!"
    });
    this._pin._info = this._info;
    this._pin.addListener('click', function(){
      this._info.open(map, this);
    });
  }
  if(this._count > 0)
  {
    this._pin.setMap(map);
  }
}

Smile.prototype.hide = function()
{
  this._pin.setMap(null);
}
//</editor-fold>end of definition of "Smile" class

function add_to_cluster(customer)
{
  var min_value = Infinity, min_index = -1;
  $.each(smiley_faces_list, function(index, smiley_pin){
    if(min_value > smiley_pin.distance_squared(customer))
    {
      min_index = index;
      min_value = smiley_pin.distance_squared(customer);
    }
  });
  smiley_faces_list[min_index].add_customer();
}

function getInnerHTML(name, title, comment, image)
{
  return inner_template.replace('__NAME__', name).replace('__TITLE__', title).replace('__COMMENT__', comment).replace('__IMAGE__', image);
}
var current_open_info_window;
//definition of map initilization
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -26, lng: 134.7},
    zoom:5,
    styles: MEproject_styles
    });
  //<editor-fold> draw the icon on the map
  var icon_bounds = {
    west: 108.631,
    east: 168.922,
    north: 6.16,
    south: -63.458
  };
  var icon_src = 'map-me.png';
  icon_overlay = new google.maps.GroundOverlay(icon_src, icon_bounds);
  icon_overlay.setMap(map);
  //</editor-fold>

  //Now we start adding pins. Requires jQuery
  smiley_faces_list = new Array();
  $.each(cluster_coordinates, function(index, cluster){
    smiley_faces_list.push(new Smile(cluster.name, cluster.coordinates));
  });

  var customers;

  $.get('comments.json', function(result){
    //<editor-fold> adding pins
    customers = result;
    customer_pins_list = new Array();
    var styleHTML = document.getElementsByTagName('style')[0].innerHTML;
    $.each(customers, function(index, customer){
      var marker = new google.maps.Marker(
        {
          position: customer.location,
          title: customer.name,
          icon: {
            url: customer.picture,
            scaledSize: new google.maps.Size(60, 60),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(20, 20)
          }
        }
      );
      styleHTML = styleHTML + "img[src=\"" + customer.picture + "\"]{\n    border-radius: 50%;\n}\n";
      var infoWindow = new google.maps.InfoWindow({
        content: getInnerHTML(customer.name, customer.title, customer.comment, customer.picture)
      });
	marker.addListener('click', function(){
	  if(current_open_info_window)
	      current_open_info_window.close();
          infoWindow.open(map, marker);
	  current_open_info_window = infoWindow
        jQuery('.gm-style-iw').prev('div').remove();
      });
      customer_pins_list.push(marker);
      add_to_cluster(customer);
    });

    document.getElementsByTagName('style')[0].innerHTML = styleHTML;
    var previous_display = display_enum.smiley_faces;
    $.each(smiley_faces_list, function(index, spin){
      spin.display();
      jQuery('.gm-style-iw').prev('div').remove();
    });
    //Now adds the event listeners for the zoom in and zoom out event to transform between smiley faces and real images
    //</editor-fold>
    //Meets condition of changing the mode of display
    map.addListener('zoom_changed', function(){
      var zoom = map.getZoom();
      if(zoom < 4)
      {
        map.setZoom(4);
      }
      if((zoom < zoom_limit && previous_display == display_enum.real_image))
      {
          $.each(customer_pins_list, function(index, cpin){
            cpin.setMap(null);
          });
          $.each(smiley_faces_list, function(index, spin){
            spin.display();
          });
          previous_display = display_enum.smiley_faces;
      }
      if(zoom > zoom_limit && previous_display == display_enum.smiley_faces)
      {
          $.each(customer_pins_list, function(index, cpin){
            cpin.setMap(map);
          });
          $.each(smiley_faces_list, function(index, spin){
            spin.hide();
          });
          previous_display = display_enum.real_image;
      }
    });
    //Limits the area of center position
    map.addListener('center_changed', function(){
      var center = map.getCenter();
      var tmp;
      var new_center = {lat: ((tmp = ((center.lat() < lat_min) ? lat_min : center.lat())) > lat_max) ? lat_max : tmp, lng: ((tmp = ((center.lng() < lng_min) ? lng_min : center.lng())) > lng_max) ? lng_max : tmp};
      if(new_center.lat != center.lat() || new_center.lng != center.lng())
      {
        map.setCenter(new_center);
      }
    });
  });

}
