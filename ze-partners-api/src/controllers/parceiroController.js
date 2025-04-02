const pool = require('../config/db');

const criarParceiro = async (req, res) => {
  const { tradingName, ownerName, document, lng, lat, coverageArea } = req.body;

  if (!tradingName || !ownerName || !document || !lng || !lat || !coverageArea) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }

  try {
    // Converte de string para objeto
    const coverageAreaObj = JSON.parse(coverageArea);
    
    // Converte para WKT
    const coverageAreaWKT = `MULTIPOLYGON(${
      coverageAreaObj.coordinates.map(polygon => 
        `((${polygon[0].map(point => point.join(' ')).join(',')}))`
      ).join(',')
    })`;
    
    const addressWKT = `POINT(${lng} ${lat})`;

    const [result] = await pool.query(
      `INSERT INTO partners 
       (tradingName, ownerName, document, address, coverageArea)
       VALUES (?, ?, ?, ST_GeomFromText(?), ST_GeomFromText(?))`,
      [tradingName, ownerName, document, addressWKT, coverageAreaWKT]
    );

    res.status(201).json({
      id: result.insertId,
      message: "Parceiro criado com sucesso"
    });

  } catch (err) {
    console.error("Erro detalhado:", err);
    res.status(500).json({ 
      error: "Erro ao criar parceiro",
      details: err.message 
    });
  }
};


const parceiroProximo = async (req, res) => {
    const { lat, long } = req.query;
  
    if (!lat || !long) {
      return res.status(400).json({ error: "Coordenadas 'lat' e 'long' são obrigatórias." });
    }
  
    try {
      const point = `${parseFloat(long)} ${parseFloat(lat)}`;
      
      const [partners] = await pool.query(`
        SELECT 
          id,
          tradingName,
          ownerName,
          document,
          JSON_OBJECT(
            'type', 'MultiPolygon',
            'coordinates', JSON_EXTRACT(ST_AsGeoJSON(coverageArea), '$.coordinates')
          ) AS coverageArea,
          JSON_OBJECT(
            'type', 'Point',
            'coordinates', JSON_EXTRACT(ST_AsGeoJSON(address), '$.coordinates')
          ) AS address,
          ST_Distance(
            address,
            ST_GeomFromText(?)
          ) AS distance
        FROM partners
        WHERE ST_Contains(
          coverageArea,
          ST_GeomFromText(?)
        )
        ORDER BY distance
        LIMIT 1;
      `, [`POINT(${point})`, `POINT(${point})`]);
  
      if (!partners || partners.length === 0) {
        return res.status(404).json({ error: "Nenhum parceiro encontrado para esta localização." });
      }
  
      const partner = partners[0];
      
      res.json(partner);
      
    } catch (err) {
      console.error("Erro na busca:", err);
      res.status(500).json({ 
        error: "Erro ao buscar parceiro",
        details: err.message
      });
    }
  };

  const parceiroID = async (req, res) => {
  const { id } = req.params;

  try {
    // Consulta modificada para garantir retorno consistente
    const [rows] = await pool.query(`
      SELECT 
        id,
        tradingName,
        ownerName,
        document,
        ST_AsText(coverageArea) AS coverageAreaWKT,
        ST_X(address) AS lng,
        ST_Y(address) AS lat
      FROM partners
      WHERE id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Parceiro não encontrado" });
    }

    const partner = {
      id: rows[0].id,
      tradingName: rows[0].tradingName,
      ownerName: rows[0].ownerName,
      document: rows[0].document,
      address: {
        type: "Point",
        coordinates: [parseFloat(rows[0].lng), parseFloat(rows[0].lat)]
      },
      coverageArea: convertWKTtoMultiPolygon(rows[0].coverageAreaWKT)
    };

    res.json(partner);

  } catch (err) {
    console.error("Erro detalhado:", {
      message: err.message,
      stack: err.stack,
      query: "SELECT id, tradingName, ownerName, document, ST_AsText(coverageArea), ST_X(address), ST_Y(address) FROM partners WHERE id = ?"
    });
    res.status(500).json({ 
      error: "Erro ao buscar parceiro",
      details: "Verifique os logs do servidor"
    });
  }
};

// Conversor WKT para GeoJSON MultiPolygon
function convertWKTtoMultiPolygon(wkt) {
  if (!wkt || !wkt.includes('MULTIPOLYGON')) return null;
  
  try {
    // Extrai tudo entre os parênteses mais externos
    const coordString = wkt.split('MULTIPOLYGON')[1].trim();
    const normalized = coordString
      .replace(/\(+/g, '(')
      .replace(/\)+/g, ')')
      .replace(/, /g, ',');

    const polygons = normalized.split(')),((')
      .map(poly => poly.replace(/[()]/g, ''));

    const coordinates = polygons.map(polygon => [
      polygon.split(',').map(point => {
        const [lng, lat] = point.trim().split(' ');
        return [parseFloat(lng), parseFloat(lat)];
      })
    ]);

    return { type: "MultiPolygon", coordinates };
  } catch (e) {
    console.error("Falha na conversão WKT:", wkt);
    return null;
  }
}
  
module.exports = { 
    criarParceiro,
    parceiroProximo,
    parceiroID
  };