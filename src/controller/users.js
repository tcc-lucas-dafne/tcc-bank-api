const Pool = require('pg').Pool
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const bcrypt = require('bcrypt');
const { config } = require('../config/database');
const { SECRET } = require('../constants');

const pool = new Pool({
  user: config.POSTGRES_USER,
  host: config.POSTGRES_HOST,
  database: config.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
});

const register = async (req, res) => {
  const { name, email, password } = req.body;

  console.log(name, email, password);
  if (!name || !email || !password) {
    return res.status(400).json({ "error": "invalid body" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const text = 'INSERT INTO account(name, email, password) VALUES($1, $2, $3) RETURNING account_id';
    const values = [name, email, hashedPassword];

    const result = await pool.query(text, values);

    const { account_id } = result.rows[0];
    createAccountDetails(account_id, res);
  } catch (error) {
    console.error('error: ', error);
    if (error.code === '23505') {
      return res.status(400).json({ "error": "already registered" });
    } else if (error.code) {
      return res.status(400).json({ "error": `unknown error (${error.code})` });
    } else {
      return res.status(500).json({ "error": "unknown error" });
    }
  }
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

const login = async (req, res) => {
  let { email, password } = req.body;

  const text = `
    SELECT account.name, account.email, account.role, account.password, account_detail.* 
    FROM account 
    INNER JOIN account_detail ON account.account_id = account_detail.account_id
    WHERE email=$1
  `;

  const values = [email];

  try {
    const results = await pool.query(text, values);

    if (results.rowCount) {
      const result = results.rows[0];
      
      const passwordMatch = await bcrypt.compare(password, result.password);

      if (passwordMatch) {
        const tokenData = { account_id: result.account_id };
        const token = jwt.sign(tokenData, SECRET, { expiresIn: '7d' });

        delete result.password;

        res.status(200).json({ token, account: result });
      } else {
        res.status(400).json({ "status": "error", "message": "invalid credentials" });
      }
    } else {
      res.status(400).json({ "status": "error", "message": "not found" });
    }
  } catch (error) {
    console.error('Err: ', err);
    throw error;
  }
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
        SELECT account.account_id, account.name, account.email, account.image, account.role, account_detail.* 
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

    const checkPendingRequestQuery = `
      SELECT 1 FROM account_request
      WHERE account_id = $1 AND status = 'pending'`;

    const updatePendingRequestQuery = `
      UPDATE account_request
      SET requested_amount = $1, request_date = $2
      WHERE account_id = $3 AND status = 'pending'`;

    const insertNewRequestQuery = `
      INSERT INTO account_request (account_id, requested_amount, request_date, status)
      VALUES ($1, $2, $3, $4)`;

    const now = new Date();

    pool.query(checkPendingRequestQuery, [account_id], (error, result) => {
      if (error) {
        console.log('error: ', error);
        return res.status(500).json({ error: "Error checking pending requests" });
      }

      if (result.rows.length > 0) {
        pool.query(updatePendingRequestQuery, [requestedAmount, now, account_id], (error, _) => {
          if (error) {
            console.log('error: ', error);
            return res.status(500).json({ error: "Error updating request" });
          }

          return res.status(200).send("Request updated");
        });
      } else {
        pool.query(insertNewRequestQuery, [account_id, requestedAmount, now, "pending"], (error, _) => {
          if (error) {
            console.log('error: ', error);
            return res.status(500).json({ error: "Error creating request" });
          }

          return res.status(201).send("Request created");
        });
      }
    });
  } catch (error) {
    console.error('[createLimitIncreaseRequest]: ', error);
    return res.status(500).json({ error: "Unknown Error" });
  }
};

const getUserRequests = (req, res) => {
  try {
    const text = `
      SELECT account_request.*, account.name, account.email 
      FROM account_request
      INNER JOIN account ON account_request.account_id = account.account_id
    `;

    pool.query(text, (error, results) => {
      if (error) {
        return res.status(500).json({ "error": "Error request fetch" });
      }

      return res.status(200).json({ data: results.rows });
    })
  } catch (err) {
    console.error('Err: ', err);
    return res.status(500).json({ "status": "error" });
  }
}

const reviewRequest = async (req, res) => {
  const client = await pool.connect();

  try {
    const { review, requestId } = req.body;

    await client.query('BEGIN');

    const text1 = "UPDATE account_request SET status = $1, review_date = $2 WHERE id = $3 RETURNING requested_amount, account_id";
    const values1 = [review, new Date(), requestId];
    const result1 = await client.query(text1, values1);

    if (review === "approved") {
      const requestedAmount = result1.rows[0].requested_amount;
      const accountId = result1.rows[0].account_id;
  
      const text2 = "UPDATE account_detail SET acc_limit = $1 WHERE account_id = $2";
      const values2 = [requestedAmount, accountId];
      await client.query(text2, values2);
    }

    await client.query('COMMIT');

    return res.status(201).send("Request reviewed and account updated");
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Err: ', error);
    return res.status(500).json({ "error": "Error reviewing request or updating account" });
  } finally {
    client.release();
  }
}

const uploadFile = (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.send('File uploaded successfully.');
}

// Endpoint with LFI
const getFile = (req, res) => {
  const { fileName } = req.query;
  const filePath = path.join(__dirname, '..', '..', 'uploads', fileName);
  res.download(filePath, fileName, (err) => {
    if (err) {
      return res.status(500).send('Error reading file.');
    }
  });
}


module.exports = {
  register,
  login,
  getUser,
  uploadUserDocument,
  updateUserImage,
  getUserRequests,
  reviewRequest,
  createLimitIncreaseRequest,
  uploadFile,
  getFile
}