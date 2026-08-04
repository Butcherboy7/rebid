// Utility for Indian Rupee (INR) formatting (e.g. ₹2,50,000 / ₹55,75,500)
export const formatINR = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};
