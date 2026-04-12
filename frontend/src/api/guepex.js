import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

/**
 * Fetch Wilayas directly from the backend proxy using Guepex
 */
export const getGeupexWilayas = async () => {
    const response = await axios.get(`${API_BASE_URL}/guepex/wilayas`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('aurea_token')}` }
    });
    return response.data;
};

/**
 * Fetch Communes directly from the backend proxy using Guepex
 */
export const getGeupexCommunes = async (wilayaId) => {
    const response = await axios.get(`${API_BASE_URL}/guepex/communes/${wilayaId}`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('aurea_token')}` }
    });
    return response.data;
};

/**
 * Fetch Agencies (Centers) directly from the backend proxy using Guepex
 */
export const getGeupexAgencies = async (communeId) => {
    const response = await axios.get(`${API_BASE_URL}/guepex/agencies/${communeId}`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('aurea_token')}` }
    });
    return response.data;
};
