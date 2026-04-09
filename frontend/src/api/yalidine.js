import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

/**
 * Fetch Wilayas directly from the backend proxy using Yalidine
 */
export const getWilayas = async () => {
    const response = await axios.get(`${API_BASE_URL}/yalidine/wilayas`);
    return response.data;
};

/**
 * Fetch Communes directly from the backend proxy using Yalidine
 */
export const getCommunes = async (wilayaId) => {
    const response = await axios.get(`${API_BASE_URL}/yalidine/communes?wilaya_id=${wilayaId}`);
    return response.data;
};

/**
 * Trigger manual sync for an order
 */
export const syncYalidineOrder = async (orderId) => {
    const response = await axios.post(`${API_BASE_URL}/orders/${orderId}/sync-yalidine`, {}, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('aurea_token')}` }
    });
    return response.data;
};

/**
 * Fetch live parcel status from Yalidine
 */
export const getParcelStatus = async (tracking) => {
    const response = await axios.get(`${API_BASE_URL}/yalidine/parcels/${tracking}`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('aurea_token')}` }
    });
    return response.data;
};
