import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useCustomer } from '../../contexts/CustomerContext';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../../hooks/useAlert';

const GoogleLoginButton = () => {
  const { login } = useCustomer();
  const navigate = useNavigate();
  const { showSuccess, showError } = useAlert();

  const handleSuccess = async (credentialResponse) => {
    try {
      if (!credentialResponse.credential) {
         throw new Error("No credential received from Google");
      }

      // Call Backend API to verify token and get customer data
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customers/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': localStorage.getItem('tenantId') || import.meta.env.VITE_TENANT_ID, 
        },
        body: JSON.stringify({
          token: credentialResponse.credential
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Google Login Failed');
      }

      // Login success
      login(data.data);
      showSuccess(`Chào mừng ${data.data.fullName || 'bạn'}!`);
      navigate('/menu');

    } catch (error) {
      console.error("Google Login Error:", error);
      showError(error.message || "Đăng nhập Google thất bại");
    }
  };

  const handleError = () => {
    showError("Đăng nhập Google thất bại");
  };

  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap
        shape="pill"
        // width="100%" // Google does not support percentage width
        width="320" 
        theme="outline"
      />
    </div>
  );
};

export default GoogleLoginButton;
