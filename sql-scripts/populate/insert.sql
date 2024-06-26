ALTER SEQUENCE account_account_id_seq RESTART WITH 1;

INSERT INTO account (account_id, name, email, password, image) VALUES (1, 'Lucas', 'lucas@email.com', '7c4a8d09ca3762af61e59520943dc26494f8941b', null);
INSERT INTO account (account_id, name, email, password, image) VALUES (1, 'Samy', 'samy@email.com', '7c4a8d09ca3762af61e59520943dc26494f8941b', null);

INSERT INTO account_detail (account_id, balance, acc_limit) VALUES (1, 500, 5000);
INSERT INTO account_detail (account_id, balance, acc_limit) VALUES (2, 500, 5000);

INSERT INTO investment (name, description) VALUES ('IPCA 2029+', 'IPCA + 6.41% com vencimento em 2029');
INSERT INTO investment (name, description) VALUES ('[BTC] Bitcoin', 'Compre e envie direto para a sua carteira');

INSERT INTO investment_comment (account_id, investment_id, comment, created_at) VALUES (1, 1, 'Vai piorar', '2024-06-19'); 
INSERT INTO investment_comment (account_id, investment_id, comment, created_at) VALUES (2, 2, 'É bolha', '2024-06-15'); 