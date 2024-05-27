CREATE TABLE account (
	account_id INT GENERATED ALWAYS AS IDENTITY NOT NULL,
  name VARCHAR(64) NOT NULL,
  email VARCHAR(64) UNIQUE NOT NULL,
  password VARCHAR(64) NOT NULL,
  
	PRIMARY KEY (account_id)
);


CREATE TABLE account_detail (
	account_id INT NOT NULL, 
  balance numeric not null default 0.00,
  acc_limit numeric NOT NULL,
  
  CONSTRAINT fk_account FOREIGN KEY (account_id) REFERENCES account(account_id)
);