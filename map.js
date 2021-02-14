let CartoDB_Positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
});
let map = L.map('map', {
    layers: CartoDB_Positron,
    center: [ 31.494261, 34.595947 ],
    zoom: 8,
    zoomSnap: 0.5,
    zoomDelta: 0.5,
    zoomControl: false
    });

let features = []
let setNames = []
var sets = L.esri.featureLayer({
        url: 'https://services5.arcgis.com/dlrDjz89gx9qyfev/ArcGIS/rest/services/תכנית_הרמזור_ליישובים/FeatureServer/0',
        simplifyFactor: 0.5,
        precision: 5,
        style: function (feature) {
            if (feature.properties.government_colour === 'ירוק') {
              return { fillColor: 'rgb(76,230,0)',color:'rgba(153,153,153,0.5)', weight: 1 };
            } else if (feature.properties.government_colour === 'צהוב') {
                return { fillColor: 'rgb(255,255,0)',color:'rgba(153,153,153,0.5)', weight: 1 };
            } else if (feature.properties.government_colour === 'כתום') {
                return { fillColor: 'rgb(255,170,0)',color:'rgba(153,153,153,0.5)', weight: 1 };
             } else if (feature.properties.government_colour === 'אדום') {
                return { fillColor: 'rgb(230,0,0)',color:'rgba(153,153,153,0.5)', weight: 1 };
             } else {
              return { color: 'white', weight: 2 };
            }
          },
        onEachFeature: function(feature, layer) {
            if (feature.properties) {
                var popupcontent = '';
                if(feature.properties.level_code < 3){
                    popupcontent += '<p><h3>'+feature.properties.city_desc+'</h3>'
                    popupcontent += '<strong>צבע היישוב: </strong>'+feature.properties.government_colour +'</br>'
                }else{
                    popupcontent += '<p><h3>'+feature.properties.city_desc+'-'+feature.properties.quarter_desc+'</h3>'
                    popupcontent += '<strong>צבע האזור: </strong>'+feature.properties.government_colour +'</br>'
                }
                
                popupcontent += '<strong>ציון רמזור: </strong>'+feature.properties.final_score  +'</br>'
                popupcontent += '<strong>חולים פעילים: </strong>'+feature.properties.count_active_sick+'</br>'
                popupcontent += '<strong>חולים ל10,000 נפשות: </strong>'+feature.properties.sick_to_pop10000.toFixed(2)+'</br>'
                var base_url = 'https://services5.arcgis.com/dlrDjz89gx9qyfev/ArcGIS/rest/services/התחסנות_קורונה_לפי_יישובים_ליום_האחרון/FeatureServer/0/query?'
                base_url += 'outFields=*&returnGeometry=false&f=json&where=city_code='+feature.properties.city_code
                
                $.getJSON(base_url,function(response){
                    props = response.features[0].attributes
                    popupcontent += '<strong>סה"כ אוכלוסיה ביישוב: </strong>'+props.total_pop.toLocaleString()+'</br>'
                    popupcontent += '<strong>מחוסנים מנה ראשונה: </strong>'+Number(props.vaccinated_first_dose).toLocaleString()+'</br>'
                    popupcontent += '<strong>מחוסנים מנה שנייה: </strong>'+Number(props.vaccinated_second_dose).toLocaleString()+'</br>'
                    popupcontent += '<strong>אחוז מחוסנים: </strong>'+props.vaccinated_secon_culm_ratio+'%</br>'
                    popupcontent += '</p>'
                    layer.bindPopup(popupcontent);
                })

                
                
            
                
            }
        }
      }).addTo(map);

sets.on('load',function(e){
    layers = Object.values(sets._layers)
    
    layers.forEach(function(item){
        feature = item.toGeoJSON()
        features.push(feature)
        setName = feature.properties.city_desc
        if(setNames.indexOf(setName) < 0){
            setNames.push(setName)
        }
    })
    setNames = setNames.sort()

    
    if(!(setSelect._map)){
        setSelect.addTo(map)
    }
    

})


L.Control.SelectSet = L.Control.extend({
        onAdd: function(map) {
            var container = L.DomUtil.create('div','leaflet-bar');
    
            container.style.width = '200px';
            container.style.height = '40px';
            container.style.backgroundColor = '#fff';
    
            var select = L.DomUtil.create('select');
            select.name = 'setNames'
            select.id = 'setNames'
            for(var i=0;i<setNames.length;i++){
                var option = L.DomUtil.create('option');
                option.value = setNames[i]
                option.innerText = setNames[i]
                select.append(option)
            }
            select.onchange = function(e){
                selectedName = document.getElementById('setNames').value
                selectedFeatures = features.filter(feature => feature.properties.city_desc == selectedName)
                selected = L.geoJson(selectedFeatures)
                map.fitBounds(selected.getBounds())
            }
            
            container.append(select)
            return container;
        },
    
        onRemove: function(map) {
            // Nothing to do here
        }
    });
    
L.control.selectSet = function(opts) {
        return new L.Control.SelectSet(opts);
    }
let setSelect = L.control.selectSet({ position: 'topleft' })