export const formatMoney = (val: number) => {
  if (val === undefined || val === null || isNaN(val)) return '0.00'
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val)
}
