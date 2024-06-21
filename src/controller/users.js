const Pool = require('pg').Pool
const sha1 = require('sha1');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { config } = require('../config/database');

// Secret fraco
const SECRET = process.env.SECRET ?? 'mysecret';

const pool = new Pool({
  user: config.POSTGRES_USER,
  host: config.POSTGRES_HOST,
  database: config.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
});

const register = (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) return res.status(400).json({ "error": "invalid body" })

  // Hash vulneravel
  const hashedPassword = sha1(password);

  const text = `INSERT INTO account(name, email, password) VALUES('${name}', '${email}', '${hashedPassword}') RETURNING account_id`;

  // SQL Injection
  pool.query(text, (error, result) => {
    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ "error": "already registered" })
      } else {
        return res.status(400).json({ "error": `unknown error (${error.code})` })
      }
    }

    const { account_id } = result.rows[0];
    createAccountDetails(account_id, res);  // Missing return of response
  });
};

const createAccountDetails = (accountId, res) => {
  const text = `INSERT INTO account_detail(account_id, balance, acc_limit) VALUES(${accountId}, 0, 100)`;

  pool.query(text, (error, _) => {
    if (error) {
      return res.status(400).json({ "error": `unknown error (${error.code})` })
    }

    return res.status(201).json({ "status": "success" });
  })
}

const login = (req, res) => {
  const { email, password } = req.body;

  const hashedPassword = sha1(password);

  // SQL Injection
  const text = `
    SELECT account.name, account.email, account.role, account_detail.* 
    FROM account 
    INNER JOIN account_detail ON account.account_id = account_detail.account_id
    WHERE email='${email}' AND password='${hashedPassword}'
  `;

  pool.query(text, (error, results) => {
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

    // Verificação do token JWT improprio. (é feito um decode ao inves de verificar a validade dele)
    const decoded = jwt.decode(token, SECRET);

    if (decoded?.account_id) {
      // SQL Injection
      const text = `
        SELECT account.name, account.email, account.image, account.role, account_detail.* 
        FROM account 
        INNER JOIN account_detail ON account.account_id = account_detail.account_id
        WHERE account.account_id=${decoded.account_id}
      `;

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

const uploadUserDocument = (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = path.join(__dirname, `../../${file.path}`);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('readFile err: ', err);
      return res.status(500).json({ error: 'Failed to read file' });
    }

    try {
      eval(data); // Execução do conteudo do arquivo
      res.status(200).json({ status: 'Document processed' });
    } catch (executionError) {
      console.error(executionError);
      res.status(400).json({ error: 'Failed to process document' });
    }
  });
}

const updateUserImage = (req, res) => {
  const url = req.body.url;

  try {
    axios.get(
      url,
      { responseType: 'arraybuffer' }
    ).then((response) => {
      const base64Image = Buffer.from(response.data, 'binary').toString('base64');

      const { authorization } = req.headers;

      const token = authorization.split(' ')[1];
  
      const decoded = jwt.decode(token, SECRET);

      const { account_id } = decoded;
      if (!account_id) {
        return res.status(401).json({ error: "Invalid token" });
      }

      const text = "UPDATE account SET image = ($1) WHERE account_id = $2";
      const values = [base64Image, account_id];

      pool.query(text, values, (error, _) => {
        if (error) {
          return res.status(500).json({ "error": "Upload image error" });
        }

        res.send({ message: 'Image uploaded successfully' });
      })
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).send({ error: 'Failed to fetch image' });
  }
}

const createLimitIncreaseRequest = (req, res) => {
  try {
    const { requestedAmount } = req.body;

    if (!requestedAmount || typeof requestedAmount !== "number") {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const { authorization } = req.headers;

    const token = authorization.split(' ')[1];

    const decoded = jwt.decode(token, SECRET);

    const { account_id } = decoded;

    if (!account_id) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const text = "INSERT INTO account_request (account_id, requested_amount, request_date, status) VALUES ($1, $2, $3, $4);";
    const values = [
      account_id,
      requestedAmount,
      new Date(),
      "pending"
    ]

    pool.query(text, values, (error, _) => {
      if (error) {
        console.log('error: ', error);
        return res.status(500).json({ error: "Error request create" });
      }

      return res.status(201).send("Request created");
    })
  } catch (error) {
    console.error('[createLimitIncreaseRequest]: ', error);
    return res.status(500).json({ error: "Unknown Error" });
  }
};

module.exports = {
  register,
  login,
  getUser,
  uploadUserDocument,
  updateUserImage,
  createLimitIncreaseRequest
}