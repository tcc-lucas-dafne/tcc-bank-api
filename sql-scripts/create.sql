CREATE TABLE account (
	account_id INT GENERATED ALWAYS AS IDENTITY NOT NULL,
  name VARCHAR(64) NOT NULL,
  email VARCHAR(64) UNIQUE NOT NULL,
  password VARCHAR(64) NOT NULL,
  image TEXT,
  
	PRIMARY KEY (account_id)
);


CREATE TABLE account_detail (
	account_id INT UNIQUE NOT NULL, 
  balance NUMERIC NOT NULL DEFAULT 0.00,
  acc_limit NUMERIC NOT NULL,
  
  CONSTRAINT fk_account FOREIGN KEY (account_id) REFERENCES account(account_id)
);

CREATE TYPE account_request_status AS ENUM ('approved', 'reproved', 'pending');

CREATE TABLE account_request (
  account_id INT NOT NULL,
  requested_amount NUMERIC NOT NULL,
  request_date TIMESTAMPTZ NOT NULL,
  review_date TIMESTAMPTZ,
  status account_request_status NOT NULL DEFAULT,
);