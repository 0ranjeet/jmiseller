import React, { useEffect } from 'react';
import "./SellerRegistration.css"
import { useNavigate } from 'react-router-dom';
import { useSeller } from '../contexts/SellerContext';
import StepIndicator from '../components/registration-steps/StepIndicator';
import BusinessStep from '../components/registration-steps/BusinessStep';
import PersonStep from '../components/registration-steps/PersonStep';
import ContactStep from '../components/registration-steps/ContactStep';
import BankStep from '../components/registration-steps/BankStep';
import SecurityStep from '../components/registration-steps/SecurityStep';
import { useSellerRegistrationForm } from '../hooks/useSellerRegistrationForm.jsx';
import Button from '../ui/components/Button';

const SellerRegistration = () => {
  console.log('[DEBUG] Rendering SellerRegistration component');
  const nav = useNavigate();
  const { seller } = useSeller();
  const sellerId = seller?.sellerId;
  console.log('[DEBUG] Current Seller context:', { seller });

  const {
    currentStep,
    completedSteps,
    loading,
    uploadProgress,
    errors,
    // All setters and values
    ...formProps
  } = useSellerRegistrationForm(sellerId, nav);

  useEffect(() => {
    console.log('[DEBUG] useEffect - Checking buyer authentication');
    
    // Only redirect if we're sure there's no buyerId after initial render
    const timer = setTimeout(() => {
      if (!sellerId) {
        console.warn('[DEBUG] No buyerId found after delay, redirecting to register');
        alert('Please complete your registration first.');
        nav('/register', { replace: true });
      }
    }, 500); // Shorter delay for better UX
    
    return () => clearTimeout(timer);
  }, [sellerId, nav]);

  // Show loading state while checking authentication
  if (!sellerId) {
    console.log('[DEBUG] Seller ID not yet loaded, showing loading state');
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your registration details...</p>
      </div>
    );
  }

  const steps = [
    { number: 1, title: 'Organization' },
    { number: 2, title: 'Person' },
    { number: 3, title: 'Credentials' },
    { number: 4, title: 'Bank' },
    { number: 5, title: 'Security' }
  ];

  const renderStep = () => {
    console.log('[DEBUG] Rendering step:', currentStep);
    switch (currentStep) {
      case 1: return <BusinessStep {...formProps} errors={errors} />;
      case 2: return <PersonStep {...formProps} errors={errors} />;
      case 3: return <ContactStep {...formProps} errors={errors} />;
      case 4: return <BankStep {...formProps} errors={errors} />;
      case 5: return <SecurityStep {...formProps} errors={errors} />;
      default: return <BusinessStep {...formProps} errors={errors} />;
    }
  };

  return (
    <div className="buyer-registration">
      <div className="registration-header">
        <h1>Seller Registration</h1>
        <StepIndicator steps={steps} currentStep={currentStep} completedSteps={completedSteps} />
      </div>
      <div className="registration-content" >
        {renderStep()}
        <div className="step-navigation">
          <Button
            variant="secondary"
            onClick={formProps.handlePrevious}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          {currentStep === 5 ? (
            <Button
              variant="primary"
              onClick={formProps.handleRegister}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={formProps.handleNext}
            >
              Next
            </Button>
          )}
        </div>
        {loading && (
          <div className="upload-progress">
            {Object.entries(uploadProgress).map(([key, msg]) => (
              <div key={key} className="progress-item">⏳ {msg}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerRegistration;