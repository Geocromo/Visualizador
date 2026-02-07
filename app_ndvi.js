// =========================
// Mapa base con Leaflet
// =========================

// Crear mapa base centrado en tu zona
var map = L.map('map').setView([-22.4686, -69.0143], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Cargar polígono/shape del sitio (GeoJSON) desde RSS_aoi.geojson
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
  })
  .catch(err => console.error('Error cargando GeoJSON:', err));


// =========================
// Lectura de CSV y gráfico NDVI
// =========================

// Parsear fecha tipo "Apr 29, 2017" a string "YYYY-MM-DD"
function parseFecha(str) {
  if (!str) return null;
  str = str.replace(/"/g, '').trim();  // quitar comillas
  var d = new Date(str);
  if (isNaN(d.getTime())) return null;
  var year = d.getFullYear();
  var month = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

// Leer CSV simple (system:time_start,NDVI)
function cargarCSV(url, callback) {
  fetch(url)
    .then(response => response.text())
    .then(text => {
      var lines = text.trim().split('\n');
      if (lines.length < 2) {
        console.error('CSV sin datos');
        callback([], []);
        return;
      }

      var header = lines[0].split(',');
      console.log('Header:', header);

      var timeIdx = header.indexOf('system:time_start');
      var ndviIdx = header.indexOf('NDVI');

      console.log('timeIdx:', timeIdx, 'ndviIdx:', ndviIdx);

      var fechas = [];
      var ndvi = [];

      for (var i = 1; i < lines.length; i++) {
        var cols = lines[i].split(',');
        if (cols.length < 2) continue;

        var fecha = parseFecha(cols[timeIdx]);
        var valor = parseFloat(cols[ndviIdx]);

        if (fecha && !isNaN(valor)) {
          fechas.push(fecha);   // 'YYYY-MM-DD'
          ndvi.push(valor);     // ~0.2
        }
      }

      console.log('Ejemplo fechas:', fechas[0], 'NDVI[0]:', ndvi[0]);
      console.log('Fechas cargadas:', fechas.length, 'NDVI:', ndvi.length);

      callback(fechas, ndvi);
      console.log('Ejemplo fechas:', fechas[0], 'NDVI[0]:', ndvi[0]);
      console.log('Fechas cargadas:', fechas.length, 'NDVI:', ndvi.length);

    })
    .catch(err => console.error('Error fetch CSV:', err));
}

// Crear gráfico NDVI desde grafico.csv
cargarCSV('grafico.csv', function (fechas, ndvi) {
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
  xaxis: {
    title: 'Fecha',
    type: 'date'
  },
  yaxis: {
    title: 'NDVI',
    range: [0, 0.4]
  },
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
