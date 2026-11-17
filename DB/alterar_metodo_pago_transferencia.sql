ALTER TABLE `pago`
MODIFY COLUMN `Metodo_Pago`
ENUM('Efectivo', 'Paypal', 'Tarjeta', 'Transferencia')
NOT NULL DEFAULT 'Efectivo';
