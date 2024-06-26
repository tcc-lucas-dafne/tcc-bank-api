const Pool = require('pg').Pool
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { config } = require('../config/database');

// Secret fraco
const SECRET = process.env.SECRET ?? 'mysecret';

const pool = new Pool({
  user: config.POSTGRES_USER,
  host: config.POSTGRES_HOST,
  database: config.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
  ...(process.env.POSTGRES_HOST !== "localhost" && { ssl: { rejectUnauthorized: false }})
});

const getInvestments = (req, res) => {
  try {
    const text = "SELECT * FROM investment";

    pool.query(text, (error, results) => {
      if (error) throw error;
      return res.status(200).json({ 'data': results.rows });
    })
  } catch (err) {
    console.error('err: ', err);
    return res.status(500).json({ "status": "error" });
  }
}

const getInvestmentComments = (req, res) => {
  const { investmentId } = req.query;

  if (!investmentId) {
    return res.status(400).json({ 'error': 'investmentId is required' });
  }

  try {
    const text = "SELECT * FROM investment_comment WHERE investment_id = $1";
    const values = [investmentId];

    pool.query(text, values, (error, results) => {
      if (error) throw error;  
      return res.status(200).json({ 'data': results.rows });
    })
  } catch (err) {
    console.error('err: ', err);
    return res.status(500).json({ "status": "error" });
  }
}

const createInvestmentComment = (req, res) => {
  const { investmentId, comment } = req.body;
  const { authorization } = req.headers;

  if (!investmentId || !comment) return res.status(400).json({ "error": "required fields missing" });

  const token = authorization.split(' ')[1];

  // Verificação do token JWT improprio. (é feito um decode ao inves de verificar a validade dele)
  const decoded = jwt.decode(token, SECRET);

  const { account_id } = decoded;

  if (!account_id) {
    return res.status(401).json({ "status": "error", "message": "invalid token" });
  }

  try {
    const text = "INSERT INTO investment_comment (account_id, investment_id, comment, created_at) VALUES ($1, $2, $3, $4)";
    const values = [account_id, investmentId, comment, new Date()];

    pool.query(text, values, (error, results) => {
      if (error) throw error;  
      return res.status(201).json({ 'data': 'comment created' });
    })
  } catch (err) {
    console.error('err: ', err);
    return res.status(500).json({ "status": "error" });
  }

}

module.exports = {
  getInvestments,
  getInvestmentComments,
  createInvestmentComment
}