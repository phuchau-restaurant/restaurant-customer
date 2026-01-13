import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Mail, Phone, Lock, User, Save, Edit2 } from 'lucide-react';

const ProfileInfo = ({ customer, currentAvatar }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [avatarPreview, setAvatarPreview] = useState(customer?.avatar || currentAvatar || '/images/avatar/default_avt.svg');

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    // API call will be here
    console.log('Saving profile:', formData);
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    // API call will be here
    console.log('Changing password:', passwordData);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsChangingPassword(false);
  };

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-sm p-6"
      >
        <div className="flex flex-col items-center">
          <div className="relative group">
            <img
              src={avatarPreview}
              alt="Avatar"
              className="w-32 h-32 rounded-full object-cover border-4 border-orange-100"
            />
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-8 h-8 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mt-4">{customer?.name}</h3>
          <p className="text-sm text-gray-500">Điểm tích lũy: {customer?.loyaltyPoints || 0}</p>
        </div>
      </motion.div>

      {/* Profile Info */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-800">Thông tin cá nhân</h4>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium"
            >
              <Edit2 className="w-4 h-4" />
              Chỉnh sửa
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-gray-600 hover:text-gray-800 font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex items-center gap-2 px-4 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
              >
                <Save className="w-4 h-4" />
                Lưu
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 text-orange-500" />
              Họ và tên
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!isEditing}
              className={`w-full px-4 py-3 border rounded-xl transition-colors ${
                isEditing
                  ? 'border-orange-200 bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
                  : 'border-gray-200 bg-gray-50 cursor-not-allowed'
              } outline-none`}
            />
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 text-orange-500" />
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!isEditing}
              className={`w-full px-4 py-3 border rounded-xl transition-colors ${
                isEditing
                  ? 'border-orange-200 bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
                  : 'border-gray-200 bg-gray-50 cursor-not-allowed'
              } outline-none`}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 text-orange-500" />
              Số điện thoại
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!isEditing}
              className={`w-full px-4 py-3 border rounded-xl transition-colors ${
                isEditing
                  ? 'border-orange-200 bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
                  : 'border-gray-200 bg-gray-50 cursor-not-allowed'
              } outline-none`}
            />
          </div>
        </div>
      </motion.div>

      {/* Change Password */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-800">Đổi mật khẩu</h4>
          {!isChangingPassword && (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium"
            >
              <Lock className="w-4 h-4" />
              Thay đổi
            </button>
          )}
        </div>

        {isChangingPassword ? (
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Mật khẩu hiện tại"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, currentPassword: e.target.value })
              }
              className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
            />
            <input
              type="password"
              placeholder="Mật khẩu mới"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, newPassword: e.target.value })
              }
              className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
            />
            <input
              type="password"
              placeholder="Xác nhận mật khẩu mới"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, confirmPassword: e.target.value })
              }
              className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setIsChangingPassword(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-medium"
              >
                Xác nhận
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            ••••••••
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default ProfileInfo;
