// frontend/src/services/customerProfileService.js

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

/**
 * Get customer profile
 * @param {string} customerId 
 * @param {string} tenantId 
 */
export const getCustomerProfile = async (customerId, tenantId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/customers/profile/${customerId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch profile');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

/**
 * Update customer profile
 * @param {string} customerId 
 * @param {string} tenantId 
 * @param {object} profileData - { fullName, email, phoneNumber }
 */
export const updateCustomerProfile = async (customerId, tenantId, profileData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/customers/profile/${customerId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify(profileData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }

    return data.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

/**
 * Change customer password
 * @param {string} customerId 
 * @param {string} tenantId 
 * @param {string} currentPassword 
 * @param {string} newPassword 
 */
export const changeCustomerPassword = async (customerId, tenantId, currentPassword, newPassword) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/customers/password/${customerId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to change password');
    }

    return data;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

/**
 * Update customer avatar
 * @param {string} customerId 
 * @param {string} tenantId 
 * @param {string} avatarUrl 
 */
export const updateCustomerAvatar = async (customerId, tenantId, avatarUrl) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/customers/avatar/${customerId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({ avatarUrl }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update avatar');
    }

    return data.data;
  } catch (error) {
    console.error('Error updating avatar:', error);
    throw error;
  }
};
