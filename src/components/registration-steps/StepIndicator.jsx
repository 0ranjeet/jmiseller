import React, { useMemo, useCallback } from 'react';
import { Check, X } from 'lucide-react';
import PropTypes from 'prop-types';
import './StepIndicator.css';

/**
 * Modern StepIndicator Component for JMI Seller Registration
 * 
 * @param {Object} props - Component props
 * @param {Array} props.steps - Array of step objects with {number, title, description?}
 * @param {number} props.currentStep - Currently active step number
 * @param {Array} props.completedSteps - Array of completed step numbers
 * @param {Array} props.errorSteps - Array of step numbers with errors
 * @param {boolean} props.vertical - Vertical layout (default: false)
 * @param {boolean} props.showProgress - Show progress percentage (default: true)
 * @param {Function} props.onStepClick - Callback when step is clicked
 * @param {boolean} props.isLoading - Loading state
 * @param {string} props.className - Additional CSS classes
 */
const StepIndicator = ({
  steps = [],
  currentStep = 1,
  completedSteps = [],
  errorSteps = [],
  vertical = false,
  showProgress = true,
  onStepClick = null,
  isLoading = false,
  className = '',
}) => {
  // Calculate progress line width/height
  const progressPercentage = useMemo(() => {
    if (!steps.length) return 0;
    
    const totalSteps = steps.length;
    const currentIndex = steps.findIndex(step => step.number === currentStep);
    
    // If we have completed steps beyond current, use the furthest completed
    const furthestCompleted = Math.max(
      currentIndex,
      completedSteps.length > 0 
        ? Math.max(...completedSteps.map(num => steps.findIndex(s => s.number === num)))
        : -1
    );
    
    return Math.min((furthestCompleted / (totalSteps - 1)) * 100, 100);
  }, [steps, currentStep, completedSteps]);
  
  // Determine step state
  const getStepState = useCallback((stepNumber) => {
    if (errorSteps.includes(stepNumber)) return 'error';
    if (completedSteps.includes(stepNumber)) return 'completed';
    if (stepNumber === currentStep) return 'current';
    return 'pending';
  }, [completedSteps, errorSteps, currentStep]);
  
  // Handle step click
  const handleStepClick = useCallback((step, state) => {
    if (!onStepClick || isLoading) return;
    
    // Only allow clicking on completed steps, current step, or next step
    if (state === 'completed' || state === 'current' || 
        (state === 'pending' && step.number === currentStep + 1)) {
      onStepClick(step.number);
    }
  }, [onStepClick, isLoading, currentStep]);
  
  // Render step icon based on state
  const renderStepIcon = (step, state) => {
    switch (state) {
      case 'completed':
        return (
          <div className="step-icon">
            <Check size={18} aria-hidden="true" />
          </div>
        );
      case 'error':
        return (
          <div className="step-icon">
            <X size={18} aria-hidden="true" />
          </div>
        );
      case 'current':
        return step.number;
      default:
        return step.number;
    }
  };
  
  // Calculate completed percentage for display
  const completedPercentage = Math.round(
    (completedSteps.length / steps.length) * 100
  );
  
  if (!steps.length) {
    return null;
  }
  
  return (
    <div 
      className={`step-indicator ${
        vertical ? 'vertical' : ''
      } ${isLoading ? 'loading' : ''} ${className}`}
      role="progressbar"
      aria-valuenow={completedSteps.length}
      aria-valuemin="0"
      aria-valuemax={steps.length}
      aria-label={`Registration progress: ${completedSteps.length} of ${steps.length} steps completed`}
    >
      {/* Progress label */}
      {showProgress && (
        <div className="progress-label">
          {completedPercentage}% Complete
        </div>
      )}
      
      {/* Background connector line */}
      <div className="step-connector" aria-hidden="true">
        {/* Progress line */}
        <div 
          className="step-progress"
          style={{
            [vertical ? 'height' : 'width']: `${progressPercentage}%`
          }}
        />
      </div>
      
      {/* Steps */}
      {steps.map((step, index) => {
        const state = getStepState(step.number);
        
        return (
          <div key={step.number} className="step-item">
            <button
              className={`step-circle ${state}`}
              onClick={() => handleStepClick(step, state)}
              disabled={isLoading}
              aria-current={state === 'current' ? 'step' : undefined}
              aria-label={`Step ${step.number}: ${step.title}${
                state === 'completed' ? ' (completed)' :
                state === 'error' ? ' (error)' :
                state === 'current' ? ' (current)' : ''
              }`}
              title={`Step ${step.number}: ${step.title}`}
             
            >
              {renderStepIcon(step, state)}
            </button>
            
            <div className={`step-title ${state}`}>
              {step.title}
            </div>
            
            {step.description && (
              <div className="step-description">
                {step.description}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

StepIndicator.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      number: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string
    })
  ).isRequired,
  currentStep: PropTypes.number,
  completedSteps: PropTypes.arrayOf(PropTypes.number),
  errorSteps: PropTypes.arrayOf(PropTypes.number),
  vertical: PropTypes.bool,
  showProgress: PropTypes.bool,
  onStepClick: PropTypes.func,
  isLoading: PropTypes.bool,
  className: PropTypes.string,
};

export default React.memo(StepIndicator);
