// Crear mapa base
var map = L.map('map').setView([-22.4686, -69.0143], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Cargar polígono/shape del sitio (GeoJSON)
fetch('RSS_aoi.geojson')
  .then(response => response.json())
  .then(geojson => {
    var layer = L.geoJSON(geojson, {
      style: {
        color: 'orange',
        weight: 2,
        fillOpacity: 0.1
      }
    }).addTo(map);
    map.fitBounds(layer.getBounds());
  });

// Función para parsear fecha tipo "Apr 29, 2017"
function parseFecha(str) {
  // Quitamos comillas por si vienen "Apr 29, 2017"
  str = str.replace(/"/g, '').trim();
  return new Date(str);
}

// Función para parsear CSV simple (system:time_start, NDVI)
function cargarCSV(url, callback) {
  fetch(url)
    .then(response => {
      if (!response.ok) {
        console.error('Error al cargar CSV:', response.status, response.statusText);
      }
      return response.text();
    })
    .then(text => {
      var lines = text.trim().split('\n');
      var header = lines[0].split(',');
      var timeIdx = header.indexOf('system:time_start');
      var ndviIdx = header.indexOf('NDVI');

      var fechas = [];
      var ndvi = [];

      for (var i = 1; i < lines.length; i++) {
        var cols = lines[i].split(',');
        if (cols.length < 2) continue;
        var fecha = parseFecha(cols[timeIdx]);
        var valor = parseFloat(cols[ndviIdx]);
        if (!isNaN(fecha.getTime()) && !isNaN(valor)) {
          fechas.push(fecha);
          ndvi.push(valor);
        }
      }

      console.log('Fechas cargadas:', fechas.length, 'NDVI:', ndvi.length);
      callback(fechas, ndvi);
    })
    .catch(err => console.error('Error fetch CSV:', err));
}

// Crear gráfico NDVI
cargarCSV('grafico.csv', function(fechas, ndvi) {
  var umbral = 0.2;

  var trace = {
    x: fechas,
    y: ndvi,
    mode: 'lines+markers',
    name: 'NDVI',
    marker: {
      color: ndvi.map(v => v >= umbral ? 'green' : 'red'),
      size: 6
    },
    line: { color: 'darkgreen' }
  };

  var layout = {
    title: 'Variación temporal del NDVI en el área de estudio',
    xaxis: { title: 'Fecha' },
    yaxis: { title: 'NDVI' },
    shapes: [
      {
        type: 'line',
        xref: 'paper',
        x0: 0,
        x1: 1,
        y0: umbral,
        y1: umbral,
        line: { color: 'red', width: 2, dash: 'dash' }
      }
    ]
  };

  Plotly.newPlot('chart', [trace], layout);
});
