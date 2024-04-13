const Pool = require('pg').Pool
const sha1 = require('sha1');
const jwt = require('jsonwebtoken');

const SECRET = process.env.SECRET;

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
});

const register = (req, res) => {
  const { name, email, password } = req.body;
  
  const hashedPassword = sha1(password);

  const text = "INSERT INTO account(name, email, password) VALUES($1, $2, $3)";
  const values = [name, email, hashedPassword];

  pool.query(text, values, (error, results) => {
    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ "error": "already registered" })
      } else {
        return res.status(400).json({ "error": `unknown error (${error.code})` })
      }
    }

    res.status(201).json({ "status": "success" })
  });
}

const login = (req, res) => {
  const { email, password } = req.body;

  const hashedPassword = sha1(password)
  
  const text = "SELECT * FROM account WHERE email=$1 AND password=$2";
  const values = [email, hashedPassword];

  pool.query(text, values, (error, results) => {
    if (error) {
      throw error;
    }

    if (results.rowCount) {
      const result = results.rows[0];
      const tokenData = { id: result.id };

      const token = jwt.sign(tokenData, SECRET, { expiresIn: '7d' });
      res.status(200).json({ token })
    } else {
      res.status(400).json({ "status": "error", "message": "not found" })
    }
  })
};

const getUser = (req, res) => {
  const { authorization } = req.headers;

  try {
    const token = authorization.split(' ')[1];

    const decoded = jwt.decode(token, SECRET);
    if (decoded && decoded.id) {
      const userId = decoded.id;
  
      const text = `SELECT id, email FROM users WHERE id='${userId}'`;
      pool.query(text, (error, results) => {
        if (error) {
          throw error;
        }
    
        if (results.rowCount) {
          const result = results.rows[0];    
          res.status(200).json(result);
        } else {
          res.status(400).json({ "status": "error", "message": "not found" });
        }
      })
    } else {
      res.status(401).json({ "status": "error", "message": "invalid token" });
    }
  } catch (err) {
    res.status(400).json({ "status": "error", "message": "invalid authorization" });
  }
}

module.exports = {
  register,
  login,
  getUser
}