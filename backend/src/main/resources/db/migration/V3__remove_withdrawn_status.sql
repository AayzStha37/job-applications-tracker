-- Move any existing WITHDRAWN rows to REJECTED
UPDATE applications SET status = 'REJECTED' WHERE status = 'WITHDRAWN';
