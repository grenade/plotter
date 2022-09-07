import { useEffect, useState } from 'react';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Map, { Layer, Source } from 'react-map-gl';
import turf from 'turf';

const mapboxPublicToken = 'pk.eyJ1IjoiZ3JlbmFkZSIsImEiOiJjbDdybjFidTEwMHJsM29sZWh1N2hsZDY2In0.7MIdGipjgwzW8bLfRuPY1A';

const layerStyle = {
  id: 'polygon',
  type: 'fill',
  paint: {
    'fill-opacity': 0.5,
    'fill-color': '#007cbf'
  }
};

function App() {
  const [polygon, setPolygon] = useState({});
  const polygonHandler = ({ target: { value } }) => {
    setPolygon(p => ({
      ...p,
      bgs2005: [...new Set(value.replaceAll('POLYGON', '').replaceAll('(', '').replaceAll(')', '').replaceAll('\n', '').split(',').filter(x => x.includes('.')).map(x => x.split(' ').filter(x => x.length)))]
    }));
  };
  useEffect(() => {
    if (!!polygon.bgs2005 && !!polygon.bgs2005.length) {
      fetch(`https://epsg.io/trans?data=${polygon.bgs2005.map(x=>x.join(',')).join(';')}&s_srs=7801&t_srs=4326`)
        .then(response => response.json())
        .then(wgs84 => {
          setPolygon(p => {
            const points = wgs84.map(w=>[Number(w.x),Number(w.y)]);
            const feature = {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [points],
              }
            };
            const center = turf.center(feature);
            return {
              ...p,
              feature,
              center,
            };
          });
        })
        .catch(console.error);
    }
  }, [polygon.bgs2005]);
  return (
    <Container>
      <Row style={{height: '800px'}}>
        {
          (!!polygon.center) && (!!polygon.feature) && (
            <Map
              initialViewState={{
                latitude: polygon.center.geometry.coordinates[1],
                longitude: polygon.center.geometry.coordinates[0],
                zoom: 20,
              }}
              style={{width: '100%', height: '100%'}}
              mapStyle="mapbox://styles/mapbox/light-v9"
              mapboxAccessToken={mapboxPublicToken}>
              <Source type="geojson" data={polygon.feature}>
                <Layer {...layerStyle} />
              </Source>
            </Map>
          )
        }
      </Row>
      <Row>
        <Col>
          <Form.Label htmlFor="polygon">bgs 2005 polygon</Form.Label>
          <Form.Control as="textarea" id="polygon" aria-describedby="polygonHelp" rows="18" onChange={polygonHandler} />
          <Form.Text id="polygonHelp" muted>
            paste or enter a ccs polygon here
          </Form.Text>
        </Col>
        <Col>
          <pre>
            {
              (!!polygon.feature) && JSON.stringify(polygon.feature, null, 2)
            }
          </pre>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
