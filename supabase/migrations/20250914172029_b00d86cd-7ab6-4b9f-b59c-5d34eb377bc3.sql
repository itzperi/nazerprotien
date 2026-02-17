-- Insert remaining bills from the provided data
-- Bills from September 2025 (earlier dates)
INSERT INTO bills (bill_number, business_id, customer_name, customer_phone, bill_date, items, total_amount, paid_amount, balance_amount, payment_method) VALUES
('SAT083', 'Santhosh Chicken 1', 'Alfah chicken salman', '96005 59642', '2025-09-08', '[{"no": 1, "item": "Chicken Live", "weight": "57.2", "rate": "108", "amount": 6177.60}]', 32820.75, 0.00, 32820.75, 'pending'),
('ZCL045', 'Santhosh Chicken 1', 'Ashu Mutton', '9551913427', '2025-09-07', '[{"no": 1, "item": "Chicken Live", "weight": "102.5", "rate": "108", "amount": 11070.00}]', 12218.10, 0.00, 12218.10, 'pending'),
('WYV873', 'Santhosh Chicken 1', 'Srinivasan', '93811 02861', '2025-09-07', '[{"no": 1, "item": "Chicken Live", "weight": "47.55", "rate": "105", "amount": 4992.75}]', 18214.00, 0.00, 18214.00, 'pending'),
('SOC858', 'Santhosh Chicken 1', 'Sangeeta Catering', '79049 01697', '2025-09-07', '[{"no": 1, "item": "Chicken Live", "weight": "31.1", "rate": "113", "amount": 3514.30}]', 3514.70, 0.00, 3514.70, 'pending'),
('OUV543', 'Santhosh Chicken 1', 'Bhaskaran P S', '9444135199', '2025-09-05', '[{"no": 1, "item": "Chicken Live", "weight": "14.4", "rate": "120", "amount": 1728.00}]', 1728.00, 0.00, 1728.00, 'pending'),
('UMV713', 'Santhosh Chicken 1', 'Yousuf', '9444417243', '2025-09-04', '[{"no": 1, "item": "Chicken Live", "weight": "14.75", "rate": "109", "amount": 1607.75}]', 1607.35, 0.00, 1607.35, 'pending'),
('GKG378', 'Santhosh Chicken 1', 'Kani/Praveen', '9884209468', '2025-09-03', '[{"no": 1, "item": "Chicken Live", "weight": "14.85", "rate": "116", "amount": 1722.60}]', 10995.75, 0.00, 10995.75, 'pending'),

-- Bills from August 2025
('HQW025', 'Santhosh Chicken 1', 'Sudhakar V J', '9080921690', '2025-08-29', '[{"no": 1, "item": "Chicken Live", "weight": "28.0", "rate": "107", "amount": 2996.00}]', 6990.00, 0.00, 6990.00, 'pending'),
('JST116', 'Santhosh Chicken 1', 'Mithran Classic Catering', '95513 90448', '2025-08-28', '[{"no": 1, "item": "Chicken Live", "weight": "103.0", "rate": "107", "amount": 11021.00}]', 29671.00, 0.00, 29671.00, 'pending'),
('KSC481', 'Santhosh Chicken 1', 'Kanagaraj chicken', '8438359480', '2025-08-26', '[{"no": 1, "item": "Chicken Live", "weight": "33.75", "rate": "99", "amount": 3341.25}, {"no": 2, "item": "Chicken Live", "weight": "24.1", "rate": "99", "amount": 2385.90}]', 7301.75, 5800.00, 1501.75, 'cash'),
('VGI309', 'Santhosh Chicken 1', 'Fathima Fast Food', '9025894584', '2025-08-19', '[{"no": 1, "item": "Chicken Live", "weight": "8.5", "rate": "123", "amount": 1045.50}, {"no": 2, "item": "Chicken Liver", "weight": "1.25", "rate": "100", "amount": 125.00}]', 8191.35, 5000.00, 3191.35, 'cash'),
('AGW659', 'Santhosh Chicken 1', 'Razack', '90807 25323', '2025-08-17', '[]', 0.00, 2000.00, 3135.00, 'cash'),
('PEI650', 'Santhosh Chicken 1', 'Balamurugan', '98409 80627', '2025-08-07', '[{"no": 1, "item": "Chicken Live", "weight": "14.75", "rate": "97", "amount": 1430.75}]', 1430.75, 0.00, 1430.75, 'pending'),
('TYI742', 'Santhosh Chicken 1', 'Haseen Basha', '73582 23347', '2025-08-01', '[{"no": 1, "item": "Chicken Live", "weight": "5.2", "rate": "124", "amount": 644.80}]', 3784.95, 0.00, 3784.95, 'pending');