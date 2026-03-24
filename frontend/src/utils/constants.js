export const productTypes = ['Cadre', 'Couvre', 'Drap', 'Blouse', 'Autre'];

export const statuses = [
  'Nouvelle commande',
  'En design',
  'En production',
  'Expédié',
  'Livré',
  'Retourné'
];

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const getStatusColor = (status) => {
  const colors = {
    'Nouvelle commande': 'bg-blue-900 text-blue-300',
    'En design': 'bg-purple-900 text-purple-300',
    'En production': 'bg-yellow-900 text-yellow-300',
    'Expédié': 'bg-green-900 text-green-300',
    'Livré': 'bg-gray-700 text-gray-300',
    'Retourné': 'bg-red-900 text-red-300'
  };
  return colors[status] || 'bg-gray-800 text-gray-400';
};