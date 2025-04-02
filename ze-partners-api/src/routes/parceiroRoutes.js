// src/routes/partnerRoutes.js
const express = require('express');
const { 
  criarParceiro,
  parceiroProximo,
  parceiroID
} = require('../controllers/parceiroController');

const router = express.Router();


router.post('/partners', criarParceiro);

router.get('/partners/search', parceiroProximo);

router.get('/partners/:id', parceiroID);

module.exports = router;