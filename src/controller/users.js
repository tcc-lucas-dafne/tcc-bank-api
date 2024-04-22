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

  if (!name || !email || !password) return res.status(400).json({ "error": "invalid body" })
  
  const hashedPassword = sha1(password);

  const text = "INSERT INTO account(name, email, password) VALUES($1, $2, $3) RETURNING account_id";
  const values = [name, email, hashedPassword];

  pool.query(text, values, (error, result) => {
    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ "error": "already registered" })
      } else {
        return res.status(400).json({ "error": `unknown error (${error.code})` })
      }
    };

    const { account_id } = result.rows[0];
    createAccountDetails(account_id);
  });
};

const createAccountDetails = (accountId) => {
  const text = "INSERT INTO account_detail(account_id, balance, acc_limit) VALUES($1, $2, $3)";
  const values = [accountId, 0, 100];

  pool.query(text, values, (error, _) => {
    if (error) {
      return res.status(400).json({ "error": `unknown error (${error.code})` })
    }

    return res.status(201).json({ "status": "success" });
  })
}

const login = (req, res) => {
  const { email, password } = req.body;

  const hashedPassword = sha1(password)
  
  const text = `
    SELECT account.name, account.email, account_detail.* 
    FROM account 
    INNER JOIN account_detail ON account.account_id = account_detail.account_id
    WHERE email=$1 AND password=$2 
  `;
  const values = [email, hashedPassword];

  pool.query(text, values, (error, results) => {
    if (error) {
      throw error;
    }

    if (results.rowCount) {
      const result = results.rows[0];
      const tokenData = { account_id: result.account_id };

      const token = jwt.sign(tokenData, SECRET, { expiresIn: '7d' });
      res.status(200).json({ token, account: result })
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

    if (decoded && decoded.account_id) {
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