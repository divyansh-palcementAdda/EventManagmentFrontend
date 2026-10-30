import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object().shape({
  fullName: yup.string().required('Full name is required'),
  mobileNumber: yup.string().matches(/^[0-9]{10}$/, 'Mobile number must be 10 digits').required('Mobile number is required'),
  whatsappNumber: yup.string().matches(/^[0-9]{10}$/, 'WhatsApp number must be 10 digits').required('WhatsApp number is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  schoolName: yup.string().required('School name is required'),
  educationBoard: yup.string().required('Education board is required'),
  courseStream: yup.string().required('Course/stream is required'),
  state: yup.string().required('State is required'),
  city: yup.string().required('City is required'),
});

const StudentFillForm = () => {
  const [sameAsMobile, setSameAsMobile] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: yupResolver(schema),
  });

  const mobileNumber = watch('mobileNumber');

  const onSubmit = (data) => {
    console.log('Form submitted:', data);
    alert('Registration submitted successfully!');
  };

  return (
    <div className="registration-page">
      <Toaster position="top-right" />

      <div className="form-card">
        {/* Form Header */}
        <div className="form-header">
          <div className="form-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h1 className="form-heading">Student Registration Form</h1>
          <p className="form-subtitle">Fill all details carefully to receive your certificate</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">
              Full Name <span className="form-label-required">*</span>
            </label>
            <div className="form-input-wrapper">
              <svg className="form-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                type="text"
                {...register('fullName')}
                className="form-input"
                placeholder="Enter your full name"
              />
            </div>
            {errors.fullName && <div className="form-error">{errors.fullName.message}</div>}
          </div>

          {/* Mobile Number */}
          <div className="form-group">
            <label className="form-label">
              Mobile Number <span className="form-label-required">*</span>
            </label>
            <div className="form-input-wrapper">
              <svg className="form-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <input
                type="tel"
                {...register('mobileNumber')}
                className="form-input"
                placeholder="10-digit mobile number"
              />
            </div>
            {errors.mobileNumber && <div className="form-error">{errors.mobileNumber.message}</div>}
          </div>

          {/* WhatsApp Number */}
          <div className="form-group">
            <label className="form-label">
              WhatsApp Number <span className="form-label-required">*</span>
            </label>
            <div className="form-input-wrapper">
              <svg className="form-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
              <input
                type="tel"
                {...register('whatsappNumber')}
                className="form-input"
                placeholder="WhatsApp number"
                disabled={sameAsMobile}
              />
            </div>
            <label className="form-checkbox-wrapper-small">
              <input
                type="checkbox"
                checked={sameAsMobile}
                onChange={(e) => {
                  setSameAsMobile(e.target.checked);
                  if (e.target.checked && mobileNumber) {
                    setValue('whatsappNumber', mobileNumber);
                  }
                }}
                className="form-checkbox-small"
              />
              <span className="form-checkbox-label-small">Same as mobile</span>
            </label>
            {errors.whatsappNumber && <div className="form-error">{errors.whatsappNumber.message}</div>}
          </div>

          {/* Email Address */}
          <div className="form-group">
            <label className="form-label">
              Email Address <span className="form-label-required">*</span>
            </label>
            <div className="form-input-wrapper">
              <svg className="form-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                type="email"
                {...register('email')}
                className="form-input"
                placeholder="your@email.com"
              />
            </div>
            {errors.email && <div className="form-error">{errors.email.message}</div>}
          </div>

          {/* School / Institution Name */}
          <div className="form-group form-group-full">
            <label className="form-label">
              School / Institution Name <span className="form-label-required">*</span>
            </label>
            <div className="form-input-wrapper">
              <svg className="form-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21h18"/>
                <path d="M5 21V7l8-4 8 4v14"/>
                <path d="M8 21v-4h8v4"/>
              </svg>
              <input
                type="text"
                {...register('schoolName')}
                className="form-input"
                placeholder="Enter your school or institution name"
              />
            </div>
            {errors.schoolName && <div className="form-error">{errors.schoolName.message}</div>}
          </div>

          {/* Education Board */}
          <div className="form-group">
            <label className="form-label">
              Education Board <span className="form-label-required">*</span>
            </label>
            <div className="form-input-wrapper">
              <svg className="form-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
              <select
                {...register('educationBoard')}
                className="form-select"
              >
                <option value="">Select your board</option>
                <option value="cbse">CBSE</option>
                <option value="icse">ICSE</option>
                <option value="state">State Board</option>
                <option value="ib">IB</option>
                <option value="cambridge">Cambridge</option>
                <option value="other">Other</option>
              </select>
              <svg className="form-select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
            {errors.educationBoard && <div className="form-error">{errors.educationBoard.message}</div>}
          </div>

          {/* 12th Course / Stream */}
          <div className="form-group">
            <label className="form-label">
              12th Course / Stream <span className="form-label-required">*</span>
            </label>
            <div className="form-input-wrapper">
              <svg className="form-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              <select
                {...register('courseStream')}
                className="form-select"
              >
                <option value="">Select your stream</option>
                <option value="science">Science</option>
                <option value="commerce">Commerce</option>
                <option value="arts">Arts</option>
                <option value="vocational">Vocational</option>
                <option value="other">Other</option>
              </select>
              <svg className="form-select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
            {errors.courseStream && <div className="form-error">{errors.courseStream.message}</div>}
          </div>

          {/* State */}
          <div className="form-group">
            <label className="form-label">
              State <span className="form-label-required">*</span>
            </label>
            <div className="form-input-wrapper">
              <svg className="form-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <select
                {...register('state')}
                className="form-select"
              >
                <option value="">Select your state</option>
                <option value="andhra-pradesh">Andhra Pradesh</option>
                <option value="bihar">Bihar</option>
                <option value="delhi">Delhi</option>
                <option value="gujarat">Gujarat</option>
                <option value="karnataka">Karnataka</option>
                <option value="kerala">Kerala</option>
                <option value="madhya-pradesh">Madhya Pradesh</option>
                <option value="maharashtra">Maharashtra</option>
                <option value="rajasthan">Rajasthan</option>
                <option value="tamil-nadu">Tamil Nadu</option>
                <option value="telangana">Telangana</option>
                <option value="uttar-pradesh">Uttar Pradesh</option>
                <option value="west-bengal">West Bengal</option>
                <option value="other">Other</option>
              </select>
              <svg className="form-select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
            {errors.state && <div className="form-error">{errors.state.message}</div>}
          </div>

          {/* City */}
          <div className="form-group">
            <label className="form-label">
              City <span className="form-label-required">*</span>
            </label>
            <div className="form-input-wrapper">
              <svg className="form-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21h18"/>
                <path d="M5 21V7l8-4 8 4v14"/>
                <path d="M8 21v-4h8v4"/>
              </svg>
              <select
                {...register('city')}
                className="form-select"
              >
                <option value="">Select state first</option>
              </select>
              <svg className="form-select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
            {errors.city && <div className="form-error">{errors.city.message}</div>}
          </div>

          {/* Submit Button */}
          <div className="form-group form-group-full">
            <button type="submit" className="form-submit-button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Submit Information to Claim your Certificate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentFillForm;
