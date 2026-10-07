const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp.slice(-6)}${rand}`;
};

const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString();
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${timestamp.slice(-6)}${rand}`;
};

module.exports = { generateOrderNumber, generateInvoiceNumber };