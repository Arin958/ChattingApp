import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { FiUser, FiMail, FiLock, FiCamera, FiArrowRight, FiCheck } from 'react-icons/fi';
import { registerUser, resetError } from '../../Store/auth/authSlice';


export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    avatar: null
  });
  const [preview, setPreview] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [passwordScore, setPasswordScore] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  // Reset error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(resetError());
    };
  }, [dispatch]);

  // Redirect if already authenticated


  // Calculate password strength
  useEffect(() => {
    if (!formData.password) {
      setPasswordScore(0);
      return;
    }

    let score = 0;
    // Length check
    if (formData.password.length >= 8) score += 1;
    // Contains number
    if (/\d/.test(formData.password)) score += 1;
    // Contains special char
    if (/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) score += 1;
    // Contains upper and lower case
    if (/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password)) score += 1;

    setPasswordScore(score);
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate image type and size
      if (!file.type.match('image.*')) {
        setValidationErrors(prev => ({ ...prev, avatar: 'Please select an image file' }));
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB
        setValidationErrors(prev => ({ ...prev, avatar: 'Image must be less than 2MB' }));
        return;
      }
      
      setFormData(prev => ({ ...prev, avatar: file }));
      setPreview(URL.createObjectURL(file));
      setValidationErrors(prev => ({ ...prev, avatar: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.username.trim()) errors.username = 'Username is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const formDataToSend = new FormData();
    formDataToSend.append('username', formData.username);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('password', formData.password);
    if (formData.avatar) {
      formDataToSend.append('avatar', formData.avatar);
    }

    const result = await dispatch(registerUser(formDataToSend));
    if (registerUser.fulfilled.match(result)) {
      setShowSuccess(true);
      setTimeout(() => navigate('/'), 4000);
    }
  };

  const passwordStrength = [
    { label: 'Too weak', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-orange-500' },
    { label: 'Good', color: 'bg-yellow-500' },
    { label: 'Strong', color: 'bg-green-500' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden"
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
            <p className="text-gray-600">Join our community today</p>
          </div>

          {showSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheck className="text-green-500 text-2xl" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Registration Successful!</h2>
              <p className="text-gray-600">You'll be redirected shortly...</p>
            </div>
          ) : (
            <>
              {(error || validationErrors.general) && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error || validationErrors.general}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Avatar Upload */}
                <div className="flex justify-center">
                  <label className="relative cursor-pointer group">
                    <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group-hover:border-blue-400 transition-colors">
                      {preview ? (
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-gray-400">
                          <FiCamera className="w-8 h-8 mx-auto" />
                          <span className="text-xs mt-1 block">Add Photo</span>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      name="avatar"
                    />
                    <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full shadow-md">
                      <FiCamera className="w-4 h-4" />
                    </div>
                  </label>
                  {validationErrors.avatar && (
                    <p className="text-xs text-red-500 mt-1 text-center w-full">
                      {validationErrors.avatar}
                    </p>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`pl-10 w-full px-4 py-2 rounded-lg border ${validationErrors.username ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="Your username"
                    />
                  </div>
                  {validationErrors.username && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.username}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`pl-10 w-full px-4 py-2 rounded-lg border ${validationErrors.email ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="your@email.com"
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="text-gray-400" />
                    </div>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`pl-10 w-full px-4 py-2 rounded-lg border ${validationErrors.password ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="••••••••"
                    />
                  </div>
                  {validationErrors.password && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.password}</p>
                  )}
                  
                  {/* Password Strength Meter */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div 
                            key={i}
                            className={`h-1 flex-1 rounded-full ${i <= passwordScore ? passwordStrength[passwordScore - 1].color : 'bg-gray-200'}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        Strength: {passwordScore > 0 ? passwordStrength[passwordScore - 1].label : 'Very weak'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className={`w-full flex justify-center items-center py-3 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium shadow-md hover:shadow-lg transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {loading ? (
                      <span className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <FiArrowRight className="ml-2" />
                      </>
                    )}
                  </motion.button>
                </div>

                <div className="text-center text-sm text-gray-600 mt-4">
                  Already have an account?{' '}
                  <Link to="/login" className="text-blue-500 hover:text-blue-700 font-medium">
                    Sign in
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}