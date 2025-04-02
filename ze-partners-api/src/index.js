const express = require('express');
const path = require('path');
const app = express();

// Corrija a importação das rotas (verifique o caminho correto)
const partnerRoutes = require('./routes/parceiroRoutes'); // 👈 Caminho relativo corrigido

// Configuração para arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));


app.use(express.json());

app.use('/api', partnerRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
